"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { resolverCliente } from "@/lib/resolver-cliente";
import { apagarPrefixo } from "@/lib/storage";

export type MarcarVendidoState = {
  error: string | null;
  sucesso: boolean;
};

export async function marcarVendido(
  _prevState: MarcarVendidoState,
  formData: FormData,
): Promise<MarcarVendidoState> {
  await requireSession();

  const veiculoId = String(formData.get("veiculoId") ?? "");
  const precoVendaReal = Number(formData.get("precoVendaReal"));
  const vendidoEmRaw = String(formData.get("vendidoEm") ?? "");

  if (!veiculoId) {
    return { error: "Veículo inválido.", sucesso: false };
  }
  if (!Number.isFinite(precoVendaReal) || precoVendaReal <= 0) {
    return { error: "Informe um preço de venda válido.", sucesso: false };
  }
  if (!vendidoEmRaw) {
    return { error: "Informe a data da venda.", sucesso: false };
  }

  const compradorId = await resolverCliente(formData, "comprador");

  await prisma.veiculo.update({
    where: { id: veiculoId },
    data: {
      status: "VENDIDO",
      precoVendaReal,
      vendidoEm: new Date(vendidoEmRaw),
      compradorId,
    },
  });

  revalidatePath("/painel/estoque");
  revalidatePath("/painel");
  revalidatePath("/painel/clientes");
  revalidatePath("/");

  return { error: null, sucesso: true };
}

export async function excluirVeiculo(veiculoId: string) {
  await requireSession();
  if (!veiculoId) return;

  // apaga o veículo (fotos, gastos e documentos saem em cascata; leads têm o veículo desvinculado)
  await prisma.veiculo.delete({ where: { id: veiculoId } });

  // remove os arquivos do armazenamento (fotos públicas + documentos privados)
  await apagarPrefixo(`veiculos/${veiculoId}/`);
  await apagarPrefixo(`documentos/${veiculoId}/`);

  revalidatePath("/painel/estoque");
  revalidatePath("/painel");
  revalidatePath("/painel/clientes");
  revalidatePath("/");
}
