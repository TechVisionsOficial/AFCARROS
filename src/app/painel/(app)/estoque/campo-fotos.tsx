"use client";

import { useEffect, useState } from "react";
import { upload } from "@vercel/blob/client";

function IconeCamera({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

// Extensão derivada do tipo do arquivo (allowlist). Fora daqui, recusamos.
const EXT_POR_TIPO: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type FotoEnvio = {
  id: string;
  nome: string;
  status: "enviando" | "ok" | "erro";
  url?: string;
  erro?: string;
};

/**
 * Campo de fotos do veículo.
 *
 * - `direto` (produção): cada foto sobe direto do navegador para o Vercel Blob
 *   e guardamos a URL num campo escondido (`fotosUrls`). Não passa pelo limite
 *   de tamanho da server action, então dá para enviar quantas fotos quiser.
 * - `!direto` (local, sem Blob): volta ao input de arquivo tradicional, enviado
 *   pela própria action, que grava em disco.
 */
export function CampoFotos({
  label,
  pasta,
  direto,
  onEnviandoChange,
}: {
  label: string;
  /** Pasta de destino no Blob, ex.: "veiculos/<id>" ou "ofertas/<id>". */
  pasta: string;
  direto: boolean;
  onEnviandoChange?: (enviando: boolean) => void;
}) {
  const [quantidade, setQuantidade] = useState(0);
  const [envios, setEnvios] = useState<FotoEnvio[]>([]);

  const enviando = envios.some((e) => e.status === "enviando");
  useEffect(() => {
    onEnviandoChange?.(enviando);
  }, [enviando, onEnviandoChange]);

  // --- MODO LOCAL: input de arquivo tradicional (sem Blob configurado) ---
  if (!direto) {
    return (
      <div>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-red/50 bg-brand-red/5 px-6 py-8 text-center transition-colors hover:border-brand-red hover:bg-brand-red/10">
          <IconeCamera className="h-11 w-11 text-brand-red" />
          <span className="text-lg font-medium text-brand-graphite">{label}</span>
          <span className="text-sm text-brand-gray">
            Clique aqui para escolher as fotos do veículo
          </span>
          <input
            name="fotos"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => setQuantidade(e.target.files?.length ?? 0)}
          />
        </label>

        {quantidade > 0 && (
          <p className="mt-3 flex items-center gap-2 text-sm font-medium text-green-700">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-600 text-xs text-white">
              ✓
            </span>
            {quantidade} foto{quantidade > 1 ? "s" : ""} selecionada
            {quantidade > 1 ? "s" : ""}
          </p>
        )}
      </div>
    );
  }

  // --- MODO DIRETO: sobe cada foto ao Blob e guarda as URLs ---
  const urlsOk = envios.filter((e) => e.status === "ok" && e.url).map((e) => e.url as string);

  async function aoEscolher(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files ?? []);
    e.target.value = ""; // permite reescolher o mesmo arquivo depois

    for (const arquivo of arquivos) {
      const id = crypto.randomUUID();
      const ext = EXT_POR_TIPO[arquivo.type];
      if (!ext) {
        setEnvios((l) => [
          ...l,
          { id, nome: arquivo.name, status: "erro", erro: "tipo não suportado (use JPG, PNG ou WEBP)" },
        ]);
        continue;
      }

      setEnvios((l) => [...l, { id, nome: arquivo.name, status: "enviando" }]);
      try {
        const res = await upload(`${pasta}/${id}.${ext}`, arquivo, {
          access: "public",
          contentType: arquivo.type,
          handleUploadUrl: "/api/blob/foto",
        });
        setEnvios((l) => l.map((x) => (x.id === id ? { ...x, status: "ok", url: res.url } : x)));
      } catch (err) {
        setEnvios((l) =>
          l.map((x) => (x.id === id ? { ...x, status: "erro", erro: (err as Error).message } : x)),
        );
      }
    }
  }

  function remover(id: string) {
    setEnvios((l) => l.filter((x) => x.id !== id));
  }

  return (
    <div>
      {/* As URLs já enviadas viajam com o formulário para a server action. */}
      <input type="hidden" name="fotosUrls" value={JSON.stringify(urlsOk)} />

      <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-red/50 bg-brand-red/5 px-6 py-8 text-center transition-colors hover:border-brand-red hover:bg-brand-red/10">
        <IconeCamera className="h-11 w-11 text-brand-red" />
        <span className="text-lg font-medium text-brand-graphite">{label}</span>
        <span className="text-sm text-brand-gray">
          Clique aqui para escolher as fotos do veículo — pode selecionar várias
        </span>
        <input type="file" accept="image/*" multiple className="hidden" onChange={aoEscolher} />
      </label>

      {envios.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {envios.map((e) => (
            <div
              key={e.id}
              className="relative flex aspect-square items-center justify-center overflow-hidden rounded-md border border-zinc-200 bg-zinc-100"
            >
              {e.status === "ok" && e.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={e.url} alt={e.nome} className="h-full w-full object-cover" />
              ) : e.status === "enviando" ? (
                <span className="px-1 text-center text-xs text-brand-gray">enviando…</span>
              ) : (
                <span className="px-1 text-center text-xs text-red-600" title={e.erro}>
                  falhou
                </span>
              )}
              <button
                type="button"
                onClick={() => remover(e.id)}
                aria-label="Remover foto"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {enviando && (
        <p className="mt-2 text-sm text-brand-gray">
          Enviando fotos… aguarde terminar antes de salvar.
        </p>
      )}
    </div>
  );
}
