"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { resolverCliente } from "@/lib/resolver-cliente";
import { salvarArquivo, ehUrlBlobPublico } from "@/lib/storage";
import { validarImagem } from "@/lib/upload";
import { VALORES_GASTO_VALIDOS } from "@/lib/gastos";
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

export async function criarVeiculo(
  _prevState: NovoVeiculoState,
  formData: FormData,
): Promise<NovoVeiculoState> {
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

  const gastos: { categoria: CategoriaGasto; valor: number; descricao: string | null }[] = [];
  const categorias = formData.getAll("gastoCategoria");
  const valores = formData.getAll("gastoValor");
  const descricoes = formData.getAll("gastoDescricao");
  for (let i = 0; i < categorias.length; i++) {
    const categoria = String(categorias[i]);
    const valor = parseNumero(valores[i]);
    if (!VALORES_GASTO_VALIDOS.has(categoria) || valor === null) continue;
    gastos.push({
      categoria: categoria as CategoriaGasto,
      valor,
      descricao: String(descricoes[i] ?? "").trim() || null,
    });
  }

  // Id gerado no cliente: as fotos (modo direto) já subiram em veiculos/<id>/,
  // então o veículo precisa ser criado com esse mesmo id. Só aceitamos o
  // formato de ID do banco para nunca virar caminho estranho.
  const veiculoIdRaw = String(formData.get("veiculoId") ?? "").trim();
  const veiculoId = /^[a-zA-Z0-9-]+$/.test(veiculoIdRaw) ? veiculoIdRaw : randomUUID();

  // Modo direto (produção): as fotos já foram enviadas ao Blob pelo navegador e
  // recebemos as URLs. Modo arquivo (local): os arquivos vêm na própria ação.
  const fotosUrls = lerFotosUrls(formData);

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
      id: veiculoId,
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
      gastos: gastos.length ? { createMany: { data: gastos.map((g) => ({ ...g, data: new Date() })) } } : undefined,
    },
  });

  if (fotosUrls.length > 0) {
    // Modo direto: valida que cada URL é do nosso Blob e desta pasta de veículo,
    // para uma submissão forjada não gravar URLs arbitrárias no banco.
    const validas = fotosUrls.filter(
      (u) => ehUrlBlobPublico(u) && u.includes(`/veiculos/${veiculo.id}/`),
    );
    if (validas.length > 0) {
      await prisma.veiculoFoto.createMany({
        data: validas.map((url, i) => ({ url, ordem: i, veiculoId: veiculo.id })),
      });
    }
  } else if (fotosValidadas.length > 0) {
    // Modo arquivo (local): grava cada foto enviada pela própria ação.
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
