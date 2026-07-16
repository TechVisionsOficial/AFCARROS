import {
  ENDERECO,
  CIDADE_UF,
  HORARIOS,
  GOOGLE_MAPS_URL,
  GOOGLE_MAPS_ROTA_URL,
  WAZE_ROTA_URL,
  linkWhatsapp,
} from "@/lib/contato";

function IconePino({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className={className} aria-hidden="true">
      <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

function IconeRota({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2 3 21l9-4 9 4L12 2z" />
    </svg>
  );
}

export function Localizacao() {
  return (
    <section id="localizacao" className="bg-brand-graphite px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <div className="af-reveal">
          <p
            className="text-sm text-brand-red"
            style={{ fontFamily: "var(--font-support)", letterSpacing: "3px" }}
          >
            VISITE A LOJA
          </p>
          <h2
            className="mt-2 text-3xl font-medium italic text-white"
            style={{ fontFamily: "var(--font-wordmark)" }}
          >
            Onde estamos
          </h2>
        </div>

        <div className="af-reveal af-delay-1 mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <a
            href={GOOGLE_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex min-h-80 flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8 text-center transition-colors hover:bg-white/10"
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                opacity: 0.04,
                backgroundImage:
                  "linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />
            <IconePino className="h-9 w-9 shrink-0 text-brand-red" />
            <div>
              <p className="text-base font-medium text-white">{ENDERECO}</p>
              <p className="mt-1 text-sm text-white/60">{CIDADE_UF}</p>
            </div>
            <span className="rounded-md bg-white px-4 py-2 text-sm font-medium text-brand-graphite transition-opacity group-hover:opacity-90">
              Ver no mapa
            </span>
          </a>

          <div className="flex flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-6">
            <div>
              <p
                className="text-xs text-white/50"
                style={{ fontFamily: "var(--font-support)", letterSpacing: "2px" }}
              >
                ENDEREÇO
              </p>
              <p className="mt-1 text-lg font-medium text-white">{ENDERECO}</p>
              <p className="text-sm text-white/60">{CIDADE_UF}</p>

              <p
                className="mt-6 text-xs text-white/50"
                style={{ fontFamily: "var(--font-support)", letterSpacing: "2px" }}
              >
                HORÁRIO
              </p>
              {HORARIOS.map((h) => (
                <p key={h.dias} className="mt-1 text-sm text-white/80">
                  {h.dias} · {h.horario}
                </p>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-2">
              <a
                href={linkWhatsapp("Olá! Gostaria de agendar uma visita na loja.")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 items-center justify-center rounded-md bg-white text-sm font-medium text-brand-graphite transition-opacity hover:opacity-90"
              >
                Agendar visita no WhatsApp
              </a>

              <p
                className="mt-2 text-xs text-white/50"
                style={{ fontFamily: "var(--font-support)", letterSpacing: "2px" }}
              >
                TRAÇAR ROTA
              </p>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href={GOOGLE_MAPS_ROTA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 items-center justify-center gap-2 rounded-md border border-white/20 text-sm text-white transition-colors hover:bg-white/10"
                >
                  <IconeRota className="h-4 w-4" />
                  Google Maps
                </a>
                <a
                  href={WAZE_ROTA_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-11 items-center justify-center gap-2 rounded-md border border-white/20 text-sm text-white transition-colors hover:bg-white/10"
                >
                  <IconeRota className="h-4 w-4" />
                  Waze
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
