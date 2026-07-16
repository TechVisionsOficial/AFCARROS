"use client";

import { useState, useTransition } from "react";
import { excluirVeiculo } from "./actions";

export function ExcluirVeiculo({
  veiculoId,
  nome,
}: {
  veiculoId: string;
  nome: string;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="mt-2 h-8 w-full rounded-md border border-red-300 text-xs font-medium text-red-600 hover:bg-red-50"
      >
        Excluir anúncio
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-md border border-red-200 bg-red-50 p-2">
      <p className="text-[11px] text-red-700">
        Excluir <span className="font-medium">{nome}</span>? Isto não pode ser desfeito.
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(() => excluirVeiculo(veiculoId))}
          className="h-8 flex-1 rounded-md bg-red-600 text-xs font-medium text-white disabled:opacity-60"
        >
          {pending ? "Excluindo..." : "Sim, excluir"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirmando(false)}
          className="h-8 rounded-md border border-zinc-300 px-2 text-xs text-brand-gray"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
