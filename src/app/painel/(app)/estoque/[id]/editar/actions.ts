"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { resolverCliente } from "@/lib/resolver-cliente";
import { apagarArquivo, salvarArquivo, ehUrlBlobPublico } from "@/lib/storage";
import { validarImagem, validarDocumento } from "@/lib/upload";
import { VALORES_GASTO_VALIDOS } from "@/lib/gastos";
import type {
  CategoriaDocumento,
  CategoriaGasto,
  CondicaoVeiculo,
  OrigemAquisicao,
  TipoVeiculo,
} from "@/generated/prisma/client";

export type EditarVeiculoState = {
  error: string | null;
};

const TIPOS: TipoVeiculo[] = ["CARRO", "MOTO"];
const CONDICOES: CondicaoVeiculo[] = ["NOVO", "SEMINOVO"];
const ORIGENS: OrigemAquisicao[] = ["LEILAO", "TROCA", "PARTICULAR", "CONSIGNADO", "OUTRO"];
const CATEGORIAS_DOC: CategoriaDocumento[] = [
  "LAUDO",
  "DOCUMENTACAO",
  "TRANSFERENCIA",
  "IPVA",
  "VISTORIA",
  "OUTRO",
];
function parseNumero(valor: FormDataEntryValue | null): number | null {
  if (!valor) return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

/** Lê o campo escondido `fotosUrls` (JSON de URLs) enviado no modo direto. */
function lerFotosUrls(formData: FormData): string[] {
  const raw = String(formData.get("fotosUrls") ?? "");
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((u): u is string => typeof u === "string") : [];
  } catch {
    return [];
  }
}

export async function atualizarVeiculo(
  veiculoId: string,
  _prevState: EditarVeiculoState,
  formData: FormData,
): Promise<EditarVeiculoState> {
  await requireSession();

  const tipo = String(formData.get("tipo") ?? "");
  const marca = String(formData.get("marca") ?? "").trim();
  const modelo = String(formData.get("modelo") ?? "").trim();
  const ano = parseNumero(formData.get("ano"));
  const anoFabricacao = parseNumero(formData.get("anoFabricacao"));
  const km = parseNumero(formData.get("km"));
  const condicao = String(formData.get("condicao") ?? "");
  const descricao = String(formData.get("descricao") ?? "").trim();

  const precoVenda = parseNumero(formData.get("precoVenda"));
  const precoCompra = parseNumero(formData.get("precoCompra"));
  const precoMinimo = parseNumero(formData.get("precoMinimo"));
  const dataAquisicaoRaw = String(formData.get("dataAquisicao") ?? "");
  const origemAquisicaoRaw = String(formData.get("origemAquisicao") ?? "");

  if (!TIPOS.includes(tipo as TipoVeiculo)) {
    return { error: "Selecione o tipo do veículo." };
  }
  if (!marca || !modelo) {
    return { error: "Informe marca e modelo." };
  }
  if (!ano || !anoFabricacao || km === null || km < 0) {
    return { error: "Informe ano de fabricação, ano modelo e km válidos." };
  }
  if (!CONDICOES.includes(condicao as CondicaoVeiculo)) {
    return { error: "Selecione a condição do veículo." };
  }
  if (precoVenda === null || precoCompra === null || precoMinimo === null) {
    return { error: "Preencha preço de compra, venda e mínimo." };
  }

  const origemAquisicao = ORIGENS.includes(origemAquisicaoRaw as OrigemAquisicao)
    ? (origemAquisicaoRaw as OrigemAquisicao)
    : null;

  const novosGastos: { categoria: CategoriaGasto; valor: number; descricao: string | null }[] = [];
  const categorias = formData.getAll("gastoCategoria");
  const valores = formData.getAll("gastoValor");
  for (let i = 0; i < categorias.length; i++) {
    const categoria = String(categorias[i]);
    const valor = parseNumero(valores[i]);
    if (!VALORES_GASTO_VALIDOS.has(categoria) || valor === null) continue;
    novosGastos.push({ categoria: categoria as CategoriaGasto, valor, descricao: null });
  }

  // Modo direto (produção): URLs já enviadas ao Blob. Modo arquivo (local): files.
  const fotosUrls = lerFotosUrls(formData);

  const fotos = formData.getAll("fotos").filter((f): f is File => f instanceof File && f.size > 0);
  const fotosValidadas: { foto: File; ext: string }[] = [];
  for (const foto of fotos) {
    const v = validarImagem(foto);
    if (!v.ok) return { error: v.erro };
    fotosValidadas.push({ foto, ext: v.ext });
  }

  const fornecedorId = await resolverCliente(formData, "fornecedor");

  await prisma.veiculo.update({
    where: { id: veiculoId },
    data: {
      tipo: tipo as TipoVeiculo,
      marca,
      modelo,
      ano,
      anoFabricacao,
      km,
      condicao: condicao as CondicaoVeiculo,
      descricao: descricao || null,
      precoVenda,
      precoCompra,
      precoMinimo,
      dataAquisicao: dataAquisicaoRaw ? new Date(dataAquisicaoRaw) : null,
      origemAquisicao,
      fornecedorId,
      gastos: novosGastos.length
        ? { createMany: { data: novosGastos.map((g) => ({ ...g, data: new Date() })) } }
        : undefined,
    },
  });

  if (fotosUrls.length > 0) {
    // Modo direto: valida cada URL (nosso Blob + pasta deste veículo) e anexa
    // depois das fotos que já existem.
    const validas = fotosUrls.filter(
      (u) => ehUrlBlobPublico(u) && u.includes(`/veiculos/${veiculoId}/`),
    );
    if (validas.length > 0) {
      const maiorOrdem = await prisma.veiculoFoto.count({ where: { veiculoId } });
      await prisma.veiculoFoto.createMany({
        data: validas.map((url, i) => ({ url, ordem: maiorOrdem + i, veiculoId })),
      });
    }
  } else if (fotosValidadas.length > 0) {
    // Modo arquivo (local): grava cada foto enviada pela própria ação.
    const maiorOrdem = await prisma.veiculoFoto.count({ where: { veiculoId } });

    const fotosData = [];
    for (let i = 0; i < fotosValidadas.length; i++) {
      const { foto, ext } = fotosValidadas[i];
      const url = await salvarArquivo({
        chave: `veiculos/${veiculoId}/${randomUUID()}${ext}`,
        buffer: Buffer.from(await foto.arrayBuffer()),
        contentType: foto.type,
        visibilidade: "publico",
      });
      fotosData.push({ url, ordem: maiorOrdem + i });
    }

    await prisma.veiculoFoto.createMany({
      data: fotosData.map((f) => ({ ...f, veiculoId })),
    });
  }

  revalidatePath("/painel/estoque");
  revalidatePath(`/painel/estoque/${veiculoId}/editar`);
  revalidatePath("/painel");
  revalidatePath("/painel/clientes");
  revalidatePath("/");
  redirect("/painel/estoque");
}

