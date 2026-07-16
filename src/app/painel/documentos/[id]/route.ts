import path from "node:path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { lerArquivo } from "@/lib/storage";

const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".heic": "image/heic",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // Defesa em profundidade: o middleware já bloqueia /painel/*, mas confirmamos aqui.
  const session = await getSession();
  if (!session) {
    return new NextResponse("Não autorizado", { status: 401 });
  }

  const { id } = await params;
  const doc = await prisma.veiculoDocumento.findUnique({ where: { id } });
  if (!doc) {
    return new NextResponse("Documento não encontrado", { status: 404 });
  }

  // O servidor busca o arquivo (do Blob ou do disco local) e o entrega aqui.
  // A referência guardada em doc.url NUNCA vai para o navegador — é o que mantém
  // o documento acessível só para quem está logado. lerArquivo() também recusa
  // URLs que não sejam do nosso próprio Blob (proteção contra SSRF).
  const arquivo = await lerArquivo(doc.url);
  if (!arquivo) {
    return new NextResponse("Arquivo não encontrado", { status: 404 });
  }

  // Preferimos o tipo derivado da extensão (lista fechada) em vez do que o
  // armazenamento informar — evita servir algo executável por engano.
  const ext = path.extname(doc.url.split("?")[0]).toLowerCase();
  const contentType =
    CONTENT_TYPES[ext] ?? arquivo.contentType ?? "application/octet-stream";
  const nomeSeguro = doc.nome.replace(/["\r\n]/g, "");

  return new NextResponse(new Uint8Array(arquivo.buffer), {
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `inline; filename="${nomeSeguro}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
