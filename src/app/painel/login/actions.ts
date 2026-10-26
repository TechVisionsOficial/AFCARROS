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

  // Falha de banco (conexão caída, banco acordando) não pode virar tela de
  // erro: devolve uma mensagem e registra no log da Vercel com a marca [login].
  // Não conta como tentativa errada, e o log não leva o e-mail digitado.
  let usuario;
  try {
    usuario = await prisma.usuario.findUnique({ where: { email } });
  } catch (err) {
    const e = err as { name?: string; code?: string; message?: string; meta?: unknown };
    console.error("[login] falha ao consultar o banco", {
      nome: e.name,
      codigo: e.code,
      // Detalhes do erro do driver (tipo, código original) — sem valores.
      meta: e.meta,
      // A mensagem do Prisma mistura "Invalid ... invocation in", caminho do
      // arquivo e trecho de código; fica só a linha que descreve a causa.
      mensagem: e.message
        ?.split("\n")
        .map((l) => l.trim())
        .filter((l) => l && !l.includes("invocation in") && !/^(→\s*)?\d+\s/.test(l) && !l.startsWith("/"))
        .at(-1)
        ?.slice(0, 200),
    });
    return { error: "Não foi possível conectar agora. Tente de novo em alguns segundos." };
  }

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
