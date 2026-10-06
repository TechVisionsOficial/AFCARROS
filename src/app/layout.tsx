import type { Metadata, Viewport } from "next";
import { Saira_Condensed, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const sairaCondensed = Saira_Condensed({
  variable: "--font-wordmark",
  weight: ["700", "800"],
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-support",
  weight: ["500", "600"],
  subsets: ["latin"],
});

const DESCRICAO =
  "Estoque de carros e motos da AFCARROS. Confira, compare e fale direto com a loja pelo WhatsApp.";

export const metadata: Metadata = {
  // Base para URLs absolutas (Open Graph, canonical). Sem isso o Google e as
  // prévias de link recebem caminhos relativos.
  metadataBase: new URL("https://www.afcarros.com.br"),
  title: "AFCARROS — 0km, seminovos e importados",
  description: DESCRICAO,
  applicationName: "AFCARROS",
  alternates: { canonical: "/" },
  // Prévia quando o link é compartilhado (WhatsApp, Instagram, Facebook).
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "/",
    siteName: "AFCARROS",
    title: "AFCARROS — carros e motos seminovos em São Paulo",
    description: DESCRICAO,
    images: [{ url: "/branding/logo-fundo-claro.png", alt: "AFCARROS" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${sairaCondensed.variable} ${spaceGrotesk.variable} antialiased`}
    >
      <body className="flex min-h-screen flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
