import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { EditarClienteForm } from "./form";

export default async function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cliente = await prisma.cliente.findUnique({ where: { id } });
  if (!cliente) {
    notFound();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-medium text-brand-graphite">
        Editar cliente — {cliente.nome}
      </h1>
      <EditarClienteForm
        cliente={{
          id: cliente.id,
          nome: cliente.nome,
          telefone: cliente.telefone,
          email: cliente.email,
          qualidadeRelacao: cliente.qualidadeRelacao,
        }}
      />
    </div>
  );
}
