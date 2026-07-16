"use client";

import { useActionState } from "react";
import { atualizarCliente, type EditarClienteState } from "./actions";

const QUALIDADES = [
  { value: "VERDE", label: "Verde — boa relação" },
  { value: "AMARELO", label: "Amarelo — atenção" },
  { value: "VERMELHO", label: "Vermelho — problemática" },
];

type ClienteEdicao = {
  id: string;
  nome: string;
  telefone: string | null;
  email: string | null;
  qualidadeRelacao: string;
};

const initialState: EditarClienteState = { error: null };

export function EditarClienteForm({ cliente }: { cliente: ClienteEdicao }) {
  const acaoComId = atualizarCliente.bind(null, cliente.id);
  const [state, formAction, pending] = useActionState(acaoComId, initialState);

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <div>
        <label className="mb-1 block text-xs text-brand-gray">Nome</label>
        <input
          name="nome"
          required
          defaultValue={cliente.nome}
          className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs text-brand-gray">Telefone</label>
          <input
            name="telefone"
            defaultValue={cliente.telefone ?? ""}
            className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-brand-gray">E-mail</label>
          <input
            name="email"
            type="email"
            defaultValue={cliente.email ?? ""}
            className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs text-brand-gray">Qualidade da relação</label>
        <select
          name="qualidadeRelacao"
          defaultValue={cliente.qualidadeRelacao}
          className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm"
        >
          {QUALIDADES.map((q) => (
            <option key={q.value} value={q.value}>
              {q.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-brand-gray">
          Compras e vendas de veículos são contadas automaticamente conforme os carros são
          cadastrados (fornecedor) e vendidos (comprador).
        </p>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-md bg-brand-red font-medium text-white disabled:opacity-60"
      >
        {pending ? "Salvando..." : "Salvar alterações"}
      </button>
    </form>
  );
}
