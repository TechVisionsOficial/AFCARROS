import { prisma } from "@/lib/prisma";
import { NovoVeiculoForm } from "./form";

export default async function NovoVeiculoPage() {
  const clientes = await prisma.cliente.findMany({
    orderBy: { nome: "asc" },
    select: { id: true, nome: true },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-medium text-brand-graphite">Novo anúncio</h1>
      <NovoVeiculoForm clientes={clientes} />
    </div>
  );
}
