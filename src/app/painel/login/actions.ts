"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { estaBloqueado, registrarFalha, limparTentativas } from "@/lib/rate-limit";

export type LoginState = {
  error: string | null;
};

// Hash bcrypt de valor descartável. Usado quando o e-mail não existe, para que
// a resposta leve o mesmo tempo de um login real e não vaze quais e-mails são
// válidos (anti-enumeração por tempo de resposta).
const DUMMY_HASH = "$2b$12$HHv15UUrwOe.ldl7uS8.audImy3HYvVTUe86BqemdtNRZBHNoMLB6";

async function ipDoCliente(): Promise<string> {
  const h = await headers();
  const fwd = h.get("x-forwarded-for");
  return (fwd?.split(",")[0].trim() || h.get("x-real-ip") || "desconhecido");
}

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");

  if (!email || !senha) {
    return { error: "Preencha e-mail e senha." };
  }

  const chave = await ipDoCliente();
  if (estaBloqueado(chave)) {
    return {
      error: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
    };
  }

  const usuario = await prisma.usuario.findUnique({ where: { email } });

  // Compara sempre (contra o hash real ou o dummy) para tempo constante.
  const senhaValida = await bcrypt.compare(senha, usuario?.senhaHash ?? DUMMY_HASH);

  if (!usuario || !senhaValida) {
    registrarFalha(chave);
    return { error: "E-mail ou senha incorretos." };
  }

  limparTentativas(chave);
  await createSession({ sub: usuario.id, nome: usuario.nome, papel: usuario.papel });
  redirect("/painel");
}
