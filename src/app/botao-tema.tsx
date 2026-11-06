"use client";

/** Mesma chave lida pelo script do <head> em layout.tsx. */
const CHAVE = "afcarros-tema";

/**
 * Alterna entre modo claro e escuro. Enquanto a pessoa não escolher, o site
 * segue o modo do aparelho; a escolha fica salva para a próxima visita.
 *
 * O ícone certo (lua no claro, sol no escuro) é decidido só por CSS
 * (.so-tema-claro / .so-tema-escuro em globals.css), então já aparece certo
 * antes do JavaScript carregar.
 */
export function BotaoTema() {
  function alternar() {
    const html = document.documentElement;
    const atual =
      html.dataset.tema ??
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro");
    const novo = atual === "escuro" ? "claro" : "escuro";
    html.dataset.tema = novo;
    try {
      localStorage.setItem(CHAVE, novo);
    } catch {
      // navegação privada / armazenamento bloqueado: vale só nesta visita
    }
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-label="Alternar entre modo claro e escuro"
      title="Modo claro / escuro"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-white/20 text-white transition-colors hover:bg-white/10"
    >
      {/* Lua: aparece no modo claro (leva ao escuro) */}
      <span className="so-tema-claro" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      </span>
      {/* Sol: aparece no modo escuro (leva ao claro) */}
      <span className="so-tema-escuro" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      </span>
    </button>
  );
}
