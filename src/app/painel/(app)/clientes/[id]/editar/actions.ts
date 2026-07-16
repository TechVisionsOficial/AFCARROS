"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import type { QualidadeRelacao } from "@/generated/prisma/client";

export type EditarClienteState = {
  error: string | null;
};

const QUALIDADES: QualidadeRelacao[] = ["VERDE", "AMARELO", "VERMELHO"];

export async function atualizarCliente(
  clienteId: string,
  _prevState: EditarClienteState,
  formData: FormData,
): Promise<EditarClienteState> {
  await requireSession();

  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const qualidade = String(formData.get("qualidadeRelacao") ?? "");

  if (!nome) {
    return { error: "Informe o nome do cliente." };
  }
  if (!QUALIDADES.includes(qualidade as QualidadeRelacao)) {
    return { error: "Selecione a qualidade da relação." };
  }

  await prisma.cliente.update({
    where: { id: clienteId },
    data: {
      nome,
      telefone: telefone || null,
      email: email || null,
      qualidadeRelacao: qualidade as QualidadeRelacao,
    },
  });

  revalidatePath("/painel/clientes");
  redirect("/painel/clientes");
}
