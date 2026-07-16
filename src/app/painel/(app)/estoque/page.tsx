import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { VenderVeiculoForm } from "./vender-veiculo";
import { ExcluirVeiculo } from "./excluir-veiculo";

const STATUS_LABEL: Record<string, string> = {
  DISPONIVEL: "Disponível",
  RESERVADO: "Reservado",
  VENDIDO: "Vendido",
};

const STATUS_CLASSE: Record<string, string> = {
  DISPONIVEL: "bg-green-100 text-green-800",
  RESERVADO: "bg-amber-100 text-amber-800",
  VENDIDO: "bg-zinc-200 text-zinc-600",
};

export default async function EstoquePage() {
  const [veiculos, clientes] = await Promise.all([
    prisma.veiculo.findMany({
      include: { fotos: { orderBy: { ordem: "asc" }, take: 1 } },
      orderBy: { criadoEm: "desc" },
    }),
    prisma.cliente.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-medium text-brand-graphite">Estoque</h1>
        <Link
          href="/painel/estoque/novo"
          className="rounded-md bg-brand-red px-4 py-2 text-sm font-medium text-white"
        >
          + Novo veículo
        </Link>
      </div>

      {veiculos.length === 0 && (
        <p className="text-sm text-brand-gray">Nenhum veículo cadastrado ainda.</p>
      )}

      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
        {veiculos.map((veiculo) => {
          const foto = veiculo.fotos[0];
          const vendido = veiculo.status === "VENDIDO";
          const precoExibido = vendido && veiculo.precoVendaReal
            ? Number(veiculo.precoVendaReal)
            : Number(veiculo.precoVenda);
          const margem = precoExibido - Number(veiculo.precoCompra);

          return (
            <div key={veiculo.id} className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
              <div className="relative aspect-[4/3] bg-zinc-100">
                {foto ? (
                  <Image src={foto.url} alt={`${veiculo.marca} ${veiculo.modelo}`} fill className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-brand-gray">
                    Sem foto
                  </div>
                )}
              </div>
              <div className="p-3">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm font-medium text-brand-graphite">
                    {veiculo.marca} {veiculo.modelo}
                  </p>
                  <span className={`rounded-md px-2 py-0.5 text-[11px] ${STATUS_CLASSE[veiculo.status]}`}>
                    {STATUS_LABEL[veiculo.status]}
                  </span>
                </div>
                <p className="text-xs text-brand-gray">
                  {veiculo.ano} · {veiculo.km.toLocaleString("pt-BR")} km
                </p>
                <p className="mt-2 text-sm font-medium">
                  R$ {precoExibido.toLocaleString("pt-BR")}
                </p>
                <p className="text-xs text-brand-gray">
                  {vendido ? "Margem realizada" : "Margem cheia"}: R$ {margem.toLocaleString("pt-BR")}
                </p>
                <Link
                  href={`/painel/estoque/${veiculo.id}/editar`}
                  className="mt-2 block h-8 rounded-md border border-zinc-300 text-center text-xs leading-8 text-brand-gray hover:bg-zinc-50"
                >
                  Editar
                </Link>
                {!vendido && (
                  <VenderVeiculoForm
                    veiculoId={veiculo.id}
                    precoVenda={Number(veiculo.precoVenda)}
                    clientes={clientes}
                  />
                )}
                <ExcluirVeiculo
                  veiculoId={veiculo.id}
                  nome={`${veiculo.marca} ${veiculo.modelo}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
