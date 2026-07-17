import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { fotosViaBlobDireto } from "@/lib/storage";
import { NovoPedidoForm } from "./novo-pedido-form";
import { NovaOfertaForm } from "./nova-oferta-form";
import { ControlesPedido, ControlesOferta } from "./controles";

const TIPO_LABEL: Record<string, string> = { CARRO: "Carro", MOTO: "Moto" };

function fmtMoeda(n: number) {
  return "R$ " + n.toLocaleString("pt-BR");
}

export default async function PedidosPage() {
  const [pedidos, ofertas, clientes] = await Promise.all([
    prisma.pedido.findMany({
      include: { cliente: true },
      orderBy: { criadoEm: "desc" },
    }),
    prisma.oferta.findMany({
      include: { cliente: true, fotos: { orderBy: { ordem: "asc" } } },
      orderBy: { criadoEm: "desc" },
    }),
    prisma.cliente.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
  ]);

  return (
    <div className="flex flex-col gap-12">
      {/* Pedidos */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium text-brand-graphite">Pedidos</h1>
            <p className="text-sm text-brand-gray">Veículos que clientes estão procurando.</p>
          </div>
          <NovoPedidoForm clientes={clientes} />
        </div>

        {pedidos.length === 0 ? (
          <p className="mt-4 text-sm text-brand-gray">Nenhum pedido registrado ainda.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-xs text-brand-gray">
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 font-medium">Procura</th>
                  <th className="px-4 py-3 font-medium">Observação</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {pedidos.map((p) => (
                  <tr key={p.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-3 font-medium text-brand-graphite">{p.cliente.nome}</td>
                    <td className="px-4 py-3 text-brand-gray">{TIPO_LABEL[p.tipo]}</td>
                    <td className="px-4 py-3 text-brand-gray">{p.descricao}</td>
                    <td className="px-4 py-3 text-brand-gray">{p.observacao ?? "—"}</td>
                    <td className="px-4 py-3">
                      <ControlesPedido id={p.id} status={p.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Ofertas */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-medium text-brand-graphite">Ofertas</h1>
            <p className="text-sm text-brand-gray">Veículos que ofereceram para a loja.</p>
          </div>
          <NovaOfertaForm clientes={clientes} fotosDireto={fotosViaBlobDireto()} />
        </div>

        {ofertas.length === 0 ? (
          <p className="mt-4 text-sm text-brand-gray">Nenhuma oferta registrada ainda.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-zinc-200 bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-xs text-brand-gray">
                  <th className="px-4 py-3 font-medium">Foto</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Veículo</th>
                  <th className="px-4 py-3 font-medium">Ano / Km</th>
                  <th className="px-4 py-3 font-medium">Preço pedido</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {ofertas.map((o) => (
                  <tr key={o.id} className="border-b border-zinc-100 last:border-0">
                    <td className="px-4 py-3">
                      {o.fotos[0] ? (
                        <div className="relative h-12 w-16 overflow-hidden rounded-md bg-zinc-100">
                          <Image
                            src={o.fotos[0].url}
                            alt={`${o.marca} ${o.modelo}`}
                            fill
                            sizes="64px"
                            className="object-cover"
                          />
                          {o.fotos.length > 1 && (
                            <span className="absolute bottom-0 right-0 rounded-tl bg-black/60 px-1 text-[10px] text-white">
                              +{o.fotos.length - 1}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex h-12 w-16 items-center justify-center rounded-md bg-zinc-100 text-[10px] text-brand-gray">
                          sem foto
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-medium text-brand-graphite">{o.cliente.nome}</td>
                    <td className="px-4 py-3 text-brand-gray">
                      {TIPO_LABEL[o.tipo]} · {o.marca} {o.modelo}
                    </td>
                    <td className="px-4 py-3 text-brand-gray">
                      {o.ano ?? "—"}
                      {o.km != null ? ` · ${o.km.toLocaleString("pt-BR")} km` : ""}
                    </td>
                    <td className="px-4 py-3 text-brand-gray">
                      {o.precoPedido != null ? fmtMoeda(Number(o.precoPedido)) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <ControlesOferta id={o.id} status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
