"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { perguntar, limparConversa } from "./actions";

export type MensagemView = {
  id: string;
  papel: "usuario" | "assistente";
  conteudo: string;
};

export type ConhecimentoView = {
  configurada: boolean;
  provedor: string | null;
  modelo: string | null;
  motivo: string | null;
  veiculosDisponiveis: number;
  veiculosReservados: number;
  veiculosVendidos: number;
  gastosQtd: number;
  gastosTotal: number;
  clientes: number;
  leads: number;
  pedidosOfertas: number;
  perguntasRespondidas: number;
  tokensTotais: number;
  desde: string | null;
};

const EXEMPLOS = [
  "Qual o valor total do meu estoque hoje?",
  "Quanto gastei este mês e no ano?",
  "Qual veículo está parado há mais tempo?",
  "Qual foi minha margem nas últimas vendas?",
];

function brl(n: number): string {
  return "R$ " + n.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

export function ChatAI({
  mensagens,
  conhecimento,
}: {
  mensagens: MensagemView[];
  conhecimento: ConhecimentoView;
}) {
  const router = useRouter();
  const [aba, setAba] = useState<"conversa" | "conhecimento">("conversa");
  const [texto, setTexto] = useState("");
  const [otimista, setOtimista] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens.length, otimista, pending]);

  function enviar(perguntaTexto: string) {
    const pergunta = perguntaTexto.trim();
    if (!pergunta || pending) return;
    setErro(null);
    setTexto("");
    setOtimista(pergunta);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("pergunta", pergunta);
      const res = await perguntar({ error: null }, fd);
      if (res.error) setErro(res.error);
      setOtimista(null);
      router.refresh();
    });
  }

  function limpar() {
    if (pending) return;
    startTransition(async () => {
      await limparConversa();
      router.refresh();
    });
  }

  const vazio = mensagens.length === 0 && !otimista;

  return (
    <div className="mx-auto flex h-[calc(100vh-2rem)] max-w-3xl flex-col md:h-[calc(100vh-4rem)]">
      {/* Cabeçalho */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-red text-sm font-bold text-white">
            AI
          </span>
          <div>
            <h1 className="text-lg font-medium text-brand-graphite">AFCARROS AI</h1>
            <p className="flex items-center gap-1.5 text-xs text-brand-gray">
              <span
                className={`h-2 w-2 rounded-full ${conhecimento.configurada ? "bg-green-500" : "bg-zinc-300"}`}
              />
              {conhecimento.configurada ? "Conectado" : "Não configurado"}
            </p>
          </div>
        </div>
        {mensagens.length > 0 && aba === "conversa" && (
          <button
            onClick={limpar}
            className="text-xs text-brand-gray underline hover:text-brand-graphite"
          >
            Limpar conversa
          </button>
        )}
      </div>

      {/* Abas */}
      <div className="mb-4 flex gap-1 rounded-lg bg-zinc-100 p-1 text-sm">
        {(["conversa", "conhecimento"] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAba(a)}
            className={`flex-1 rounded-md px-3 py-1.5 font-medium transition-colors ${
              aba === a ? "bg-white text-brand-graphite shadow-sm" : "text-brand-gray"
            }`}
          >
            {a === "conversa" ? "Conversa" : "Conhecimento & Status"}
          </button>
        ))}
      </div>

      {aba === "conversa" ? (
        <>
          {!conhecimento.configurada && (
            <div className="mb-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              O AFCARROS AI ainda não está conectado a um serviço de IA. Adicione a chave no
              servidor (veja o README) para começar a usar. Você já pode ver o que ele vai
              conhecer na aba <span className="font-medium">Conhecimento &amp; Status</span>.
            </div>
          )}

          {/* Mensagens */}
          <div className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-4">
            {vazio ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <p className="max-w-sm text-sm text-brand-gray">
                  Pergunte qualquer coisa sobre o estoque, gastos, vendas e clientes. Quanto mais
                  você cadastrar no painel, mais completo o AFCARROS AI fica.
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {EXEMPLOS.map((ex) => (
                    <button
                      key={ex}
                      onClick={() => enviar(ex)}
                      disabled={pending}
                      className="rounded-full border border-zinc-300 px-3 py-1.5 text-xs text-brand-graphite transition-colors hover:bg-zinc-50 disabled:opacity-50"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {mensagens.map((m) => (
                  <Bolha key={m.id} papel={m.papel} texto={m.conteudo} />
                ))}
                {otimista && <Bolha papel="usuario" texto={otimista} />}
                {pending && (
                  <div className="flex justify-start">
                    <div className="rounded-2xl rounded-tl-sm bg-zinc-100 px-4 py-2.5 text-sm text-brand-gray">
                      AFCARROS AI está pensando…
                    </div>
                  </div>
                )}
                <div ref={fimRef} />
              </>
            )}
          </div>

          {erro && <p className="mt-2 text-sm text-red-600">{erro}</p>}

          {/* Campo de envio */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              enviar(texto);
            }}
            className="mt-3 flex items-end gap-2"
          >
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  enviar(texto);
                }
              }}
              rows={1}
              placeholder="Pergunte sobre estoque, gastos, vendas…"
              className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-zinc-300 px-4 py-2.5 text-sm outline-none focus:border-brand-red"
            />
            <button
              type="submit"
              disabled={pending || !texto.trim()}
              className="h-11 shrink-0 rounded-xl bg-brand-red px-5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              Enviar
            </button>
          </form>
        </>
      ) : (
        <Conhecimento c={conhecimento} />
      )}
    </div>
  );
}

