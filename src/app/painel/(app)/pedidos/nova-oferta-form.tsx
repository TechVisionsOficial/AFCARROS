"use client";

import { useActionState, useState } from "react";
import { criarOferta, type OfertaState } from "./actions";
import { SeletorCliente, type ClienteOpcao } from "./seletor-cliente";
import { CampoFotos } from "../estoque/campo-fotos";
import { CampoMoeda } from "../campo-moeda";

const initialState: OfertaState = { error: null };

export function NovaOfertaForm({
  clientes,
  fotosDireto,
}: {
  clientes: ClienteOpcao[];
  fotosDireto: boolean;
}) {
  const [aberto, setAberto] = useState(false);
  const [state, formAction, pending] = useActionState(criarOferta, initialState);
  const [enviandoFotos, setEnviandoFotos] = useState(false);
  const [precoPedido, setPrecoPedido] = useState("");
  // Id gerado no cliente para as fotos subirem em ofertas/<id>/ antes de a
  // oferta existir; a action cria a oferta com este mesmo id.
  const [ofertaId] = useState(() => crypto.randomUUID());

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
      <input type="hidden" name="ofertaId" value={ofertaId} />
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
        <CampoMoeda
          name="precoPedido"
          value={precoPedido}
          onChange={setPrecoPedido}
          className="h-9 rounded-md border border-zinc-300 px-2 text-sm sm:col-span-2"
        />
      </div>

      <input
        name="observacao"
        placeholder="Observação (opcional)"
        className="h-9 rounded-md border border-zinc-300 px-2 text-sm"
      />

      <CampoFotos
        label="Adicionar fotos do veículo ofertado"
        pasta={`ofertas/${ofertaId}`}
        direto={fotosDireto}
        onEnviandoChange={setEnviandoFotos}
      />

      {state.error && <p className="text-xs text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending || enviandoFotos}
          className="h-9 rounded-md bg-brand-red px-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {enviandoFotos ? "Enviando fotos..." : pending ? "Salvando..." : "Salvar oferta"}
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
