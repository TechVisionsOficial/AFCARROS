import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { fotosViaBlobDireto } from "@/lib/storage";
import { EditarVeiculoForm } from "./form";
import { DocumentosVeiculo } from "./documentos";

export default async function EditarVeiculoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [veiculo, clientes] = await Promise.all([
    prisma.veiculo.findUnique({
      where: { id },
      include: {
        fotos: { orderBy: { ordem: "asc" } },
        gastos: { orderBy: { data: "asc" } },
        documentos: { orderBy: { criadoEm: "asc" } },
      },
    }),
    prisma.cliente.findMany({
      orderBy: { nome: "asc" },
      select: { id: true, nome: true },
    }),
  ]);

  if (!veiculo) {
    notFound();
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-medium text-brand-graphite">
        Editar anúncio — {veiculo.marca} {veiculo.modelo}
      </h1>
      <EditarVeiculoForm
        veiculo={{
          id: veiculo.id,
          tipo: veiculo.tipo,
          marca: veiculo.marca,
          modelo: veiculo.modelo,
          ano: veiculo.ano,
          km: veiculo.km,
          condicao: veiculo.condicao,
          descricao: veiculo.descricao,
          precoVenda: Number(veiculo.precoVenda),
          precoCompra: Number(veiculo.precoCompra),
          precoMinimo: Number(veiculo.precoMinimo),
          dataAquisicao: veiculo.dataAquisicao
            ? veiculo.dataAquisicao.toISOString().slice(0, 10)
            : "",
          origemAquisicao: veiculo.origemAquisicao,
          fornecedorId: veiculo.fornecedorId ?? "",
        }}
        clientes={clientes}
        fotos={veiculo.fotos.map((f) => ({ id: f.id, url: f.url }))}
        gastos={veiculo.gastos.map((g) => ({
          id: g.id,
          categoria: g.categoria,
          valor: Number(g.valor),
        }))}
        fotosDireto={fotosViaBlobDireto()}
      />

      <DocumentosVeiculo
        veiculoId={veiculo.id}
        documentos={veiculo.documentos.map((d) => ({
          id: d.id,
          categoria: d.categoria,
          nome: d.nome,
        }))}
      />
    </div>
  );
}
