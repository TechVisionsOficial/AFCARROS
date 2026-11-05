import Image from "next/image";
import { linkWhatsapp } from "@/lib/contato";

const LINKS = [
  { href: "#estoque", label: "Estoque" },
  { href: "#sobre", label: "Sobre" },
  { href: "#localizacao", label: "Onde estamos" },
];

// Sempre visível e escura: emenda com o banner no topo e continua apresentando
// a marca quando a pessoa rola pelo estoque.
export function Navbar() {
  return (
    <nav className="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-3 border-b border-white/10 bg-faixa-escura/90 px-4 py-3 backdrop-blur-sm sm:px-6">
      <a
        href="#inicio"
        className="flex shrink-0 items-center py-2"
      >
        <Image
          src="/branding/logo-fundo-escuro.png"
          alt="AFCARROS — início"
          width={112}
          height={31}
        />
      </a>

      <div className="flex items-center gap-4 sm:gap-6">
        <div className="hidden items-center gap-6 sm:flex">
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-white/80 transition-colors hover:text-white"
              style={{ fontFamily: "var(--font-support)" }}
            >
              {link.label}
            </a>
          ))}
        </div>
        <a
          href={linkWhatsapp("Olá! Vim pelo site da AFCARROS.")}
          target="_blank"
          rel="noopener noreferrer"
          className="whitespace-nowrap rounded-md bg-brand-red px-3 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90 sm:px-4"
        >
          WhatsApp
        </a>
      </div>
    </nav>
  );
}
