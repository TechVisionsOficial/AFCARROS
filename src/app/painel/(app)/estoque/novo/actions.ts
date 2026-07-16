"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { resolverCliente } from "@/lib/resolver-cliente";
import { salvarArquivo } from "@/lib/storage";
import { validarImagem } from "@/lib/upload";
import type {
  CategoriaGasto,
  CondicaoVeiculo,
  OrigemAquisicao,
  TipoVeiculo,
} from "@/generated/prisma/client";

export type NovoVeiculoState = {
  error: string | null;
};

const TIPOS: TipoVeiculo[] = ["CARRO", "MOTO"];
const CONDICOES: CondicaoVeiculo[] = ["NOVO", "SEMINOVO"];
const ORIGENS: OrigemAquisicao[] = ["LEILAO", "TROCA", "PARTICULAR", "CONSIGNADO", "OUTRO"];
const CATEGORIAS_GASTO: CategoriaGasto[] = [
  "MANUTENCAO",
  "DOCUMENTACAO",
  "ESTETICA",
  "FUNILARIA",
  "OUTROS",
];

function parseNumero(valor: FormDataEntryValue | null): number | null {
  if (!valor) return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

export async function criarVeiculo(
  _prevState: NovoVeiculoState,
  formData: FormData,
): Promise<NovoVeiculoState> {
  await requireSession();

  const tipo = String(formData.get("tipo") ?? "");
  const marca = String(formData.get("marca") ?? "").trim();
  const modelo = String(formData.get("modelo") ?? "").trim();
  const ano = parseNumero(formData.get("ano"));
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
  if (!ano || !km) {
    return { error: "Informe ano e km válidos." };
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

  const gastos: { categoria: CategoriaGasto; valor: number; descricao: string | null }[] = [];
  const categorias = formData.getAll("gastoCategoria");
  const valores = formData.getAll("gastoValor");
  const descricoes = formData.getAll("gastoDescricao");
  for (let i = 0; i < categorias.length; i++) {
    const categoria = String(categorias[i]);
    const valor = parseNumero(valores[i]);
    if (!CATEGORIAS_GASTO.includes(categoria as CategoriaGasto) || valor === null) continue;
    gastos.push({
      categoria: categoria as CategoriaGasto,
      valor,
      descricao: String(descricoes[i] ?? "").trim() || null,
    });
  }

  const fotos = formData.getAll("fotos").filter((f): f is File => f instanceof File && f.size > 0);
  const fotosValidadas: { foto: File; ext: string }[] = [];
  for (const foto of fotos) {
    const v = validarImagem(foto);
    if (!v.ok) return { error: v.erro };
    fotosValidadas.push({ foto, ext: v.ext });
  }

  const fornecedorId = await resolverCliente(formData, "fornecedor");

  const veiculo = await prisma.veiculo.create({
    data: {
      tipo: tipo as TipoVeiculo,
      marca,
      modelo,
      ano,
      km,
      condicao: condicao as CondicaoVeiculo,
      descricao: descricao || null,
      precoVenda,
      precoCompra,
      precoMinimo,
      dataAquisicao: dataAquisicaoRaw ? new Date(dataAquisicaoRaw) : null,
      origemAquisicao,
      fornecedorId,
      gastos: gastos.length ? { createMany: { data: gastos.map((g) => ({ ...g, data: new Date() })) } } : undefined,
    },
  });

  if (fotosValidadas.length > 0) {
    const fotosData = [];
    for (let i = 0; i < fotosValidadas.length; i++) {
      const { foto, ext } = fotosValidadas[i];
      const url = await salvarArquivo({
        chave: `veiculos/${veiculo.id}/${randomUUID()}${ext}`,
        buffer: Buffer.from(await foto.arrayBuffer()),
        contentType: foto.type,
        visibilidade: "publico",
      });
      fotosData.push({ url, ordem: i });
    }

    await prisma.veiculoFoto.createMany({
      data: fotosData.map((f) => ({ ...f, veiculoId: veiculo.id })),
    });
  }

  revalidatePath("/");
  revalidatePath("/painel/clientes");
  redirect("/painel/estoque");
}
