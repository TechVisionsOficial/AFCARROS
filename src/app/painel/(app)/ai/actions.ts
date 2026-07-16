"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { montarContexto } from "@/lib/ai/contexto";
import { chamarIA, IANaoConfiguradaError, type MensagemChat } from "@/lib/ai/provider";

export type PerguntaState = { error: string | null };

// Quantas mensagens anteriores mandar como memória da conversa.
const MEMORIA = 10;

function persona(contexto: string): string {
  const hoje = new Date().toLocaleDateString("pt-BR");
  return [
    "Você é o AFCARROS AI, o assistente interno da AFCARROS, uma loja que compra e",
    "revende carros e motos novos e seminovos. Você ajuda o dono e a equipe a consultar",
    "o estoque, entender gastos e vendas (mensais e anuais), margens, clientes e leads.",
    "",
    "Regras:",
    "- Responda SEMPRE em português, de forma objetiva e comercial.",
    "- Use SOMENTE os dados reais da loja fornecidos abaixo. Não invente veículos, preços,",
    "  clientes nem valores. Se um dado não estiver disponível, diga claramente o que falta.",
    "- Ao falar de dinheiro, use reais (R$) e seja preciso. Mostre as contas quando ajudar.",
    "- Seja direto: primeiro a resposta, depois o detalhe se for útil.",
    `- Hoje é ${hoje}.`,
    "",
    "=== DADOS ATUAIS DA LOJA (atualizados agora) ===",
    contexto,
  ].join("\n");
}

export async function perguntar(
  _prev: PerguntaState,
  formData: FormData,
): Promise<PerguntaState> {
  await requireSession();

  const pergunta = String(formData.get("pergunta") ?? "").trim();
  if (!pergunta) return { error: "Digite uma pergunta." };
  if (pergunta.length > 2000) return { error: "Pergunta muito longa." };

  // Memória: últimas mensagens da conversa, em ordem cronológica.
  const anteriores = await prisma.mensagemAI.findMany({
    orderBy: { criadoEm: "desc" },
    take: MEMORIA,
  });
  const historico: MensagemChat[] = anteriores
    .reverse()
    .map((m) => ({
      papel: m.papel === "USUARIO" ? "usuario" : "assistente",
      conteudo: m.conteudo,
    }));
  historico.push({ papel: "usuario", conteudo: pergunta });

  let resposta;
  try {
    const contexto = await montarContexto();
    resposta = await chamarIA(persona(contexto), historico);
  } catch (e) {
    if (e instanceof IANaoConfiguradaError) {
      return {
        error:
          "O AFCARROS AI ainda não está conectado. Configure a chave da IA no servidor (veja o README) para começar a usar.",
      };
    }
    console.error("Erro ao chamar a IA:", e);
    return {
      error: "Não consegui responder agora. Tente novamente em instantes.",
    };
  }

  // Persiste a pergunta e a resposta (memória + estatísticas de uso).
  await prisma.mensagemAI.createMany({
    data: [
      { papel: "USUARIO", conteudo: pergunta },
      {
        papel: "ASSISTENTE",
        conteudo: resposta.texto || "(sem resposta)",
        tokensEntrada: resposta.tokensEntrada,
        tokensSaida: resposta.tokensSaida,
      },
    ],
  });

  revalidatePath("/painel/ai");
  return { error: null };
}

export async function limparConversa() {
  await requireSession();
  await prisma.mensagemAI.deleteMany({});
  revalidatePath("/painel/ai");
}
