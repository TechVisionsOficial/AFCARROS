import Image from "next/image";
import { WHATSAPP_NUMERO, INSTAGRAM_URL, FACEBOOK_URL } from "@/lib/contato";
import { IconeWhatsapp, IconeInstagram, IconeFacebook } from "./icones";

export function Rodape() {
  return (
    <footer className="flex flex-col items-center gap-6 bg-brand-graphite px-6 py-12">
      <Image
        src="/branding/logo-fundo-escuro.png"
        alt="AFCARROS"
        width={180}
        height={50}
        className="h-auto w-auto"
      />
      <div className="flex gap-4">
        <a
          href={`https://wa.me/${WHATSAPP_NUMERO}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          className="flex h-10 w-10 items-center justify-center rounded-md border border-white/20 text-white transition-colors hover:bg-white/10"
        >
          <IconeWhatsapp className="h-4 w-4" />
        </a>
        <a
          href={INSTAGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="flex h-10 w-10 items-center justify-center rounded-md border border-white/20 text-white transition-colors hover:bg-white/10"
        >
          <IconeInstagram className="h-4 w-4" />
        </a>
        <a
          href={FACEBOOK_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook"
          className="flex h-10 w-10 items-center justify-center rounded-md border border-white/20 text-white transition-colors hover:bg-white/10"
        >
          <IconeFacebook className="h-4 w-4" />
        </a>
      </div>
      <p className="text-xs text-white/40" style={{ fontFamily: "var(--font-support)" }}>
        © {new Date().getFullYear()} AFCARROS
      </p>
    </footer>
  );
}
