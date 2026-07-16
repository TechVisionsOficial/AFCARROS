// Componentes visuais do dashboard — CSS/SVG puro, sem dependências.
// Tudo renderizado no servidor (nada depende de JavaScript), então funciona
// igual em qualquer aparelho.

function brl(n: number) {
  return "R$ " + n.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

function brlCurto(n: number) {
  if (Math.abs(n) >= 1000) return "R$ " + Math.round(n / 1000) + "k";
  return "R$ " + Math.round(n);
}

export function Secao({
  titulo,
  subtitulo,
  className = "",
  children,
}: {
  titulo: string;
  subtitulo?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`flex flex-col rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 ${className}`}>
      <p className="text-sm font-medium text-brand-graphite">{titulo}</p>
      {subtitulo && <p className="mt-0.5 text-xs text-brand-gray">{subtitulo}</p>}
      <div className="mt-4 flex-1">{children}</div>
    </section>
  );
}

export function Indicadores({ itens }: { itens: { rotulo: string; valor: string }[] }) {
  return (
    <div className="flex h-full flex-col divide-y divide-zinc-100">
      {itens.map((i) => (
        <div
          key={i.rotulo}
          className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
        >
          <span className="text-sm text-brand-gray">{i.rotulo}</span>
          <span className="whitespace-nowrap text-lg font-medium tabular-nums text-brand-graphite">
            {i.valor}
          </span>
        </div>
      ))}
    </div>
  );
}

export function CartaoMetrica({
  rotulo,
  valor,
  cor = "text-brand-graphite",
}: {
  rotulo: string;
  valor: string;
  cor?: string;
}) {
  return (
    <div className="rounded-md bg-zinc-100 p-4">
      <p className="text-xs text-brand-gray">{rotulo}</p>
      <p className={`mt-1 text-xl font-medium ${cor}`}>{valor}</p>
    </div>
  );
}

export type ItemBarra = { label: string; valor: number; sub?: string };

export function BarrasHorizontais({
  itens,
  cor = "bg-brand-red",
  formato = "num",
  vazio = "Sem dados ainda.",
}: {
  itens: ItemBarra[];
  cor?: string;
  formato?: "num" | "brl";
  vazio?: string;
}) {
  if (itens.length === 0) {
    return <p className="text-sm text-brand-gray">{vazio}</p>;
  }
  const max = Math.max(1, ...itens.map((i) => i.valor));
  return (
    <div className="flex flex-col gap-2.5">
      {itens.map((i) => (
        <div key={i.label} className="flex items-center gap-3">
          <span className="w-24 shrink-0 truncate text-xs text-brand-gray" title={i.label}>
            {i.label}
          </span>
          <div className="h-2.5 flex-1 rounded-full bg-zinc-100">
            <div
              className={`h-full rounded-full ${cor}`}
              style={{ width: `${Math.max((i.valor / max) * 100, 2)}%` }}
            />
          </div>
          <span className="shrink-0 whitespace-nowrap text-right text-xs font-medium tabular-nums text-brand-graphite">
            {formato === "brl" ? brl(i.valor) : i.valor}
            {i.sub ? <span className="text-brand-gray"> · {i.sub}</span> : null}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Chips({ itens }: { itens: { rotulo: string; valor: number }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {itens.map((i) => (
        <div key={i.rotulo} className="rounded-lg bg-zinc-50 px-3 py-2">
          <span className="text-lg font-medium text-brand-graphite">{i.valor}</span>{" "}
          <span className="text-xs text-brand-gray">{i.rotulo}</span>
        </div>
      ))}
    </div>
  );
}

export type MesVenda = {
  rotulo: string;
  faturamento: number;
  margem: number;
  qtd: number;
};

export function VendasMensais({ meses }: { meses: MesVenda[] }) {
  const max = Math.max(1, ...meses.map((m) => m.faturamento));
  const AREA = 140; // altura útil das barras em px
  const temVenda = meses.some((m) => m.faturamento > 0);

  return (
    <div>
      {!temVenda && (
        <p className="mb-3 text-sm text-brand-gray">
          Nenhuma venda nos últimos 6 meses. Assim que registrar vendas, o gráfico aparece aqui.
        </p>
      )}
      <div className="flex items-end gap-2 sm:gap-3" style={{ height: AREA + 20 }}>
        {meses.map((m) => {
          const alturaBarra = (m.faturamento / max) * AREA;
          const alturaMargem =
            m.faturamento > 0 ? Math.max((m.margem / m.faturamento) * alturaBarra, 0) : 0;
          return (
            <div key={m.rotulo} className="flex flex-1 flex-col items-center justify-end gap-1">
              <span className="text-xs tabular-nums text-brand-gray">
                {m.faturamento > 0 ? brlCurto(m.faturamento) : ""}
              </span>
              <div
                className="flex w-full flex-col justify-end overflow-hidden rounded-md bg-zinc-200"
                style={{ height: Math.max(alturaBarra, 3), maxWidth: 44 }}
                title={`${m.rotulo}: faturamento ${brl(m.faturamento)} · margem ${brl(m.margem)}`}
              >
                <div className="bg-green-600" style={{ height: alturaMargem }} />
              </div>
              <span className="text-xs capitalize text-brand-gray">{m.rotulo}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-4 text-xs text-brand-gray">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-green-600" /> Margem (lucro)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-zinc-200" /> Custo
        </span>
      </div>
    </div>
  );
}

export function ListaParados({
  itens,
}: {
  itens: { id: string; nome: string; dias: number }[];
}) {
  if (itens.length === 0) {
    return <p className="text-sm text-brand-gray">Nenhum veículo parado há mais de 60 dias. 👍</p>;
  }
  return (
    <ul className="flex flex-col gap-2">
      {itens.map((v) => (
        <li key={v.id} className="flex items-center justify-between gap-3 text-sm">
          <span className="truncate text-brand-graphite">{v.nome}</span>
          <span className="whitespace-nowrap rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
            {v.dias} dias
          </span>
        </li>
      ))}
    </ul>
  );
}
