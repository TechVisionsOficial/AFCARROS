"use client";

import { useActionState, useState } from "react";
import { createLead, type CreateLeadState } from "./actions";

const ORIGENS = [
  { value: "SITE", label: "Site" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "FACEBOOK", label: "Facebook" },
  { value: "INDICACAO", label: "Indicação" },
  { value: "OUTRO", label: "Outro" },
];

const initialState: CreateLeadState = { error: null };

export function NovoLeadForm({
  veiculos,
}: {
  veiculos: { id: string; marca: string; modelo: string }[];
}) {
  const [aberto, setAberto] = useState(false);
  const [state, formAction, pending] = useActionState(createLead, initialState);

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="rounded-md bg-brand-red px-4 py-2 text-sm font-medium text-white"
      >
        + Novo lead
      </button>
    );
  }

  return (
    <form
      action={async (formData) => {
        await formAction(formData);
        setAberto(false);
      }}
      className="flex flex-wrap items-end gap-2 rounded-xl border border-zinc-200 bg-white p-3"
    >
      <div className="flex flex-col gap-1">
        <label className="text-xs text-brand-gray">Cliente</label>
        <input
          name="nome"
          required
          className="h-9 w-40 rounded-md border border-zinc-300 px-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-brand-gray">Telefone</label>
        <input
          name="telefone"
          className="h-9 w-32 rounded-md border border-zinc-300 px-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-brand-gray">Veículo</label>
        <select
          name="veiculoId"
          className="h-9 w-40 rounded-md border border-zinc-300 px-2 text-sm"
        >
          <option value="">Nenhum</option>
          {veiculos.map((v) => (
            <option key={v.id} value={v.id}>
              {v.marca} {v.modelo}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-brand-gray">Origem</label>
        <select
          name="origem"
          required
          defaultValue=""
          className="h-9 w-32 rounded-md border border-zinc-300 px-2 text-sm"
        >
          <option value="" disabled>
            Selecione
          </option>
          {ORIGENS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {state.error && <p className="w-full text-xs text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="h-9 rounded-md bg-brand-red px-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Salvando..." : "Salvar"}
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
