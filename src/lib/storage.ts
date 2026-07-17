import "server-only";
import { mkdir, readFile, rm, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { del, get, list, put } from "@vercel/blob";

/**
 * Armazenamento de arquivos (fotos e documentos).
 *
 * Em produção usamos DOIS stores do Vercel Blob, porque os dois tipos de arquivo
 * têm necessidades opostas (e o acesso é definido por store, sem volta):
 *
 * - FOTOS  -> store PÚBLICO. Qualquer visitante precisa ver no site; a URL vai
 *             direto no <img> e é servida pelo CDN. Guardamos a URL no banco.
 * - DOCS   -> store PRIVADO. Leitura exige token; ninguém baixa por URL. Só a
 *             rota autenticada /painel/documentos/[id] entrega o arquivo.
 *             Guardamos o CAMINHO (pathname) no banco, não uma URL.
 *
 * LOCAL (sem tokens): grava em disco, como sempre. Mantém o dev funcionando.
 *
 * ⚠️ Em produção sem token nós FALHAMOS ALTO em vez de cair para o disco. Cair
 * para o disco "funcionaria" e depois apagaria os arquivos no próximo deploy —
 * um bug silencioso e destrutivo. Melhor quebrar na hora.
 */

export type Visibilidade = "publico" | "privado";

/** Store público (fotos). A Vercel cria esta variável ao conectar o store. */
function tokenFotos(): string | undefined {
  return process.env.BLOB_READ_WRITE_TOKEN;
}
/** Store privado (documentos). Nome definido por nós ao conectar o 2º store. */
function tokenDocumentos(): string | undefined {
  return process.env.BLOB_DOCUMENTOS_READ_WRITE_TOKEN;
}

function token(visibilidade: Visibilidade): string | undefined {
  return visibilidade === "publico" ? tokenFotos() : tokenDocumentos();
}

/** Usa o Blob? Em produção é obrigatório — sem token, erro explícito. */
function usarBlob(visibilidade: Visibilidade): boolean {
  const t = token(visibilidade);
  if (!t && process.env.NODE_ENV === "production") {
    const nome =
      visibilidade === "publico"
        ? "BLOB_READ_WRITE_TOKEN (store público das fotos)"
        : "BLOB_DOCUMENTOS_READ_WRITE_TOKEN (store privado dos documentos)";
    throw new Error(
      `${nome} não configurado. Em produção os arquivos precisam ir para o Vercel ` +
        "Blob — o disco da Vercel é apagado a cada deploy.",
    );
  }
  return Boolean(t);
}

function baseLocal(visibilidade: Visibilidade): string {
  return visibilidade === "publico"
    ? path.join(process.cwd(), "public", "uploads")
    : path.join(process.cwd(), "private-uploads");
}

/**
 * Salva um arquivo e devolve a referência a guardar no banco.
 * - Foto (público): URL completa (Blob) ou "/uploads/<chave>" (local)
 * - Documento (privado): o caminho "<chave>" nos dois modos — nunca uma URL
 *   pública, justamente para não existir link que vaze.
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
  if (usarBlob(visibilidade)) {
    if (visibilidade === "publico") {
      const { url } = await put(chave, buffer, {
        access: "public",
        contentType,
        token: tokenFotos(),
        addRandomSuffix: false, // a chave já tem uuid; mantém o prefixo previsível
      });
      return url;
    }
    await put(chave, buffer, {
      access: "private",
      contentType,
      token: tokenDocumentos(),
      addRandomSuffix: false,
    });
    // guardamos o caminho: é o que get() usa para ler
    return chave;
  }

  const destino = path.join(baseLocal(visibilidade), chave);
  await mkdir(path.dirname(destino), { recursive: true });
  await writeFile(destino, buffer);
  return visibilidade === "publico" ? `/uploads/${chave}` : chave;
}

/** Uma referência que começa com http só existe no modo público (foto). */
function ehUrl(referencia: string): boolean {
  return referencia.startsWith("http://") || referencia.startsWith("https://");
}

/** Apaga um arquivo pela referência guardada no banco. Nunca lança. */
export async function apagarArquivo(referencia: string): Promise<void> {
  try {
    // Foto no Blob (URL) ou foto local ("/uploads/..."): visibilidade pública.
    if (ehUrl(referencia)) {
      await del(referencia, { token: tokenFotos() });
      return;
    }
    if (referencia.startsWith("/uploads/")) {
      await unlink(path.join(process.cwd(), "public", referencia.replace(/^\//, "")));
      return;
    }
    // Sobrou o documento (caminho relativo).
    if (usarBlob("privado")) {
      await del(referencia, { token: tokenDocumentos() });
      return;
    }
    await unlink(path.join(process.cwd(), "private-uploads", referencia));
  } catch {
    // arquivo já não existe — tudo bem
  }
}

/** Apaga tudo sob um prefixo, ex.: "veiculos/<id>/". Nunca lança. */
export async function apagarPrefixo(prefixo: string): Promise<void> {
  // o prefixo pode existir nos dois stores (fotos e documentos)
  for (const vis of ["publico", "privado"] as const) {
    try {
      if (usarBlob(vis)) {
        const t = token(vis);
        const { blobs } = await list({ prefix: prefixo, token: t });
        if (blobs.length > 0) {
          await del(
            blobs.map((b) => b.url),
            { token: t },
          );
        }
      } else {
        await rm(path.join(baseLocal(vis), prefixo), { recursive: true, force: true });
      }
    } catch {
      // nada a apagar — tudo bem
    }
  }
}

/**
 * Lê um documento privado no servidor, para a rota autenticada.
 * Devolve null se não existir ou se a referência não for válida.
 */
export async function lerArquivo(
  referencia: string,
): Promise<{ buffer: Buffer; contentType: string | null } | null> {
  // Documento nunca deveria ser uma URL. Se for, recusamos: além de errado,
  // buscar uma URL arbitrária vinda do banco seria um SSRF.
  if (ehUrl(referencia)) return null;

  if (usarBlob("privado")) {
    const r = await get(referencia, {
      access: "private",
      token: tokenDocumentos(),
    });
    if (!r || r.statusCode !== 200 || !r.stream) return null;
    const chunks: Uint8Array[] = [];
    // @ts-expect-error - stream é um ReadableStream (web); iterável no Node 18+
    for await (const c of r.stream) chunks.push(c);
    return {
      buffer: Buffer.concat(chunks),
      contentType: r.blob?.contentType ?? null,
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
