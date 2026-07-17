import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

/**
 * Emite o token para o navegador enviar UMA foto direto ao Vercel Blob, sem
 * passar pela server action (que tem limite de tamanho). Fluxo:
 *
 *   navegador  --(pede token)-->  esta rota  --(valida login)-->  token
 *   navegador  --(sobe a foto direto no Blob)-->  Blob devolve a URL
 *   navegador  --(envia as URLs no submit do formulário)-->  server action
 *
 * A rota só emite o token para quem está logado e apenas para imagens dentro da
 * pasta veiculos/. A gravação no banco continua sendo feita pela server action,
 * que revalida as URLs (ver ehUrlBlobPublico).
 */
export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request,
      // Store PÚBLICO (fotos). Sem isto o upload iria para o store errado.
      token: process.env.BLOB_READ_WRITE_TOKEN,
      onBeforeGenerateToken: async (pathname) => {
        const sessao = await getSession();
        if (!sessao) throw new Error("Não autorizado.");
        if (!pathname.startsWith("veiculos/") && !pathname.startsWith("ofertas/")) {
          throw new Error("Caminho de foto inválido.");
        }
        return {
          allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
          maximumSizeInBytes: 15 * 1024 * 1024,
          addRandomSuffix: false,
        };
      },
      onUploadCompleted: async () => {
        // Nada a fazer: o cliente envia as URLs no submit do formulário do
        // veículo, e a server action as grava junto com o resto dos dados.
      },
    });

    return NextResponse.json(json);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
