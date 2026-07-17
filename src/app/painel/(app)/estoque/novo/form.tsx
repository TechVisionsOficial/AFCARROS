"use client";

import { useActionState, useEffect, useState } from "react";
import { criarVeiculo, type NovoVeiculoState } from "./actions";
import { CampoFotos } from "../campo-fotos";
import { CampoMoeda } from "../../campo-moeda";
import { SeletorCliente, type ClienteOpcao } from "../../seletor-cliente";

const ORIGENS = [
  { value: "", label: "Não informado" },
  { value: "LEILAO", label: "Leilão" },
  { value: "TROCA", label: "Troca" },
  { value: "PARTICULAR", label: "Particular" },
  { value: "CONSIGNADO", label: "Consignado" },
  { value: "OUTRO", label: "Outro" },
];

const CATEGORIAS_GASTO = [
  "Manutenção",
  "Documentação",
  "Estética",
  "Funilaria",
  "Outros",
];

const CATEGORIA_VALUE: Record<string, string> = {
  Manutenção: "MANUTENCAO",
  Documentação: "DOCUMENTACAO",
  Estética: "ESTETICA",
  Funilaria: "FUNILARIA",
  Outros: "OUTROS",
};

const initialState: NovoVeiculoState = { error: null };

export function NovoVeiculoForm({
  clientes,
  fotosDireto,
}: {
  clientes: ClienteOpcao[];
  fotosDireto: boolean;
}) {
  const [state, formAction, pending] = useActionState(criarVeiculo, initialState);
  const [gastos, setGastos] = useState<{ id: number; categoria: string; valor: string }[]>([]);
  const [precoCompra, setPrecoCompra] = useState("");
  const [precoVenda, setPrecoVenda] = useState("");
  const [precoMinimo, setPrecoMinimo] = useState("");
  const [nextId, setNextId] = useState(0);
  const [enviandoFotos, setEnviandoFotos] = useState(false);
  // Id gerado no cliente para que as fotos subam em veiculos/<id>/ ANTES de o
  // veículo existir. A action cria o veículo com este mesmo id (ver actions.ts).
  // Gerado após montar (não no SSR) para não divergir na hidratação.
  const [veiculoId, setVeiculoId] = useState("");
  useEffect(() => {
    setVeiculoId(crypto.randomUUID());
  }, []);

  function addGasto() {
    setGastos((g) => [...g, { id: nextId, categoria: "Manutenção", valor: "" }]);
    setNextId((n) => n + 1);
  }

  function updateGasto(id: number, campo: "categoria" | "valor", valor: string) {
    setGastos((g) => g.map((item) => (item.id === id ? { ...item, [campo]: valor } : item)));
  }

  function removeGasto(id: number) {
    setGastos((g) => g.filter((item) => item.id !== id));
  }

  const totalGastos = gastos.reduce((soma, g) => soma + (Number(g.valor) || 0), 0);
  const compra = Number(precoCompra) || 0;
  const venda = Number(precoVenda) || 0;
  const minimo = Number(precoMinimo) || 0;
  const margemCheia = venda - compra - totalGastos;
  const margemMinima = minimo - compra - totalGastos;
  const fmt = (n: number) => "R$ " + n.toLocaleString("pt-BR");

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <input type="hidden" name="veiculoId" value={veiculoId} />
      <div>
        <p className="mb-3 text-sm font-medium text-brand-gray">
          Dados do veículo — aparece no site
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select name="tipo" required className="h-10 rounded-md border border-zinc-300 px-3 text-sm">
            <option value="CARRO">Carro</option>
            <option value="MOTO">Moto</option>
          </select>
          <select name="condicao" required className="h-10 rounded-md border border-zinc-300 px-3 text-sm">
            <option value="SEMINOVO">Seminovo</option>
            <option value="NOVO">Novo</option>
          </select>
          <input name="marca" required placeholder="Marca" className="h-10 rounded-md border border-zinc-300 px-3 text-sm" />
          <input name="modelo" required placeholder="Modelo" className="h-10 rounded-md border border-zinc-300 px-3 text-sm" />
          <input name="anoFabricacao" type="number" required placeholder="Ano de fabricação" className="h-10 rounded-md border border-zinc-300 px-3 text-sm" />
          <input name="ano" type="number" required placeholder="Ano modelo" className="h-10 rounded-md border border-zinc-300 px-3 text-sm" />
          <input name="km" type="number" required placeholder="Km" className="h-10 rounded-md border border-zinc-300 px-3 text-sm" />
        </div>
        <textarea
          name="descricao"
          placeholder="Descrição (opcional)"
          rows={3}
          className="mt-3 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />
        <div className="mt-4">
          <CampoFotos
            label="Adicionar fotos"
            pasta={`veiculos/${veiculoId}`}
            direto={fotosDireto}
            onEnviandoChange={setEnviandoFotos}
          />
        </div>
      </div>

      <div className="rounded-xl bg-amber-50 p-4">
        <p className="mb-3 text-xs font-medium text-amber-800">
          Financeiro — visível apenas para administradores
        </p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-brand-gray">Preço de compra</label>
            <CampoMoeda
              name="precoCompra"
              required
              value={precoCompra}
              onChange={setPrecoCompra}
              className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-brand-gray">Preço de venda (anunciado)</label>
            <CampoMoeda
              name="precoVenda"
              required
              value={precoVenda}
              onChange={setPrecoVenda}
              className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-brand-gray">Preço mínimo (desconto até)</label>
            <CampoMoeda
              name="precoMinimo"
              required
              value={precoMinimo}
              onChange={setPrecoMinimo}
              className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-brand-gray">Data de aquisição</label>
            <input name="dataAquisicao" type="date" className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs text-brand-gray">Origem de aquisição</label>
            <select name="origemAquisicao" className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm">
              {ORIGENS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-4">
          <SeletorCliente
            clientes={clientes}
            prefix="fornecedor"
            label="Fornecedor — de quem a loja comprou este veículo"
          />
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-xs text-brand-gray">Gastos</label>
          <div className="flex flex-col gap-2">
            {gastos.map((g) => (
              <div key={g.id} className="grid grid-cols-[1fr_140px_32px] gap-2">
                <select
                  name="gastoCategoria"
                  value={CATEGORIA_VALUE[g.categoria]}
                  onChange={(e) => {
                    const label = Object.keys(CATEGORIA_VALUE).find(
                      (k) => CATEGORIA_VALUE[k] === e.target.value,
                    );
                    updateGasto(g.id, "categoria", label ?? "Manutenção");
                  }}
                  className="h-9 rounded-md border border-zinc-300 px-2 text-sm"
                >
                  {CATEGORIAS_GASTO.map((c) => (
                    <option key={c} value={CATEGORIA_VALUE[c]}>
                      {c}
                    </option>
                  ))}
                </select>
                <input
                  name="gastoValor"
                  type="number"
                  step="0.01"
                  placeholder="Valor"
                  value={g.valor}
                  onChange={(e) => updateGasto(g.id, "valor", e.target.value)}
                  className="h-9 rounded-md border border-zinc-300 px-2 text-sm"
                />
                <input type="hidden" name="gastoDescricao" value="" />
                <button
                  type="button"
                  onClick={() => removeGasto(g.id)}
                  className="h-9 rounded-md border border-zinc-300 text-xs text-brand-gray"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addGasto}
            className="mt-2 h-8 rounded-md border border-zinc-300 px-3 text-xs text-brand-gray"
          >
            + Adicionar gasto
          </button>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-md bg-white p-3">
            <p className="text-xs text-brand-gray">Total de gastos</p>
            <p className="text-lg font-medium">{fmt(totalGastos)}</p>
          </div>
          <div className="rounded-md bg-white p-3">
            <p className="text-xs text-brand-gray">Margem cheia</p>
            <p className="text-lg font-medium text-green-700">{fmt(margemCheia)}</p>
          </div>
          <div className="rounded-md bg-white p-3">
            <p className="text-xs text-brand-gray">Margem mínima garantida</p>
            <p className={`text-lg font-medium ${margemMinima < 0 ? "text-red-600" : ""}`}>
              {fmt(margemMinima)}
            </p>
          </div>
        </div>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || enviandoFotos}
        className="h-11 rounded-md bg-brand-red font-medium text-white disabled:opacity-60"
      >
        {enviandoFotos ? "Enviando fotos..." : pending ? "Salvando..." : "Salvar anúncio"}
      </button>
    </form>
  );
}
