import Link from "next/link";
import { prisma } from "@/lib/prisma";

const STATUS_LABEL: Record<string, string> = {
  NOVO: "Novo",
  ENTRAR_EM_CONTATO: "Entrar em contato",
  AGUARDANDO_CLIENTE: "Aguardando cliente",
  RETORNAR_PARA_CLIENTE: "Retornar para cliente",
  NEGOCIANDO: "Negociando",
  VENDA_CONCLUIDA: "Venda concluída",
  PERDIDO: "Perdido",
};

const STATUS_CLASSE: Record<string, string> = {
  NOVO: "bg-zinc-100 text-zinc-700",
  ENTRAR_EM_CONTATO: "bg-zinc-100 text-zinc-700",
  AGUARDANDO_CLIENTE: "bg-amber-100 text-amber-800",
  RETORNAR_PARA_CLIENTE: "bg-amber-100 text-amber-800",
  NEGOCIANDO: "bg-blue-100 text-blue-800",
  VENDA_CONCLUIDA: "bg-green-100 text-green-800",
  PERDIDO: "bg-zinc-200 text-zinc-500",
};

const QUALIDADE = {
  VERDE: { cor: "bg-green-500", label: "Boa" },
  AMARELO: { cor: "bg-amber-400", label: "Atenção" },
  VERMELHO: { cor: "bg-red-500", label: "Ruim" },
};

export default async function ClientesPage() {
  const clientes = await prisma.cliente.findMany({
    include: {
      leads: { orderBy: { criadoEm: "desc" } },
      _count: { select: { comprasDaLoja: true, vendasParaLoja: true } },
    },
    orderBy: { criadoEm: "desc" },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-medium text-brand-graphite">Clientes</h1>

      {clientes.length === 0 ? (
        <p className="text-sm text-brand-gray">
          Nenhum cliente ainda — clientes são criados automaticamente ao adicionar um lead em{" "}
          <span className="font-medium">Leads</span>.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 text-xs text-brand-gray">
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">Contato</th>
                <th className="px-4 py-3 font-medium">Relação</th>
                <th className="px-4 py-3 font-medium">Comprou da loja</th>
                <th className="px-4 py-3 font-medium">Vendeu p/ loja</th>
                <th className="px-4 py-3 font-medium">Leads</th>
                <th className="px-4 py-3 font-medium">Status recente</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((cliente) => {
                const ultimoLead = cliente.leads[0];
                const q = QUALIDADE[cliente.qualidadeRelacao];
                return (
                  <tr key={cliente.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-brand-graphite">{cliente.nome}</td>
                    <td className="px-4 py-3 text-brand-gray">
                      {cliente.telefone && <div>{cliente.telefone}</div>}
                      {cliente.email && <div>{cliente.email}</div>}
                      {!cliente.telefone && !cliente.email && "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-2 text-brand-gray">
                        <span className={`h-2.5 w-2.5 rounded-full ${q.cor}`} />
                        {q.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-brand-gray">{cliente._count.comprasDaLoja}</td>
                    <td className="px-4 py-3 text-brand-gray">{cliente._count.vendasParaLoja}</td>
                    <td className="px-4 py-3 text-brand-gray">{cliente.leads.length}</td>
                    <td className="px-4 py-3">
                      {ultimoLead ? (
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] ${STATUS_CLASSE[ultimoLead.statusKanban]}`}
                        >
                          {STATUS_LABEL[ultimoLead.statusKanban]}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/painel/clientes/${cliente.id}/editar`}
                        className="text-xs text-brand-gray underline hover:text-brand-graphite"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
