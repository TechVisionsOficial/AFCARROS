"use client";

import { useActionState, useState } from "react";
import { criarOferta, type OfertaState } from "./actions";
import { SeletorCliente, type ClienteOpcao } from "./seletor-cliente";
import { CampoFotos } from "../estoque/campo-fotos";

const initialState: OfertaState = { error: null };

export function NovaOfertaForm({ clientes }: { clientes: ClienteOpcao[] }) {
  const [aberto, setAberto] = useState(false);
  const [state, formAction, pending] = useActionState(criarOferta, initialState);

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="rounded-md bg-brand-red px-4 py-2 text-sm font-medium text-white"
      >
        + Nova oferta
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

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <select name="tipo" required className="h-9 rounded-md border border-zinc-300 px-2 text-sm">
          <option value="CARRO">Carro</option>
          <option value="MOTO">Moto</option>
        </select>
        <input name="marca" required placeholder="Marca" className="h-9 rounded-md border border-zinc-300 px-2 text-sm" />
        <input name="modelo" required placeholder="Modelo" className="h-9 rounded-md border border-zinc-300 px-2 text-sm" />
        <input name="ano" type="number" placeholder="Ano" className="h-9 rounded-md border border-zinc-300 px-2 text-sm" />
        <input name="km" type="number" placeholder="Km" className="h-9 rounded-md border border-zinc-300 px-2 text-sm" />
        <input
          name="precoPedido"
          type="number"
          step="0.01"
          placeholder="Preço pedido"
          className="h-9 rounded-md border border-zinc-300 px-2 text-sm sm:col-span-2"
        />
      </div>

      <input
        name="observacao"
        placeholder="Observação (opcional)"
        className="h-9 rounded-md border border-zinc-300 px-2 text-sm"
      />

      <CampoFotos label="Adicionar fotos do veículo ofertado" />

      {state.error && <p className="text-xs text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="h-9 rounded-md bg-brand-red px-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Salvar oferta"}
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
