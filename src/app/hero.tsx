"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { HeroArtwork } from "./hero-artwork";

export function Hero() {
  const [opacidade, setOpacidade] = useState(1);

  useEffect(() => {
    function aoRolar() {
      const ref = window.innerHeight * 0.6;
      const progresso = ref > 0 ? Math.min(window.scrollY / ref, 1) : 0;
      setOpacidade(1 - progresso);
    }
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, []);

  return (
    <header
      id="inicio"
      className="relative flex min-h-screen flex-col items-center justify-center gap-8 overflow-hidden bg-white px-6 text-center"
    >
      <HeroArtwork />
      <div
        style={{ opacity: opacidade, transform: `translateY(${(1 - opacidade) * -40}px)` }}
        className="relative transition-none"
      >
        <div className="af-reveal">
          <Image
            src="/branding/logo-fundo-claro.png"
            alt="AFCARROS — OKM, seminovos e importados"
            width={520}
            height={143}
            className="h-auto w-auto max-w-full"
            priority
          />
        </div>
      </div>

      <div
        style={{ opacity: opacidade }}
        className="absolute bottom-10 flex flex-col items-center gap-2 text-brand-gray"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs" style={{ fontFamily: "var(--font-support)" }}>
            Role para ver o estoque
          </span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="af-bounce"
          >
            <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </header>
  );
}
