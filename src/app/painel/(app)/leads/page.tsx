import { prisma } from "@/lib/prisma";
import { Board } from "./board";
import { NovoLeadForm } from "./novo-lead-form";

export default async function LeadsPage() {
  const [leads, veiculos] = await Promise.all([
    prisma.lead.findMany({
      include: { cliente: true, veiculo: true },
      orderBy: { criadoEm: "asc" },
    }),
    prisma.veiculo.findMany({
      where: { status: "DISPONIVEL" },
      orderBy: { criadoEm: "desc" },
      select: { id: true, marca: true, modelo: true },
    }),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-medium text-brand-graphite">Leads</h1>
        <NovoLeadForm veiculos={veiculos} />
      </div>
      <Board leads={leads} />
    </div>
  );
}
