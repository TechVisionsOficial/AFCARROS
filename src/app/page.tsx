import { prisma } from "@/lib/prisma";
import {
  WHATSAPP_NUMERO,
  ENDERECO,
  INSTAGRAM_URL,
  FACEBOOK_URL,
} from "@/lib/contato";
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

const SITE = "https://www.afcarros.com.br";

/**
 * Dados estruturados (schema.org) da loja. É o que o Google lê para entender
 * que este site É a AFCARROS — nome, telefone, endereço, horário e redes — e
 * ligá-lo ao Perfil da Empresa no Google. Telefone, endereço e redes vêm de
 * lib/contato.ts. O horário está escrito aqui no formato do schema.org — se
 * mudar HORARIOS em contato.ts, atualize aqui também.
 */
const DADOS_ESTRUTURADOS = {
  "@context": "https://schema.org",
  "@type": "AutoDealer",
  name: "AFCARROS",
  url: SITE,
  logo: `${SITE}/branding/logo-fundo-claro.png`,
  image: `${SITE}/branding/logo-fundo-claro.png`,
  telephone: `+${WHATSAPP_NUMERO}`,
  address: {
    "@type": "PostalAddress",
    streetAddress: ENDERECO,
    addressLocality: "São Paulo",
    addressRegion: "SP",
    addressCountry: "BR",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "18:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Saturday",
      opens: "09:00",
      closes: "14:00",
    },
  ],
  sameAs: [INSTAGRAM_URL, FACEBOOK_URL],
};

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
    anoFabricacao: v.anoFabricacao,
    km: v.km,
    condicao: v.condicao,
    status: v.status,
    descricao: v.descricao,
    precoVenda: Number(v.precoVenda),
    fotos: v.fotos.map((f) => f.url),
  }));

  return (
    <div className="flex flex-col flex-1">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(DADOS_ESTRUTURADOS) }}
      />
      <Navbar />
      <Hero />
      <Sobre />
      <EstoquePublico veiculos={veiculos} />
      <Localizacao />
      <Rodape />
    </div>
  );
}
