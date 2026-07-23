import type { MetadataRoute } from "next";

const SITE = "https://www.afcarros.com.br";

/**
 * Orienta os buscadores: a vitrine pode ser indexada; o painel e a API ficam de
 * fora (área privada, nada a indexar). Aponta para o sitemap.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/painel", "/api"],
    },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
