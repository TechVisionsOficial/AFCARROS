"use client";

import { useEffect, useRef, useState } from "react";

type Direcao = "cima" | "esquerda" | "direita";

/**
 * Revela o conteúdo com uma animação quando ele entra na tela ao rolar.
 *
 * ⚠️ REGRAS DE OURO (não quebrar) — as duas vêm do bug em que o site aparecia
 * vazio no celular do dono:
 *
 * 1. O conteúdo NASCE VISÍVEL. O estado escondido só é aplicado pelo JS, depois
 *    que ele já está rodando. Se o JS falhar/não hidratar, aparece tudo igual.
 *
 * 2. NÃO usamos IntersectionObserver. Era exatamente o mecanismo do
 *    framer-motion (`whileInView`) que não disparava no aparelho do dono — e,
 *    de fato, ele também não dispara no navegador de preview daqui. Usamos
 *    evento de scroll (confiável) + um timer de segurança: se nada disparar,
 *    revelamos assim mesmo. Assim o conteúdo NUNCA fica preso invisível — no
 *    pior caso perde-se a animação, nunca o conteúdo.
 */

/** Se nada revelar até aqui, revela de qualquer forma. Rede de segurança. */
const SEGURANCA_MS = 4000;

export function AoRolar({
  direcao = "cima",
  atraso = 0,
  className = "",
  children,
}: {
  direcao?: Direcao;
  /** Atraso da animação em segundos (para escalonar elementos). */
  atraso?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [oculto, setOculto] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const naTela = () => {
      const r = el.getBoundingClientRect();
      const altura = window.innerHeight || 0;
      // revela um pouco antes de encostar na borda, fica mais natural
      return r.top < altura * 0.85 && r.bottom > 0;
    };

    // Já está na tela ao carregar? Então nem esconde — evita o "pisca".
    if (naTela()) return;

    setOculto(true);

    let revelado = false;
    const revelar = () => {
      if (revelado) return;
      revelado = true;
      setOculto(false);
      limpar();
    };
    const verificar = () => {
      if (naTela()) revelar();
    };
    const seguranca = setTimeout(revelar, SEGURANCA_MS);
    function limpar() {
      window.removeEventListener("scroll", verificar);
      window.removeEventListener("resize", verificar);
      clearTimeout(seguranca);
    }

    window.addEventListener("scroll", verificar, { passive: true });
    window.addEventListener("resize", verificar);
    verificar();

    return limpar;
  }, []);

  return (
    <div
      ref={ref}
      style={atraso ? { transitionDelay: `${atraso}s` } : undefined}
      className={`af-rolar af-dir-${direcao} ${oculto ? "af-rolar-oculto" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
