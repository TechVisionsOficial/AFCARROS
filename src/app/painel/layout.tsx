import type { Metadata, Viewport } from "next";

/**
 * Vale para todas as páginas do painel (inclusive o login) e SÓ para elas:
 * o manifest que torna o painel instalável como app ("AF Painel"). Fica aqui,
 * e não no layout raiz, para que visitantes do site público não sejam
 * convidados a instalar nada.
 *
 * Os arquivos ficam em /app-painel/ e não em /painel/ de propósito: o
 * middleware manda tudo sob /painel/ para o login, e o iPhone busca o manifest
 * e os ícones sem o cookie de sessão — receberia a página de login no lugar.
 */
export const metadata: Metadata = {
  manifest: "/app-painel/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "AF Painel",
    statusBarStyle: "black",
  },
  icons: {
    // Mantém o favicon do site na aba e acrescenta o ícone de app do iPhone.
    icon: "/icon.svg",
    apple: "/app-painel/apple-touch-icon.png",
  },
};

// Cor da barra do navegador/sistema igual à barra do topo do painel.
export const viewport: Viewport = {
  themeColor: "#141416",
};

export default function PainelRaizLayout({ children }: { children: React.ReactNode }) {
  return children;
}
