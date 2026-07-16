import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Monta um retrato textual dos dados atuais da loja para o AFCARROS AI.
 *
 * É lido DO ZERO a cada pergunta — por isso a IA "se apura" conforme você
 * cadastra mais veículos, gastos e vendas: ela sempre usa os dados mais recentes.
 */

const TIPO: Record<string, string> = { CARRO: "Carro", MOTO: "Moto" };
const COND: Record<string, string> = { NOVO: "Novo", SEMINOVO: "Seminovo" };
const QUALIDADE: Record<string, string> = {
  VERDE: "Boa",
  AMARELO: "Atenção",
  VERMELHO: "Ruim",
};

function brl(n: number): string {
  return "R$ " + n.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

function mesAno(d: Date): string {
  return `${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function diasDesde(d: Date): number {
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}

export async function montarContexto(): Promise<string> {
  const [veiculos, clientes, leads, pedidos, ofertas] = await Promise.all([
    prisma.veiculo.findMany({
      include: { gastos: true, fornecedor: true, comprador: true },
      orderBy: { criadoEm: "desc" },
    }),
    prisma.cliente.findMany({
      include: { _count: { select: { comprasDaLoja: true, vendasParaLoja: true, leads: true } } },
      orderBy: { nome: "asc" },
    }),
    prisma.lead.groupBy({ by: ["statusKanban"], _count: { _all: true } }),
    prisma.pedido.findMany({ include: { cliente: true }, orderBy: { criadoEm: "desc" } }),
    prisma.oferta.findMany({ include: { cliente: true }, orderBy: { criadoEm: "desc" } }),
  ]);

  const disponiveis = veiculos.filter((v) => v.status === "DISPONIVEL");
  const reservados = veiculos.filter((v) => v.status === "RESERVADO");
  const vendidos = veiculos.filter((v) => v.status === "VENDIDO");

  const linhas: string[] = [];
  const p = (s: string) => linhas.push(s);

  // ---- Resumo geral ----
  const valorEstoque = [...disponiveis, ...reservados].reduce(
    (s, v) => s + Number(v.precoVenda),
    0,
  );
  const margemPrevista = [...disponiveis, ...reservados].reduce((s, v) => {
    const gastos = v.gastos.reduce((g, x) => g + Number(x.valor), 0);
    return s + (Number(v.precoVenda) - Number(v.precoCompra) - gastos);
  }, 0);

  p("## RESUMO DA LOJA");
  p(`- Veículos disponíveis: ${disponiveis.length}`);
  p(`- Veículos reservados: ${reservados.length}`);
  p(`- Veículos vendidos (histórico): ${vendidos.length}`);
  p(`- Valor total do estoque (à venda): ${brl(valorEstoque)}`);
  p(`- Margem prevista do estoque atual: ${brl(margemPrevista)}`);
  p(`- Clientes cadastrados: ${clientes.length}`);
  p("");

  // ---- Estoque à venda ----
  p("## ESTOQUE À VENDA (disponíveis e reservados)");
  if (disponiveis.length + reservados.length === 0) {
    p("- (nenhum veículo à venda no momento)");
  } else {
    for (const v of [...disponiveis, ...reservados]) {
      const gastos = v.gastos.reduce((g, x) => g + Number(x.valor), 0);
      const margem = Number(v.precoVenda) - Number(v.precoCompra) - gastos;
      p(
        `- ${TIPO[v.tipo]} ${v.marca} ${v.modelo} ${v.ano} · ${v.km.toLocaleString("pt-BR")} km · ${COND[v.condicao]} · status ${v.status}` +
          ` | venda ${brl(Number(v.precoVenda))} · compra ${brl(Number(v.precoCompra))} · mínimo ${brl(Number(v.precoMinimo))}` +
          ` · gastos ${brl(gastos)} · margem prevista ${brl(margem)}` +
          ` · ${diasDesde(v.criadoEm)} dias em estoque` +
          (v.fornecedor ? ` · comprado de ${v.fornecedor.nome}` : ""),
      );
    }
  }
  p("");

  // ---- Vendas realizadas ----
  p("## VENDAS REALIZADAS");
  if (vendidos.length === 0) {
    p("- (nenhuma venda registrada ainda)");
  } else {
    for (const v of vendidos) {
      const gastos = v.gastos.reduce((g, x) => g + Number(x.valor), 0);
      const precoReal = Number(v.precoVendaReal ?? v.precoVenda);
      const margemReal = precoReal - Number(v.precoCompra) - gastos;
      p(
        `- ${v.marca} ${v.modelo} ${v.ano} · vendido por ${brl(precoReal)}` +
          (v.vendidoEm ? ` em ${v.vendidoEm.toLocaleDateString("pt-BR")}` : "") +
          ` · margem real ${brl(margemReal)}` +
          (v.comprador ? ` · comprador ${v.comprador.nome}` : ""),
      );
    }
  }
  p("");

  // ---- Faturamento e margem por mês ----
  const porMesVenda = new Map<string, { fat: number; margem: number; qtd: number }>();
  for (const v of vendidos) {
    if (!v.vendidoEm) continue;
    const chave = mesAno(v.vendidoEm);
    const gastos = v.gastos.reduce((g, x) => g + Number(x.valor), 0);
    const precoReal = Number(v.precoVendaReal ?? v.precoVenda);
    const atual = porMesVenda.get(chave) ?? { fat: 0, margem: 0, qtd: 0 };
    atual.fat += precoReal;
    atual.margem += precoReal - Number(v.precoCompra) - gastos;
    atual.qtd += 1;
    porMesVenda.set(chave, atual);
  }
  p("## FATURAMENTO E MARGEM POR MÊS (vendas)");
  if (porMesVenda.size === 0) {
    p("- (sem vendas registradas)");
  } else {
    for (const [mes, d] of porMesVenda) {
      p(`- ${mes}: ${d.qtd} venda(s) · faturamento ${brl(d.fat)} · margem ${brl(d.margem)}`);
    }
  }
  p("");

  // ---- Gastos por mês e por categoria ----
  const gastosTodos = veiculos.flatMap((v) =>
    v.gastos.map((g) => ({ ...g, veiculo: `${v.marca} ${v.modelo}` })),
  );
  const gastoTotal = gastosTodos.reduce((s, g) => s + Number(g.valor), 0);
  const porMesGasto = new Map<string, number>();
  const porCatGasto = new Map<string, number>();
  const porAnoGasto = new Map<string, number>();
  for (const g of gastosTodos) {
    porMesGasto.set(mesAno(g.data), (porMesGasto.get(mesAno(g.data)) ?? 0) + Number(g.valor));
    porCatGasto.set(g.categoria, (porCatGasto.get(g.categoria) ?? 0) + Number(g.valor));
    const ano = String(g.data.getFullYear());
    porAnoGasto.set(ano, (porAnoGasto.get(ano) ?? 0) + Number(g.valor));
  }
  p("## GASTOS");
  p(`- Total de gastos registrados: ${brl(gastoTotal)} (${gastosTodos.length} lançamentos)`);
  if (porMesGasto.size > 0) {
    p("- Por mês:");
    for (const [mes, val] of porMesGasto) p(`  · ${mes}: ${brl(val)}`);
    p("- Por ano:");
    for (const [ano, val] of porAnoGasto) p(`  · ${ano}: ${brl(val)}`);
    p("- Por categoria:");
    for (const [cat, val] of porCatGasto) p(`  · ${cat}: ${brl(val)}`);
  }
  p("");

  // ---- Clientes ----
  p("## CLIENTES");
  if (clientes.length === 0) {
    p("- (nenhum cliente cadastrado)");
  } else {
    for (const c of clientes) {
      p(
        `- ${c.nome}` +
          (c.telefone ? ` · tel ${c.telefone}` : "") +
          (c.email ? ` · ${c.email}` : "") +
          ` · relação ${QUALIDADE[c.qualidadeRelacao]}` +
          ` · comprou da loja ${c._count.comprasDaLoja} · vendeu p/ loja ${c._count.vendasParaLoja} · leads ${c._count.leads}`,
      );
    }
  }
  p("");

  // ---- Funil de leads ----
  p("## FUNIL DE LEADS");
  if (leads.length === 0) {
    p("- (nenhum lead)");
  } else {
    for (const l of leads) p(`- ${l.statusKanban}: ${l._count._all}`);
  }
  p("");

  // ---- Pedidos e ofertas ----
  p("## PEDIDOS (o que clientes procuram)");
  if (pedidos.length === 0) {
    p("- (nenhum pedido)");
  } else {
    for (const pd of pedidos) {
      p(`- ${pd.cliente.nome} procura ${TIPO[pd.tipo]}: ${pd.descricao} · status ${pd.status}`);
    }
  }
  p("");
  p("## OFERTAS (veículos oferecidos à loja)");
  if (ofertas.length === 0) {
    p("- (nenhuma oferta)");
  } else {
    for (const oferta of ofertas) {
      p(
        `- ${oferta.cliente.nome} ofereceu ${oferta.marca} ${oferta.modelo}${oferta.ano ? " " + oferta.ano : ""}` +
          (oferta.precoPedido ? ` por ${brl(Number(oferta.precoPedido))}` : "") +
          ` · status ${oferta.status}`,
      );
    }
  }

  return linhas.join("\n");
}
