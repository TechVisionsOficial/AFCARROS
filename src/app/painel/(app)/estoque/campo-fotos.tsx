"use client";

import { useState } from "react";

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

export function CampoFotos({ label }: { label: string }) {
  const [quantidade, setQuantidade] = useState(0);

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
