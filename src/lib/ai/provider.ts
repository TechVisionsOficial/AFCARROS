import "server-only";

/**
 * Camada de IA agnóstica de provedor.
 *
 * "Decidir depois": o código funciona com Anthropic (Claude) OU OpenAI (ChatGPT).
 * A escolha é feita por variáveis de ambiente — basta colar a chave do provedor
 * escolhido e (opcionalmente) definir o modelo. Nada mais muda no app.
 *
 * Variáveis:
 *   AI_PROVIDER      "anthropic" | "openai"   (opcional; detecta pela chave presente)
 *   ANTHROPIC_API_KEY  chave da Anthropic
 *   OPENAI_API_KEY     chave da OpenAI
 *   AI_MODEL         (opcional) sobrescreve o modelo padrão do provedor
 */

export type MensagemChat = { papel: "usuario" | "assistente"; conteudo: string };
export type RespostaIA = { texto: string; tokensEntrada: number; tokensSaida: number };

export type StatusIA = {
  configurada: boolean;
  provedor: "anthropic" | "openai" | null;
  modelo: string | null;
  motivo?: string;
};

// Modelos padrão do nível "equilibrado" escolhido. Sobrescreva com AI_MODEL.
const MODELO_PADRAO: Record<"anthropic" | "openai", string> = {
  anthropic: "claude-sonnet-5",
  openai: "gpt-4o",
};

const MAX_TOKENS_RESPOSTA = 1024;

function detectarProvedor(): "anthropic" | "openai" | null {
  const explicito = process.env.AI_PROVIDER?.toLowerCase();
  if (explicito === "anthropic" || explicito === "openai") return explicito;
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.OPENAI_API_KEY) return "openai";
  return null;
}

function chaveDo(provedor: "anthropic" | "openai"): string | undefined {
  return provedor === "anthropic"
    ? process.env.ANTHROPIC_API_KEY
    : process.env.OPENAI_API_KEY;
}

export function statusIA(): StatusIA {
  const provedor = detectarProvedor();
  if (!provedor) {
    return {
      configurada: false,
      provedor: null,
      modelo: null,
      motivo: "Nenhuma chave de IA configurada (defina ANTHROPIC_API_KEY ou OPENAI_API_KEY).",
    };
  }
  const chave = chaveDo(provedor);
  if (!chave) {
    return {
      configurada: false,
      provedor,
      modelo: null,
      motivo: `AI_PROVIDER=${provedor}, mas a chave correspondente não está definida.`,
    };
  }
  return {
    configurada: true,
    provedor,
    modelo: process.env.AI_MODEL || MODELO_PADRAO[provedor],
  };
}

export class IANaoConfiguradaError extends Error {}

/** Chama o provedor de IA e devolve o texto + uso de tokens. */
export async function chamarIA(
  sistema: string,
  historico: MensagemChat[],
): Promise<RespostaIA> {
  const status = statusIA();
  if (!status.configurada || !status.provedor) {
    throw new IANaoConfiguradaError(status.motivo ?? "IA não configurada.");
  }
  const chave = chaveDo(status.provedor)!;
  const modelo = status.modelo!;

  if (status.provedor === "anthropic") {
    return chamarAnthropic(chave, modelo, sistema, historico);
  }
  return chamarOpenAI(chave, modelo, sistema, historico);
}

async function chamarAnthropic(
  chave: string,
  modelo: string,
  sistema: string,
  historico: MensagemChat[],
): Promise<RespostaIA> {
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": chave,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: modelo,
      max_tokens: MAX_TOKENS_RESPOSTA,
      system: sistema,
      messages: historico.map((m) => ({
        role: m.papel === "usuario" ? "user" : "assistant",
        content: m.conteudo,
      })),
    }),
  });

  if (!resp.ok) {
    const detalhe = await resp.text().catch(() => "");
    throw new Error(`Erro da Anthropic (${resp.status}): ${detalhe.slice(0, 300)}`);
  }

  const dados = await resp.json();
  const texto =
    dados.content?.map((b: { text?: string }) => b.text ?? "").join("") ?? "";
  return {
    texto: texto.trim(),
    tokensEntrada: dados.usage?.input_tokens ?? 0,
    tokensSaida: dados.usage?.output_tokens ?? 0,
  };
}

async function chamarOpenAI(
  chave: string,
  modelo: string,
  sistema: string,
  historico: MensagemChat[],
): Promise<RespostaIA> {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      authorization: `Bearer ${chave}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: modelo,
      max_tokens: MAX_TOKENS_RESPOSTA,
      messages: [
        { role: "system", content: sistema },
        ...historico.map((m) => ({
          role: m.papel === "usuario" ? "user" : "assistant",
          content: m.conteudo,
        })),
      ],
    }),
  });

  if (!resp.ok) {
    const detalhe = await resp.text().catch(() => "");
    throw new Error(`Erro da OpenAI (${resp.status}): ${detalhe.slice(0, 300)}`);
  }

  const dados = await resp.json();
  const texto = dados.choices?.[0]?.message?.content ?? "";
  return {
    texto: texto.trim(),
    tokensEntrada: dados.usage?.prompt_tokens ?? 0,
    tokensSaida: dados.usage?.completion_tokens ?? 0,
  };
}