function Bolha({ papel, texto }: { papel: "usuario" | "assistente"; texto: string }) {
  const eu = papel === "usuario";
  return (
    <div className={`flex ${eu ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
          eu
            ? "rounded-tr-sm bg-brand-red text-white"
            : "rounded-tl-sm bg-zinc-100 text-brand-graphite"
        }`}
      >
        {texto}
      </div>
    </div>
  );
}

function Conhecimento({ c }: { c: ConhecimentoView }) {
  const desde = c.desde
    ? new Date(c.desde).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : null;

  return (
    <div className="flex-1 space-y-4 overflow-y-auto">
      {/* Status da conexão */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="mb-3 text-sm font-medium text-brand-graphite">Status da conexão</p>
        <div className="flex items-center gap-2 text-sm">
          <span className={`h-2.5 w-2.5 rounded-full ${c.configurada ? "bg-green-500" : "bg-zinc-300"}`} />
          <span className="text-brand-graphite">
            {c.configurada ? "Conectado e pronto para uso" : "Ainda não configurado"}
          </span>
        </div>
        {c.configurada ? (
          <p className="mt-2 text-xs text-brand-gray">
            Provedor: <span className="font-medium">{c.provedor}</span> · Modelo:{" "}
            <span className="font-medium">{c.modelo}</span>
          </p>
        ) : (
          <p className="mt-2 text-xs text-brand-gray">{c.motivo}</p>
        )}
      </div>

      {/* Base de conhecimento */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="mb-1 text-sm font-medium text-brand-graphite">
          O que o AFCARROS AI conhece
        </p>
        <p className="mb-3 text-xs text-brand-gray">
          Ele lê estes dados na hora de cada pergunta. Quanto mais você cadastra no painel, mais
          completo ele fica{desde ? ` — dados desde ${desde}` : ""}.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Metrica rotulo="À venda" valor={c.veiculosDisponiveis + c.veiculosReservados} />
          <Metrica rotulo="Vendidos" valor={c.veiculosVendidos} />
          <Metrica rotulo="Clientes" valor={c.clientes} />
          <Metrica rotulo="Gastos lançados" valor={c.gastosQtd} sub={brl(c.gastosTotal)} />
          <Metrica rotulo="Leads" valor={c.leads} />
          <Metrica rotulo="Pedidos/ofertas" valor={c.pedidosOfertas} />
        </div>
      </div>

      {/* Uso */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="mb-3 text-sm font-medium text-brand-graphite">Uso do assistente</p>
        <div className="grid grid-cols-2 gap-3">
          <Metrica rotulo="Perguntas respondidas" valor={c.perguntasRespondidas} />
          <Metrica rotulo="Tokens processados" valor={c.tokensTotais.toLocaleString("pt-BR")} />
        </div>
        <p className="mt-3 text-xs text-brand-gray">
          O custo é cobrado por uso pelo provedor de IA, proporcional aos tokens processados.
          Sem uso, não há cobrança.
        </p>
      </div>
    </div>
  );
}

function Metrica({
  rotulo,
  valor,
  sub,
}: {
  rotulo: string;
  valor: number | string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg bg-zinc-50 p-3">
      <p className="text-xs text-brand-gray">{rotulo}</p>
      <p className="text-xl font-medium text-brand-graphite">{valor}</p>
      {sub && <p className="text-xs text-brand-gray">{sub}</p>}
    </div>
  );
}
