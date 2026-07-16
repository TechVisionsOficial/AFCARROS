"use client";

import { useActionState, useState } from "react";
import { criarPedido, type PedidoState } from "./actions";
import { SeletorCliente, type ClienteOpcao } from "./seletor-cliente";

const initialState: PedidoState = { error: null };

export function NovoPedidoForm({ clientes }: { clientes: ClienteOpcao[] }) {
  const [aberto, setAberto] = useState(false);
  const [state, formAction, pending] = useActionState(criarPedido, initialState);

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="rounded-md bg-brand-red px-4 py-2 text-sm font-medium text-white"
      >
        + Novo pedido
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        await formAction(formData);
        setAberto(false);
      }}
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4"
    >
      <SeletorCliente clientes={clientes} />

      <div className="grid grid-cols-[120px_1fr] gap-2">
        <select name="tipo" required className="h-9 rounded-md border border-zinc-300 px-2 text-sm">
          <option value="CARRO">Carro</option>
          <option value="MOTO">Moto</option>
        </select>
        <input
          name="descricao"
          required
          placeholder="O que procura (ex.: Onix 2020 até R$ 60 mil)"
          className="h-9 rounded-md border border-zinc-300 px-2 text-sm"
        />
      </div>

      <input
        name="observacao"
        placeholder="Observação (opcional)"
        className="h-9 rounded-md border border-zinc-300 px-2 text-sm"
      />

      {state.error && <p className="text-xs text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="h-9 rounded-md bg-brand-red px-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Salvar pedido"}
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="h-9 rounded-md border border-zinc-300 px-3 text-sm text-brand-gray"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