export async function removerFoto(fotoId: string, veiculoId: string) {
  await requireSession();
  const foto = await prisma.veiculoFoto.findUnique({ where: { id: fotoId } });
  if (!foto) return;

  await prisma.veiculoFoto.delete({ where: { id: fotoId } });
  await apagarArquivo(foto.url);

  revalidatePath(`/painel/estoque/${veiculoId}/editar`);
  revalidatePath("/painel/estoque");
  revalidatePath("/");
}

export async function removerGasto(gastoId: string, veiculoId: string) {
  await requireSession();
  await prisma.gasto.delete({ where: { id: gastoId } });
  revalidatePath(`/painel/estoque/${veiculoId}/editar`);
  revalidatePath("/painel/estoque");
  revalidatePath("/painel");
}

export type DocumentoState = { error: string | null };

export async function adicionarDocumento(
  veiculoId: string,
  _prevState: DocumentoState,
  formData: FormData,
): Promise<DocumentoState> {
  await requireSession();

  // veiculoId compõe o caminho no disco — só aceitamos o formato de ID do banco
  // (letras, números, hífen) para nunca permitir "../" e sair da pasta privada.
  if (!/^[a-zA-Z0-9_-]+$/.test(veiculoId)) {
    return { error: "Veículo inválido." };
  }

  const categoria = String(formData.get("categoria") ?? "");
  const arquivos = formData
    .getAll("documentos")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (!CATEGORIAS_DOC.includes(categoria as CategoriaDocumento)) {
    return { error: "Selecione o tipo do documento." };
  }
  if (arquivos.length === 0) {
    return { error: "Escolha ao menos um arquivo." };
  }

  const arquivosValidados: { arquivo: File; ext: string }[] = [];
  for (const arquivo of arquivos) {
    const v = validarDocumento(arquivo);
    if (!v.ok) return { error: v.erro };
    arquivosValidados.push({ arquivo, ext: v.ext });
  }

  // Documentos NUNCA são servidos como arquivo estático. A coluna `url` guarda a
  // referência (caminho local ou URL do Blob) e essa referência não vai para o
  // navegador — o acesso é só pela rota autenticada /painel/documentos/<id>.
  const registros = [];
  for (const { arquivo, ext } of arquivosValidados) {
    const url = await salvarArquivo({
      chave: `documentos/${veiculoId}/${randomUUID()}${ext}`,
      buffer: Buffer.from(await arquivo.arrayBuffer()),
      contentType: arquivo.type,
      visibilidade: "privado",
    });
    registros.push({
      veiculoId,
      categoria: categoria as CategoriaDocumento,
      nome: arquivo.name,
      url,
    });
  }

  await prisma.veiculoDocumento.createMany({ data: registros });

  revalidatePath(`/painel/estoque/${veiculoId}/editar`);
  return { error: null };
}

export async function removerDocumento(documentoId: string, veiculoId: string) {
  await requireSession();
  const doc = await prisma.veiculoDocumento.findUnique({ where: { id: documentoId } });
  if (!doc) return;

  await prisma.veiculoDocumento.delete({ where: { id: documentoId } });
  await apagarArquivo(doc.url);

  revalidatePath(`/painel/estoque/${veiculoId}/editar`);
}
