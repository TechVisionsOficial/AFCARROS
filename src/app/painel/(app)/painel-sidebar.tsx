"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "./actions";

const NAV_ITEMS = [
  { href: "/painel", label: "Dashboard" },
  { href: "/painel/estoque", label: "Estoque" },
  { href: "/painel/leads", label: "Leads" },
  { href: "/painel/pedidos", label: "Pedidos e ofertas" },
  { href: "/painel/clientes", label: "Clientes" },
];

function Links({ onNavegar }: { onNavegar?: () => void }) {
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onNavegar}
          className="rounded-md px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white"
        >
          {item.label}
        </Link>
      ))}

      {/* AFCARROS AI — destacado */}
      <Link
        href="/painel/ai"
        onClick={onNavegar}
        className="mt-1 flex items-center gap-2 rounded-md border border-brand-red/40 bg-brand-red/10 px-3 py-2 text-sm font-medium text-white hover:bg-brand-red/20"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded bg-brand-red text-[10px] font-bold text-white">
          AI
        </span>
        AFCARROS AI
      </Link>
    </nav>
  );
}

function Rodape({ nome }: { nome: string }) {
  return (
    <div className="flex flex-col gap-2 border-t border-white/10 pt-4">
      <p className="px-3 text-sm text-white/70">{nome}</p>
      <form action={logout}>
        <button
          type="submit"
          className="w-full rounded-md px-3 py-2 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white"
        >
          Sair
        </button>
      </form>
    </div>
  );
}

export function PainelSidebar({ nome }: { nome: string }) {
  const [aberto, setAberto] = useState(false);
  const pathname = usePathname();

  // fecha o menu ao trocar de página
  useEffect(() => {
    setAberto(false);
  }, [pathname]);

  return (
    <>
      {/* Desktop: barra lateral fixa */}
      <aside className="sticky top-0 hidden h-screen w-56 flex-col justify-between overflow-y-auto bg-brand-graphite px-4 py-6 md:flex">
        <div>
          <Image
            src="/branding/logo-fundo-escuro.png"
            alt="AFCARROS"
            width={160}
            height={44}
            className="mb-8"
          />
          <Links />
        </div>
        <Rodape nome={nome} />
      </aside>

      {/* Mobile: barra no topo com botão de menu */}
      <div className="sticky top-0 z-40 md:hidden">
        <div className="flex items-center justify-between bg-brand-graphite px-4 py-3">
          <Image
            src="/branding/logo-fundo-escuro.png"
            alt="AFCARROS"
            width={120}
            height={33}
          />
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            aria-label={aberto ? "Fechar menu" : "Abrir menu"}
            aria-expanded={aberto}
            className="flex h-10 w-10 items-center justify-center rounded-md border border-white/20 text-white"
          >
            {aberto ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            )}
          </button>
        </div>

        {aberto && (
          <div className="border-t border-white/10 bg-brand-graphite px-4 pb-4 pt-2">
            <Links onNavegar={() => setAberto(false)} />
            <div className="mt-3">
              <Rodape nome={nome} />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
