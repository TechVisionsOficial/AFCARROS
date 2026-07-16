"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { marcarVendido, type MarcarVendidoState } from "./actions";
import { SeletorCliente, type ClienteOpcao } from "../seletor-cliente";

const initialState: MarcarVendidoState = { error: null, sucesso: false };

function hoje() {
  return new Date().toISOString().slice(0, 10);
}

function dispararConfete() {
  const duracao = 1500;
  const fim = Date.now() + duracao;

  (function frame() {
    confetti({
      particleCount: 4,
      angle: 60,
      spread: 60,
      origin: { x: 0, y: 0.7 },
      colors: ["#DA1F2B", "#141416", "#ffffff"],
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 60,
      origin: { x: 1, y: 0.7 },
      colors: ["#DA1F2B", "#141416", "#ffffff"],
    });
    if (Date.now() < fim) requestAnimationFrame(frame);
  })();
}

export function VenderVeiculoForm({
  veiculoId,
  precoVenda,
  clientes,
}: {
  veiculoId: string;
  precoVenda: number;
  clientes: ClienteOpcao[];
}) {
  const [aberto, setAberto] = useState(false);
  const [state, formAction, pending] = useActionState(marcarVendido, initialState);
  const jaComemorou = useRef(false);

  useEffect(() => {
    if (state.sucesso && !jaComemorou.current) {
      jaComemorou.current = true;
      dispararConfete();
      setAberto(false);
    }
  }, [state.sucesso]);

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="mt-2 h-8 w-full rounded-md border border-green-600 text-xs font-medium text-green-700"
      >
        Marcar como vendido
      </button>
    );
  }

  return (
    <form action={formAction} className="mt-2 flex flex-col gap-2 rounded-md bg-zinc-50 p-2">
      <input type="hidden" name="veiculoId" value={veiculoId} />
      <div>
        <label className="text-[11px] text-brand-gray">Preço real da venda</label>
        <input
          name="precoVendaReal"
          type="number"
          step="0.01"
          defaultValue={precoVenda}
          required
          className="h-8 w-full rounded-md border border-zinc-300 px-2 text-xs"
        />
      </div>
      <div>
        <label className="text-[11px] text-brand-gray">Data da venda</label>
        <input
          name="vendidoEm"
          type="date"
          defaultValue={hoje()}
          required
          className="h-8 w-full rounded-md border border-zinc-300 px-2 text-xs"
        />
      </div>
      <SeletorCliente clientes={clientes} prefix="comprador" label="Comprador" />
      {state.error && <p className="text-[11px] text-red-600">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="h-8 flex-1 rounded-md bg-green-600 text-xs font-medium text-white disabled:opacity-60"
        >
          {pending ? "Confirmando..." : "Confirmar venda"}
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="h-8 rounded-md border border-zinc-300 px-2 text-xs text-brand-gray"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
