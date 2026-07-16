"use client";

import { useState } from "react";

export type ClienteOpcao = { id: string; nome: string };

export function SeletorCliente({ clientes }: { clientes: ClienteOpcao[] }) {
  const [novo, setNovo] = useState(false);

  return (
    <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
      <p className="mb-2 text-xs font-medium text-brand-gray">Cliente</p>

      {!novo ? (
        <>
          <select
            name="clienteId"
            defaultValue=""
            className="h-9 w-full rounded-md border border-zinc-300 px-2 text-sm"
          >
            <option value="">Selecione um cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setNovo(true)}
            className="mt-2 text-xs text-brand-red underline"
          >
            + Cadastrar novo cliente
          </button>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2">
            <input
              name="novoClienteNome"
              placeholder="Nome do cliente"
              className="h-9 rounded-md border border-zinc-300 px-2 text-sm"
            />
            <input
              name="novoClienteTelefone"
              placeholder="Telefone (opcional)"
              className="h-9 rounded-md border border-zinc-300 px-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => setNovo(false)}
            className="mt-2 text-xs text-brand-gray underline"
          >
            Escolher um cliente existente
          </button>
        </>
      )}
    </div>
  );
}
