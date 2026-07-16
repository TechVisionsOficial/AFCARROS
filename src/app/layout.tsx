import type { Metadata, Viewport } from "next";
import { Saira_Condensed, Space_Grotesk } from "next/font/google";
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

export const metadata: Metadata = {
  title: "AFCARROS — 0km, seminovos e importados",
  description: "Estoque de carros e motos da AFCARROS. Confira, compare e fale direto com a loja pelo WhatsApp.",
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
      <body className="flex min-h-screen flex-col">{children}</body>
    </html>
  );
}
