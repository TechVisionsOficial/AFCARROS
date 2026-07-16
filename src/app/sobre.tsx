import Image from "next/image";
import { AoRolar } from "./ao-rolar";

export function Sobre() {
  return (
    <section
      id="sobre"
      className="flex flex-col items-center gap-10 bg-brand-graphite px-6 py-24 md:flex-row md:justify-center md:gap-16"
    >
      <AoRolar direcao="esquerda" className="overflow-hidden rounded-2xl">
        <Image
          src="/team/alexandro.jpg"
          alt="Alexandro Ferreira, fundador da AFCARROS"
          width={288}
          height={385}
          className="object-cover"
        />
      </AoRolar>

      <AoRolar direcao="direita" atraso={0.15} className="max-w-md text-center md:text-left">
        <p
          className="text-sm text-brand-red"
          style={{ fontFamily: "var(--font-support)", letterSpacing: "3px" }}
        >
          QUEM CUIDA DO SEU CARRO
        </p>
        <h2 className="mt-2 text-3xl font-medium italic text-white" style={{ fontFamily: "var(--font-wordmark)" }}>
          Alexandro Ferreira
        </h2>
        <p className="mt-4 text-white/70" style={{ fontFamily: "var(--font-support)" }}>
          Fundador da AFCARROS. Atendimento direto, sem intermediários — fale com quem decide.
        </p>
      </AoRolar>
    </section>
  );
}
