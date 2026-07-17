import { prisma } from "@/lib/prisma";
import { Navbar } from "./navbar";
import { Hero } from "./hero";
import { Sobre } from "./sobre";
import { EstoquePublico, type VeiculoPublico } from "./estoque-publico";
import { Localizacao } from "./localizacao";
import { Rodape } from "./rodape";

/**
 * A vitrine é gerada estaticamente (rápida) e atualizada na hora que o estoque
 * muda — as actions do painel chamam `revalidatePath("/")`.
 *
 * Este `revalidate` é a rede de segurança: se aquele aviso falhar, a página se
 * atualiza sozinha em no máximo 5 minutos. Sem ele, uma falha no revalidate
 * congelaria a vitrine para sempre (carro vendido continuaria anunciado).
 */
export const revalidate = 300;

export default async function Home() {
  const veiculosDb = await prisma.veiculo.findMany({
    where: { status: { in: ["DISPONIVEL", "RESERVADO"] } },
    include: { fotos: { orderBy: { ordem: "asc" } } },
    orderBy: { criadoEm: "desc" },
  });

  const veiculos: VeiculoPublico[] = veiculosDb.map((v) => ({
    id: v.id,
    tipo: v.tipo,
    marca: v.marca,
    modelo: v.modelo,
    ano: v.ano,
    km: v.km,
    condicao: v.condicao,
    status: v.status,
    descricao: v.descricao,
    precoVenda: Number(v.precoVenda),
    fotos: v.fotos.map((f) => f.url),
  }));

  return (
    <div className="flex flex-col flex-1">
      <Navbar />
      <Hero />
      <Sobre />
      <EstoquePublico veiculos={veiculos} />
      <Localizacao />
      <Rodape />
    </div>
  );
}
