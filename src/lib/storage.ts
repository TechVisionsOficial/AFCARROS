import "server-only";
import { mkdir, readFile, rm, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, list, put } from "@vercel/blob";

/**
 * Armazenamento de arquivos (fotos e documentos).
 *
 * Dois modos, escolhidos automaticamente:
 * - PRODUÇÃO (Vercel): Vercel Blob. O disco da Vercel é descartável — arquivos
 *   gravados nele somem a cada deploy. Por isso tudo vai para o Blob.
 * - LOCAL (sem BLOB_READ_WRITE_TOKEN): disco, como sempre foi. Mantém o
 *   desenvolvimento funcionando sem depender de internet/token.
 *
 * ⚠️ Em produção sem token nós FALHAMOS ALTO em vez de cair para o disco.
 * Cair para o disco em produção "funcionaria" e depois apagaria os arquivos no
 * próximo deploy — um bug silencioso e destrutivo. Melhor quebrar na hora.
 *
 * Privacidade dos documentos: o Blob só oferece URL pública (porém impossível
 * de adivinhar). Por isso a URL do documento NUNCA vai para o navegador — ela
 * fica no banco e é lida pelo servidor na rota autenticada
 * /painel/documentos/[id]. Só quem está logado recebe o arquivo.
 */

const BLOB_HOST_SUFIXO = ".public.blob.vercel-storage.com";

function tokenBlob(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN;
}

function usarBlob(): boolean {
  const token = tokenBlob();
  if (!token && process.env.NODE_ENV === "production") {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN não configurado. Em produção os arquivos precisam ir " +
        "para o Vercel Blob — o disco da Vercel é apagado a cada deploy.",
    );
  }
  return Boolean(token);
}

function ehUrlBlob(valor: string): boolean {
  if (!valor.startsWith("http")) return false;
  try {
    return new URL(valor).hostname.endsWith(BLOB_HOST_SUFIXO);
  } catch {
    return false;
  }
}

/** Base no disco para o modo local. `publico` é servido como arquivo estático. */
function baseLocal(visibilidade: Visibilidade): string {
  return visibilidade === "publico"
    ? path.join(process.cwd(), "public", "uploads")
    : path.join(process.cwd(), "private-uploads");
}

export type Visibilidade = "publico" | "privado";

/**
 * Salva um arquivo e devolve a referência a guardar no banco.
 * - Blob: a URL completa (https://...)
 * - Local público: "/uploads/<chave>" (servido estaticamente)
 * - Local privado: "<chave>" (relativo a private-uploads)
 *
 * `chave` deve ser um caminho relativo seguro, ex.: "veiculos/<id>/<uuid>.jpg".
 */
export async function salvarArquivo({
  chave,
  buffer,
  contentType,
  visibilidade,
}: {
  chave: string;
  buffer: Buffer;
  contentType: string;
  visibilidade: Visibilidade;
}): Promise<string> {
  if (usarBlob()) {
    const { url } = await put(chave, buffer, {
      access: "public",
      contentType,
      token: tokenBlob(),
      // a chave já é única (uuid) — não deixar o Blob acrescentar sufixo,
      // senão não conseguimos apagar por prefixo depois.
      addRandomSuffix: false,
    });
    return url;
  }

  const destino = path.join(baseLocal(visibilidade), chave);
  await mkdir(path.dirname(destino), { recursive: true });
  await writeFile(destino, buffer);
  return visibilidade === "publico" ? `/uploads/${chave}` : chave;
}

/** Apaga um arquivo pela referência guardada no banco. Nunca lança. */
export async function apagarArquivo(referencia: string): Promise<void> {
  try {
    if (ehUrlBlob(referencia)) {
      await del(referencia, { token: tokenBlob() });
      return;
    }
    if (referencia.startsWith("/uploads/")) {
      await unlink(path.join(process.cwd(), "public", referencia.replace(/^\//, "")));
      return;
    }
    await unlink(path.join(process.cwd(), "private-uploads", referencia));
  } catch {
    // arquivo já não existe — tudo bem
  }
}

/** Apaga tudo sob um prefixo, ex.: "veiculos/<id>/". Nunca lança. */
export async function apagarPrefixo(prefixo: string): Promise<void> {
  try {
    if (usarBlob()) {
      const { blobs } = await list({ prefix: prefixo, token: tokenBlob() });
      if (blobs.length > 0) {
        await del(
          blobs.map((b) => b.url),
          { token: tokenBlob() },
        );
      }
      return;
    }
    // local: o mesmo prefixo existe nas duas bases (fotos públicas / docs privados)
    await rm(path.join(baseLocal("publico"), prefixo), { recursive: true, force: true });
    await rm(path.join(baseLocal("privado"), prefixo), { recursive: true, force: true });
  } catch {
    // nada a apagar — tudo bem
  }
}

/**
 * Lê um arquivo privado (documentos) no servidor, para a rota autenticada.
 * Devolve null se não existir.
 */
export async function lerArquivo(
  referencia: string,
): Promise<{ buffer: Buffer; contentType: string | null } | null> {
  if (referencia.startsWith("http")) {
    // Só buscamos URLs do nosso próprio Blob. Sem essa checagem, um valor
    // adulterado no banco viraria SSRF (o servidor buscaria qualquer endereço).
    if (!ehUrlBlob(referencia)) return null;
    const resp = await fetch(referencia);
    if (!resp.ok) return null;
    return {
      buffer: Buffer.from(await resp.arrayBuffer()),
      contentType: resp.headers.get("content-type"),
    };
  }

  // Local: caminho relativo dentro de private-uploads. Bloqueia sair da pasta.
  const base = path.join(process.cwd(), "private-uploads");
  const caminho = path.join(base, referencia);
  if (!caminho.startsWith(base + path.sep)) return null;
  try {
    return { buffer: await readFile(caminho), contentType: null };
  } catch {
    return null;
  }
}
