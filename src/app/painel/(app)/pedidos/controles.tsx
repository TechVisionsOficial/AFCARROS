"use client";

import { useTransition } from "react";
import {
  mudarStatusPedido,
  mudarStatusOferta,
  removerPedido,
  removerOferta,
} from "./actions";

const STATUS_PEDIDO = [
  { value: "ABERTO", label: "Aberto" },
  { value: "ATENDIDO", label: "Atendido" },
  { value: "CANCELADO", label: "Cancelado" },
];

const STATUS_OFERTA = [
  { value: "ABERTA", label: "Aberta" },
  { value: "RECUSADA", label: "Recusada" },
  { value: "COMPRADA", label: "Comprada" },
];

export function ControlesPedido({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue={status}
        disabled={pending}
        onChange={(e) => startTransition(() => mudarStatusPedido(id, e.target.value))}
        className="h-8 rounded-md border border-zinc-300 px-2 text-xs"
      >
        {STATUS_PEDIDO.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => startTransition(() => removerPedido(id))}
        className="text-xs text-brand-gray hover:text-red-600"
      >
        remover
      </button>
    </div>
  );
}

export function ControlesOferta({ id, status }: { id: string; status: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue={status}
        disabled={pending}
        onChange={(e) => startTransition(() => mudarStatusOferta(id, e.target.value))}
        className="h-8 rounded-md border border-zinc-300 px-2 text-xs"
      >
        {STATUS_OFERTA.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => startTransition(() => removerOferta(id))}
        className="text-xs text-brand-gray hover:text-red-600"
      >
        remover
      </button>
    </div>
  );
}
