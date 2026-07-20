import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import type { StatusKanban } from "@/generated/prisma/client";
import { CATEGORIA_GASTO_LABEL } from "@/lib/gastos";
import { PeriodoSelect } from "./periodo-select";
import {
  Secao,
  CartaoMetrica,
  BarrasHorizontais,
  Indicadores,
  VendasMensais,
  ListaParados,
  type ItemBarra,
  type MesVenda,
} from "./dashboard-graficos";

const DIAS_POR_PERIODO: Record<string, number> = {
  semana: 7,
  mes: 30,
  ano: 365,
};

const KANBAN_LABEL: Record<string, string> = {
  NOVO: "Novo",
  ENTRAR_EM_CONTATO: "Entrar em contato",
  AGUARDANDO_CLIENTE: "Aguardando cliente",
  RETORNAR_PARA_CLIENTE: "Retornar para cliente",
  NEGOCIANDO: "Negociando",
  VENDA_CONCLUIDA: "Venda concluída",
  PERDIDO: "Perdido",
};

const KANBAN_ORDEM = Object.keys(KANBAN_LABEL) as StatusKanban[];

function fmtMoeda(n: number) {
  return "R$ " + n.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

function diasDesde(d: Date) {
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export default async function PainelDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const session = await getSession();
  const { periodo: periodoParam } = await searchParams;
  const periodo = periodoParam && DIAS_POR_PERIODO[periodoParam] ? periodoParam : "mes";
  const inicioPeriodo = new Date(Date.now() - DIAS_POR_PERIODO[periodo] * 24 * 60 * 60 * 1000);

  const [emEstoque, vendidos, leadsAgrupados, gastosPorCat] = await Promise.all([
    prisma.veiculo.findMany({
      where: { status: { in: ["DISPONIVEL", "RESERVADO"] } },
      include: { gastos: true },
    }),
    prisma.veiculo.findMany({
      where: { status: "VENDIDO" },
      include: { gastos: true },
    }),
    prisma.lead.groupBy({ by: ["statusKanban"], _count: { _all: true } }),
    prisma.gasto.groupBy({ by: ["categoria"], _sum: { valor: true } }),
  ]);

  const margemDoVeiculo = (v: (typeof vendidos)[number]) => {
    const gastos = v.gastos.reduce((s, g) => s + Number(g.valor), 0);
    return Number(v.precoVendaReal ?? v.precoVenda) - Number(v.precoCompra) - gastos;
  };

  // ---- Métricas do topo ----
  const valorEstoque = emEstoque.reduce((soma, v) => soma + Number(v.precoVenda), 0);
  const margemEsperada = emEstoque.reduce((soma, v) => {
    const gastos = v.gastos.reduce((s, g) => s + Number(g.valor), 0);
    return soma + (Number(v.precoVenda) - Number(v.precoCompra) - gastos);
  }, 0);

  const vendasNoPeriodo = vendidos.filter((v) => v.vendidoEm && v.vendidoEm >= inicioPeriodo);
  const faturamento = vendasNoPeriodo.reduce(
    (soma, v) => soma + Number(v.precoVendaReal ?? v.precoVenda),
    0,
  );
  const margemRealizadaPeriodo = vendasNoPeriodo.reduce((soma, v) => soma + margemDoVeiculo(v), 0);
  const ticketMedio = vendasNoPeriodo.length > 0 ? faturamento / vendasNoPeriodo.length : 0;

  // ---- Estoque por marca ----
  const contagemMarca = new Map<string, number>();
  for (const v of emEstoque) contagemMarca.set(v.marca, (contagemMarca.get(v.marca) ?? 0) + 1);
  const porMarca: ItemBarra[] = [...contagemMarca.entries()]
    .map(([label, valor]) => ({ label, valor }))
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 8);

  // ---- Vendas e margem (últimos 6 meses) ----
  const meses: MesVenda[] = [];
  const hoje = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    meses.push({
      rotulo: d.toLocaleString("pt-BR", { month: "short" }).replace(".", ""),
      faturamento: 0,
      margem: 0,
      qtd: 0,
    });
  }
  const idxMes = (ano: number, mes: number) =>
    5 - (hoje.getFullYear() * 12 + hoje.getMonth() - (ano * 12 + mes));
  for (const v of vendidos) {
    if (!v.vendidoEm) continue;
    const i = idxMes(v.vendidoEm.getFullYear(), v.vendidoEm.getMonth());
    if (i < 0 || i > 5) continue;
    meses[i].faturamento += Number(v.precoVendaReal ?? v.precoVenda);
    meses[i].margem += margemDoVeiculo(v);
    meses[i].qtd += 1;
  }

  // ---- Gastos por categoria ----
  const porCategoria: ItemBarra[] = gastosPorCat
    .map((g) => ({
      label: CATEGORIA_GASTO_LABEL[g.categoria] ?? g.categoria,
      valor: Number(g._sum.valor ?? 0),
    }))
    .filter((g) => g.valor > 0)
    .sort((a, b) => b.valor - a.valor);

  // ---- Desempenho por marca (margem realizada acumulada) ----
  const margemMarca = new Map<string, number>();
  for (const v of vendidos) {
    margemMarca.set(v.marca, (margemMarca.get(v.marca) ?? 0) + margemDoVeiculo(v));
  }
  const desempenhoMarca: ItemBarra[] = [...margemMarca.entries()]
    .map(([label, valor]) => ({ label, valor: Math.round(valor) }))
    .filter((m) => m.valor > 0)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, 6);

  // ---- Indicadores-chave ----
  const vendidosComData = vendidos.filter((v) => v.vendidoEm);
  const tempoMedioVenda =
    vendidosComData.length > 0
      ? Math.round(
          vendidosComData.reduce(
            (s, v) =>
              s +
              Math.max(
                0,
                (v.vendidoEm!.getTime() - (v.dataAquisicao ?? v.criadoEm).getTime()) /
                  (1000 * 60 * 60 * 24),
              ),
            0,
          ) / vendidosComData.length,
        )
      : null;
  const margemMediaVenda =
    vendidos.length > 0
      ? vendidos.reduce((s, v) => s + margemDoVeiculo(v), 0) / vendidos.length
      : 0;

  // ---- Funil de leads ----
  const contagemPorStatus = new Map(leadsAgrupados.map((l) => [l.statusKanban, l._count._all]));
  const totalLeads = leadsAgrupados.reduce((soma, l) => soma + l._count._all, 0);
  const maxLead = Math.max(1, ...leadsAgrupados.map((l) => l._count._all));
  const vendasConcluidas = contagemPorStatus.get("VENDA_CONCLUIDA") ?? 0;
  const taxaConversao = totalLeads > 0 ? Math.round((vendasConcluidas / totalLeads) * 100) : 0;

  // ---- Veículos parados (60+ dias) ----
  const parados = emEstoque
    .map((v) => ({
      id: v.id,
      nome: `${v.marca} ${v.modelo} ${v.ano}`,
      dias: diasDesde(v.dataAquisicao ?? v.criadoEm),
    }))
    .filter((v) => v.dias >= 60)
    .sort((a, b) => b.dias - a.dias)
    .slice(0, 5);

  // ---- Faixa de preço do estoque ----
  const faixas = [
    { label: "Até R$ 50 mil", min: 0, max: 50000 },
    { label: "R$ 50–100 mil", min: 50000, max: 100000 },
    { label: "R$ 100–200 mil", min: 100000, max: 200000 },
    { label: "Acima de R$ 200 mil", min: 200000, max: Infinity },
  ];
  const faixaPreco: ItemBarra[] = faixas
    .map((f) => ({
      label: f.label,
      valor: emEstoque.filter((v) => {
        const p = Number(v.precoVenda);
        return p >= f.min && p < f.max;
      }).length,
    }))
    .filter((f) => f.valor > 0);

  const periodoLabel =
    periodo === "semana" ? "na semana" : periodo === "ano" ? "no ano" : "no mês";

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-medium text-brand-graphite">
          Olá, {session?.nome.split(" ")[0]}
        </h1>
        <PeriodoSelect />
      </div>

      {/* Métricas do topo */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <CartaoMetrica rotulo="Valor em estoque" valor={fmtMoeda(valorEstoque)} />
        <CartaoMetrica rotulo="Margem esperada (estoque)" valor={fmtMoeda(margemEsperada)} cor="text-green-700" />
        <CartaoMetrica rotulo={`Faturamento ${periodoLabel}`} valor={fmtMoeda(faturamento)} />
        <CartaoMetrica rotulo={`Margem realizada ${periodoLabel}`} valor={fmtMoeda(margemRealizadaPeriodo)} cor="text-green-700" />
        <CartaoMetrica rotulo="Ticket médio" valor={fmtMoeda(ticketMedio)} />
        <CartaoMetrica rotulo="Veículos à venda" valor={String(emEstoque.length)} />
      </div>

      {/* Gráficos — grade de 6 colunas no desktop (larguras variadas), 1 no celular */}
      <div className="mt-4 grid gap-4 lg:grid-cols-6">
        {/* Linha: vendas (largo) + indicadores (estreito) */}
        <Secao className="lg:col-span-4" titulo="Vendas e margem" subtitulo="Últimos 6 meses">
          <VendasMensais meses={meses} />
        </Secao>

        <Secao className="lg:col-span-2" titulo="Indicadores-chave">
          <Indicadores
            itens={[
              { rotulo: "Veículos vendidos", valor: String(vendidos.length) },
              {
                rotulo: "Tempo médio p/ vender",
                valor:
                  tempoMedioVenda != null
                    ? `${tempoMedioVenda} ${tempoMedioVenda === 1 ? "dia" : "dias"}`
                    : "—",
              },
              { rotulo: "Margem média/venda", valor: fmtMoeda(margemMediaVenda) },
              { rotulo: "Conversão de leads", valor: `${taxaConversao}%` },
            ]}
          />
        </Secao>

        {/* Linha: barras do estoque */}
        <Secao className="lg:col-span-3" titulo="Estoque por marca" subtitulo="Disponíveis e reservados">
          <BarrasHorizontais itens={porMarca} vazio="Nenhum veículo em estoque." />
        </Secao>
        <Secao className="lg:col-span-3" titulo="Faixa de preço" subtitulo="Veículos à venda por valor">
          <BarrasHorizontais itens={faixaPreco} cor="bg-brand-graphite" vazio="Nenhum veículo em estoque." />
        </Secao>

        {/* Linha: desempenho + gastos */}
        <Secao className="lg:col-span-3" titulo="Desempenho por marca" subtitulo="Margem já realizada (vendas)">
          <BarrasHorizontais itens={desempenhoMarca} cor="bg-green-600" formato="brl" vazio="Nenhuma venda registrada ainda." />
        </Secao>
        <Secao className="lg:col-span-3" titulo="Gastos por categoria" subtitulo="Total investido nos veículos">
          <BarrasHorizontais itens={porCategoria} cor="bg-amber-500" formato="brl" vazio="Nenhum gasto registrado ainda." />
        </Secao>

        {/* Linha: funil + estoque parado */}
        <Secao className="lg:col-span-3" titulo="Funil de leads" subtitulo={`${totalLeads} lead(s) no total`}>
          <div className="flex flex-col gap-2">
            {KANBAN_ORDEM.map((status) => {
              const count = contagemPorStatus.get(status) ?? 0;
              const pct = (count / maxLead) * 100;
              return (
                <div key={status} className="flex items-center gap-2">
                  <span className="w-32 shrink-0 truncate text-xs text-brand-gray">{KANBAN_LABEL[status]}</span>
                  <div className="h-2.5 flex-1 rounded-full bg-zinc-100">
                    <div
                      className="h-full rounded-full bg-brand-red"
                      style={{ width: `${Math.max(pct, count > 0 ? 4 : 0)}%` }}
                    />
                  </div>
                  <span className="w-7 shrink-0 text-right text-xs tabular-nums">{count}</span>
                </div>
              );
            })}
          </div>
        </Secao>

        <Secao className="lg:col-span-3" titulo="Estoque parado" subtitulo="Há mais de 60 dias — priorize a venda">
          <ListaParados itens={parados} />
        </Secao>
      </div>
    </div>
  );
}
