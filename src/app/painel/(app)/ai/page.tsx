import { prisma } from "@/lib/prisma";
import { statusIA } from "@/lib/ai/provider";
import { ChatAI, type MensagemView, type ConhecimentoView } from "./chat";

export default async function AIPage() {
  const [mensagens, veiculos, gastosAgg, clientes, leads, pedidos, ofertas, respostas, tokensAgg, maisAntigo] =
    await Promise.all([
      prisma.mensagemAI.findMany({ orderBy: { criadoEm: "asc" } }),
      prisma.veiculo.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.gasto.aggregate({ _count: { _all: true }, _sum: { valor: true } }),
      prisma.cliente.count(),
      prisma.lead.count(),
      prisma.pedido.count(),
      prisma.oferta.count(),
      prisma.mensagemAI.count({ where: { papel: "ASSISTENTE" } }),
      prisma.mensagemAI.aggregate({ _sum: { tokensEntrada: true, tokensSaida: true } }),
      prisma.veiculo.findFirst({ orderBy: { criadoEm: "asc" }, select: { criadoEm: true } }),
    ]);

  const porStatus = (s: string) => veiculos.find((v) => v.status === s)?._count._all ?? 0;

  const status = statusIA();

  const conhecimento: ConhecimentoView = {
    configurada: status.configurada,
    provedor: status.provedor,
    modelo: status.modelo,
    motivo: status.motivo ?? null,
    veiculosDisponiveis: porStatus("DISPONIVEL"),
    veiculosReservados: porStatus("RESERVADO"),
    veiculosVendidos: porStatus("VENDIDO"),
    gastosQtd: gastosAgg._count._all,
    gastosTotal: Number(gastosAgg._sum.valor ?? 0),
    clientes,
    leads,
    pedidosOfertas: pedidos + ofertas,
    perguntasRespondidas: respostas,
    tokensTotais:
      (tokensAgg._sum.tokensEntrada ?? 0) + (tokensAgg._sum.tokensSaida ?? 0),
    desde: maisAntigo?.criadoEm.toISOString() ?? null,
  };

  const mensagensView: MensagemView[] = mensagens.map((m) => ({
    id: m.id,
    papel: m.papel === "USUARIO" ? "usuario" : "assistente",
    conteudo: m.conteudo,
  }));

  return <ChatAI mensagens={mensagensView} conhecimento={conhecimento} />;
}
