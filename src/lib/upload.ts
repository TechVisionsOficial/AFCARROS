import "server-only";

/**
 * Validação de arquivos enviados (fotos e documentos).
 *
 * Regras de segurança:
 * - A extensão do arquivo salvo é derivada do TIPO permitido (allowlist), nunca
 *   do nome enviado pelo usuário. Isso impede salvar `.html`/`.svg`/`.js` que
 *   seriam executados pelo navegador (XSS armazenado).
 * - Há limite de tamanho por arquivo para evitar esgotar o disco (DoS).
 */

const MB = 1024 * 1024;

// Fotos vão para a pasta pública e são servidas como arquivo estático:
// só imagens rasterizadas (nada de SVG, que pode conter script).
const IMAGENS_PERMITIDAS: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};
const MAX_IMAGEM = 15 * MB;

// Documentos ficam na pasta privada (rota autenticada): PDF + imagens comuns.
const DOCUMENTOS_PERMITIDOS: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};
const MAX_DOCUMENTO = 25 * MB;

export type ResultadoValidacao =
  | { ok: true; ext: string }
  | { ok: false; erro: string };

function validar(
  arquivo: File,
  permitidos: Record<string, string>,
  maxBytes: number,
  rotulo: string,
): ResultadoValidacao {
  if (arquivo.size > maxBytes) {
    return {
      ok: false,
      erro: `${rotulo} muito grande (máx. ${Math.round(maxBytes / MB)} MB): ${arquivo.name}`,
    };
  }
  const ext = permitidos[arquivo.type];
  if (!ext) {
    return {
      ok: false,
      erro: `Tipo de arquivo não permitido: ${arquivo.name}. Aceitos: ${Object.values(permitidos).join(", ")}.`,
    };
  }
  return { ok: true, ext };
}

export function validarImagem(arquivo: File): ResultadoValidacao {
  return validar(arquivo, IMAGENS_PERMITIDAS, MAX_IMAGEM, "Imagem");
}

export function validarDocumento(arquivo: File): ResultadoValidacao {
  return validar(arquivo, DOCUMENTOS_PERMITIDOS, MAX_DOCUMENTO, "Documento");
}
