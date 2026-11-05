import { linkWhatsapp } from "@/lib/contato";
import { IconeWhatsapp } from "./icones";

/** Linhas de velocidade — o mesmo "///" do logo — no fundo do banner. */
function LinhasDeVelocidade() {
  const linhas = (
    <>
      <path d="M40,0 L0,800 L60,800 L100,0 Z" fill="#ffffff" />
      <path d="M120,0 L80,800 L110,800 L150,0 Z" fill="#DA1F2B" />
      <path d="M170,0 L130,800 L150,800 L190,0 Z" fill="#ffffff" />
    </>
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <svg
        className="absolute -left-24 top-0 h-full w-1/2"
        style={{ opacity: 0.08 }}
        viewBox="0 0 300 800"
        preserveAspectRatio="none"
      >
        {linhas}
      </svg>
      <svg
        className="absolute -right-24 bottom-0 h-full w-1/2 rotate-180"
        style={{ opacity: 0.08 }}
        viewBox="0 0 300 800"
        preserveAspectRatio="none"
      >
        {linhas}
      </svg>
    </div>
  );
}

/**
 * Banner de abertura. Compacto de propósito: o começo do estoque já aparece
 * embaixo da primeira tela. É a primeira faixa ESCURA da página; as seções
 * seguintes intercalam claro/escuro. O padding de cima inclui a barra fixa.
 */
export function Banner() {
  return (
    <header className="relative overflow-hidden bg-faixa-escura px-6 pb-14 pt-28 text-center sm:pb-16 sm:pt-32">
      <LinhasDeVelocidade />

      <div className="af-reveal relative mx-auto max-w-2xl">
        <p
          className="text-sm text-brand-red"
          style={{ fontFamily: "var(--font-support)", letterSpacing: "3px" }}
        >
          FALE DIRETO COM QUEM DECIDE
        </p>
        <h1
          className="mt-3 text-3xl font-bold italic leading-tight text-white sm:text-5xl"
          style={{ fontFamily: "var(--font-wordmark)" }}
        >
          Carros e motos seminovos em São Paulo
        </h1>
        <p className="mx-auto mt-3 max-w-md text-white/70" style={{ fontFamily: "var(--font-support)" }}>
          Escolha o carro e chame no WhatsApp — sem intermediários.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <a
            href="#estoque"
            className="flex h-11 items-center rounded-md bg-white px-6 text-sm font-medium text-brand-graphite transition-opacity hover:opacity-90"
          >
            Ver estoque
          </a>
          <a
            href={linkWhatsapp("Olá! Vim pelo site da AFCARROS.")}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-11 items-center gap-2 rounded-md bg-brand-red px-6 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <IconeWhatsapp className="h-4 w-4" />
            WhatsApp
          </a>
        </div>
      </div>
    </header>
  );
}
