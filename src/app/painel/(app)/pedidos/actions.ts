"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { apagarPrefixo, salvarArquivo } from "@/lib/storage";
import { validarImagem } from "@/lib/upload";
import type {
  StatusOferta,
  StatusPedido,
  TipoVeiculo,
} from "@/generated/prisma/client";

const TIPOS: TipoVeiculo[] = ["CARRO", "MOTO"];
const STATUS_PEDIDO: StatusPedido[] = ["ABERTO", "ATENDIDO", "CANCELADO"];
const STATUS_OFERTA: StatusOferta[] = ["ABERTA", "RECUSADA", "COMPRADA"];

function parseNumero(valor: FormDataEntryValue | null): number | null {
  if (!valor || String(valor).trim() === "") return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

// Resolve o cliente: usa o selecionado, ou cria um novo se o nome foi digitado.
async function resolverClienteId(formData: FormData): Promise<string | null> {
  const novoNome = String(formData.get("novoClienteNome") ?? "").trim();
  if (novoNome) {
    const novoTelefone = String(formData.get("novoClienteTelefone") ?? "").trim();
    const cliente = await prisma.cliente.create({
      data: { nome: novoNome, telefone: novoTelefone || null },
    });
    return cliente.id;
  }
  const clienteId = String(formData.get("clienteId") ?? "");
  return clienteId || null;
}

export type PedidoState = { error: string | null };

export async function criarPedido(
  _prevState: PedidoState,
  formData: FormData,
): Promise<PedidoState> {
  await requireSession();

  const tipo = String(formData.get("tipo") ?? "");
  const descricao = String(formData.get("descricao") ?? "").trim();
  const observacao = String(formData.get("observacao") ?? "").trim();

  if (!TIPOS.includes(tipo as TipoVeiculo)) {
    return { error: "Selecione se é carro ou moto." };
  }
  if (!descricao) {
    return { error: "Descreva o que o cliente procura." };
  }

  const clienteId = await resolverClienteId(formData);
  if (!clienteId) {
    return { error: "Selecione um cliente ou informe um novo." };
  }

  await prisma.pedido.create({
    data: {
      clienteId,
      tipo: tipo as TipoVeiculo,
      descricao,
      observacao: observacao || null,
    },
  });

  revalidatePath("/painel/pedidos");
  revalidatePath("/painel/clientes");
  return { error: null };
}

export type OfertaState = { error: string | null };

export async function criarOferta(
  _prevState: OfertaState,
  formData: FormData,
): Promise<OfertaState> {
  await requireSession();

  const tipo = String(formData.get("tipo") ?? "");
  const marca = String(formData.get("marca") ?? "").trim();
  const modelo = String(formData.get("modelo") ?? "").trim();
  const ano = parseNumero(formData.get("ano"));
  const km = parseNumero(formData.get("km"));
  const precoPedido = parseNumero(formData.get("precoPedido"));
  const observacao = String(formData.get("observacao") ?? "").trim();

  if (!TIPOS.includes(tipo as TipoVeiculo)) {
    return { error: "Selecione se é carro ou moto." };
  }
  if (!marca || !modelo) {
    return { error: "Informe marca e modelo do veículo ofertado." };
  }

  const clienteId = await resolverClienteId(formData);
  if (!clienteId) {
    return { error: "Selecione um cliente ou informe um novo." };
  }

  // Valida as fotos ANTES de criar a oferta, para não deixar registro órfão.
  const fotos = formData.getAll("fotos").filter((f): f is File => f instanceof File && f.size > 0);
  const fotosValidadas: { foto: File; ext: string }[] = [];
  for (const foto of fotos) {
    const v = validarImagem(foto);
    if (!v.ok) return { error: v.erro };
    fotosValidadas.push({ foto, ext: v.ext });
  }

  const oferta = await prisma.oferta.create({
    data: {
      clienteId,
      tipo: tipo as TipoVeiculo,
      marca,
      modelo,
      ano,
      km,
      precoPedido,
      observacao: observacao || null,
    },
  });

  if (fotosValidadas.length > 0) {
    const fotosData = [];
    for (let i = 0; i < fotosValidadas.length; i++) {
      const { foto, ext } = fotosValidadas[i];
      const url = await salvarArquivo({
        chave: `ofertas/${oferta.id}/${randomUUID()}${ext}`,
        buffer: Buffer.from(await foto.arrayBuffer()),
        contentType: foto.type,
        visibilidade: "publico",
      });
      fotosData.push({ url, ordem: i });
    }

    await prisma.ofertaFoto.createMany({
      data: fotosData.map((f) => ({ ...f, ofertaId: oferta.id })),
    });
  }

  revalidatePath("/painel/pedidos");
  revalidatePath("/painel/clientes");
  return { error: null };
}

export async function mudarStatusPedido(pedidoId: string, status: string) {
  await requireSession();
  if (!STATUS_PEDIDO.includes(status as StatusPedido)) return;
  await prisma.pedido.update({
    where: { id: pedidoId },
    data: { status: status as StatusPedido },
  });
  revalidatePath("/painel/pedidos");
}

export async function mudarStatusOferta(ofertaId: string, status: string) {
  await requireSession();
  if (!STATUS_OFERTA.includes(status as StatusOferta)) return;
  await prisma.oferta.update({
    where: { id: ofertaId },
    data: { status: status as StatusOferta },
  });
  revalidatePath("/painel/pedidos");
}

export async function removerPedido(pedidoId: string) {
  await requireSession();
  await prisma.pedido.delete({ where: { id: pedidoId } });
  revalidatePath("/painel/pedidos");
}

export async function removerOferta(ofertaId: string) {
  await requireSession();
  await prisma.oferta.delete({ where: { id: ofertaId } });
  await apagarPrefixo(`ofertas/${ofertaId}/`);
  revalidatePath("/painel/pedidos");
}
