"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import type { OrigemLead, StatusKanban } from "@/generated/prisma/client";

const STATUS_VALIDOS: StatusKanban[] = [
  "NOVO",
  "ENTRAR_EM_CONTATO",
  "AGUARDANDO_CLIENTE",
  "RETORNAR_PARA_CLIENTE",
  "NEGOCIANDO",
  "VENDA_CONCLUIDA",
  "PERDIDO",
];

export async function moveLead(leadId: string, status: string) {
  await requireSession();
  if (!STATUS_VALIDOS.includes(status as StatusKanban)) return;

  await prisma.lead.update({
    where: { id: leadId },
    data: { statusKanban: status as StatusKanban },
  });

  revalidatePath("/painel/leads");
}

export type CreateLeadState = {
  error: string | null;
};

export async function createLead(
  _prevState: CreateLeadState,
  formData: FormData,
): Promise<CreateLeadState> {
  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  const veiculoId = String(formData.get("veiculoId") ?? "");
  const origem = String(formData.get("origem") ?? "");

  if (!nome) {
    return { error: "Informe o nome do cliente." };
  }
  if (!origem) {
    return { error: "Selecione a origem do lead." };
  }

  const session = await requireSession();

  const cliente = await prisma.cliente.create({
    data: { nome, telefone: telefone || null },
  });

  await prisma.lead.create({
    data: {
      clienteId: cliente.id,
      veiculoId: veiculoId || null,
      origem: origem as OrigemLead,
      statusKanban: "NOVO",
      responsavelId: session?.sub ?? null,
    },
  });

  revalidatePath("/painel/leads");
  return { error: null };
}
