import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const SITE = "https://www.afcarros.com.br";

// Acompanha a vitrine: revalida junto para o Google ver o estoque atualizado.
export const revalidate = 300;

/**
 * A loja é uma página única (a vitrine em "/"); os veículos aparecem nela, não
 * em URLs próprias. Então o sitemap tem só a home. O painel fica de fora (é
 * privado — ver robots.ts). `lastModified` usa a última mudança no estoque para
 * o Google saber quando vale a pena revisitar.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const ultimo = await prisma.veiculo
    .findFirst({ orderBy: { atualizadoEm: "desc" }, select: { atualizadoEm: true } })
    .catch(() => null);

  return [
    {
      url: SITE,
      lastModified: ultimo?.atualizadoEm ?? new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}
