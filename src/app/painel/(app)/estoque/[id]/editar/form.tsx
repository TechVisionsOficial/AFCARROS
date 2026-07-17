"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { atualizarVeiculo, removerFoto, removerGasto, type EditarVeiculoState } from "./actions";
import { CampoFotos } from "../../campo-fotos";
import { SeletorCliente, type ClienteOpcao } from "../../../seletor-cliente";

const ORIGENS = [
  { value: "", label: "Não informado" },
  { value: "LEILAO", label: "Leilão" },
  { value: "TROCA", label: "Troca" },
  { value: "PARTICULAR", label: "Particular" },
  { value: "CONSIGNADO", label: "Consignado" },
  { value: "OUTRO", label: "Outro" },
];

const CATEGORIAS_GASTO = ["Manutenção", "Documentação", "Estética", "Funilaria", "Outros"];

const CATEGORIA_VALUE: Record<string, string> = {
  Manutenção: "MANUTENCAO",
  Documentação: "DOCUMENTACAO",
  Estética: "ESTETICA",
  Funilaria: "FUNILARIA",
  Outros: "OUTROS",
};

const CATEGORIA_LABEL: Record<string, string> = {
  MANUTENCAO: "Manutenção",
  DOCUMENTACAO: "Documentação",
  ESTETICA: "Estética",
  FUNILARIA: "Funilaria",
  OUTROS: "Outros",
};

type VeiculoEdicao = {
  id: string;
  tipo: string;
  marca: string;
  modelo: string;
  ano: number;
  km: number;
  condicao: string;
  descricao: string | null;
  precoVenda: number;
  precoCompra: number;
  precoMinimo: number;
  dataAquisicao: string;
  origemAquisicao: string | null;
  fornecedorId: string;
};

type FotoExistente = { id: string; url: string };
type GastoExistente = { id: string; categoria: string; valor: number };

const initialState: EditarVeiculoState = { error: null };

export function EditarVeiculoForm({
  veiculo,
  clientes,
  fotos,
  gastos: gastosExistentes,
  fotosDireto,
}: {
  veiculo: VeiculoEdicao;
  clientes: ClienteOpcao[];
  fotos: FotoExistente[];
  gastos: GastoExistente[];
  fotosDireto: boolean;
}) {
  const acaoComId = atualizarVeiculo.bind(null, veiculo.id);
  const [state, formAction, pending] = useActionState(acaoComId, initialState);
  const [enviandoFotos, setEnviandoFotos] = useState(false);

  const [gastosNovos, setGastosNovos] = useState<{ id: number; categoria: string; valor: string }[]>([]);
  const [precoCompra, setPrecoCompra] = useState(String(veiculo.precoCompra));
  const [precoVenda, setPrecoVenda] = useState(String(veiculo.precoVenda));
  const [precoMinimo, setPrecoMinimo] = useState(String(veiculo.precoMinimo));
  const [nextId, setNextId] = useState(0);

  function addGasto() {
    setGastosNovos((g) => [...g, { id: nextId, categoria: "Manutenção", valor: "" }]);
    setNextId((n) => n + 1);
  }

  function updateGastoNovo(id: number, campo: "categoria" | "valor", valor: string) {
    setGastosNovos((g) => g.map((item) => (item.id === id ? { ...item, [campo]: valor } : item)));
  }

  function removeGastoNovo(id: number) {
    setGastosNovos((g) => g.filter((item) => item.id !== id));
  }

  const totalGastosExistentes = gastosExistentes.reduce((soma, g) => soma + g.valor, 0);
  const totalGastosNovos = gastosNovos.reduce((soma, g) => soma + (Number(g.valor) || 0), 0);
  const totalGastos = totalGastosExistentes + totalGastosNovos;
  const compra = Number(precoCompra) || 0;
  const venda = Number(precoVenda) || 0;
  const minimo = Number(precoMinimo) || 0;
  const margemCheia = venda - compra - totalGastos;
  const margemMinima = minimo - compra - totalGastos;
  const fmt = (n: number) => "R$ " + n.toLocaleString("pt-BR");

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-6">
      <div>
        <p className="mb-3 text-sm font-medium text-brand-gray">Dados do veículo — aparece no site</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <select
            name="tipo"
            required
            defaultValue={veiculo.tipo}
            className="h-10 rounded-md border border-zinc-300 px-3 text-sm"
          >
            <option value="CARRO">Carro</option>
            <option value="MOTO">Moto</option>
          </select>
          <select
            name="condicao"
            required
            defaultValue={veiculo.condicao}
            className="h-10 rounded-md border border-zinc-300 px-3 text-sm"
          >
            <option value="SEMINOVO">Seminovo</option>
            <option value="NOVO">Novo</option>
          </select>
          <input
            name="marca"
            required
            defaultValue={veiculo.marca}
            placeholder="Marca"
            className="h-10 rounded-md border border-zinc-300 px-3 text-sm"
          />
          <input
            name="modelo"
            required
            defaultValue={veiculo.modelo}
            placeholder="Modelo"
            className="h-10 rounded-md border border-zinc-300 px-3 text-sm"
          />
          <input
            name="ano"
            type="number"
            required
            defaultValue={veiculo.ano}
            placeholder="Ano"
            className="h-10 rounded-md border border-zinc-300 px-3 text-sm"
          />
          <input
            name="km"
            type="number"
            required
            defaultValue={veiculo.km}
            placeholder="Km"
            className="h-10 rounded-md border border-zinc-300 px-3 text-sm"
          />
        </div>
        <textarea
          name="descricao"
          defaultValue={veiculo.descricao ?? ""}
          placeholder="Descrição (opcional)"
          rows={3}
          className="mt-3 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
        />

        <div className="mt-4">
          <label className="mb-2 block text-xs text-brand-gray">Fotos atuais</label>
          {fotos.length === 0 ? (
            <p className="text-xs text-brand-gray">Nenhuma foto cadastrada ainda.</p>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {fotos.map((foto) => (
                <div key={foto.id} className="relative aspect-square overflow-hidden rounded-md bg-zinc-100">
                  <Image src={foto.url} alt="" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => removerFoto(foto.id, veiculo.id)}
                    aria-label="Remover foto"
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4">
          <CampoFotos
            label="Adicionar novas fotos"
            pasta={`veiculos/${veiculo.id}`}
            direto={fotosDireto}
            onEnviandoChange={setEnviandoFotos}
          />
        </div>
      </div>

      <div className="rounded-xl bg-amber-50 p-4">
        <p className="mb-3 text-xs font-medium text-amber-800">Financeiro — visível apenas para administradores</p>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-brand-gray">Preço de compra</label>
            <input
              name="precoCompra"
              type="number"
              step="0.01"
              required
              value={precoCompra}
              onChange={(e) => setPrecoCompra(e.target.value)}
              className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-brand-gray">Preço de venda (anunciado)</label>
            <input
              name="precoVenda"
              type="number"
              step="0.01"
              required
              value={precoVenda}
              onChange={(e) => setPrecoVenda(e.target.value)}
              className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-brand-gray">Preço mínimo (desconto até)</label>
            <input
              name="precoMinimo"
              type="number"
              step="0.01"
              required
              value={precoMinimo}
              onChange={(e) => setPrecoMinimo(e.target.value)}
              className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-brand-gray">Data de aquisição</label>
            <input
              name="dataAquisicao"
              type="date"
              defaultValue={veiculo.dataAquisicao}
              className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-brand-gray">Origem de aquisição</label>
            <select
              name="origemAquisicao"
              defaultValue={veiculo.origemAquisicao ?? ""}
              className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm"
            >
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
            defaultId={veiculo.fornecedorId}
          />
        </div>

        <div className="mt-4">
          <label className="mb-2 block text-xs text-brand-gray">Gastos já lançados</label>
          {gastosExistentes.length === 0 ? (
            <p className="mb-2 text-xs text-brand-gray">Nenhum gasto lançado ainda.</p>
          ) : (
            <div className="mb-2 flex flex-col gap-2">
              {gastosExistentes.map((g) => (
                <div key={g.id} className="flex items-center justify-between rounded-md bg-white px-3 py-2 text-sm">
                  <span>
                    {CATEGORIA_LABEL[g.categoria] ?? g.categoria} — {fmt(g.valor)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removerGasto(g.id, veiculo.id)}
                    className="text-xs text-brand-gray hover:text-red-600"
                  >
                    remover
                  </button>
                </div>
              ))}
            </div>
          )}

          <label className="mb-2 block text-xs text-brand-gray">Novos gastos</label>
          <div className="flex flex-col gap-2">
            {gastosNovos.map((g) => (
              <div key={g.id} className="grid grid-cols-[1fr_140px_32px] gap-2">
                <select
                  name="gastoCategoria"
                  value={CATEGORIA_VALUE[g.categoria]}
                  onChange={(e) => {
                    const label = Object.keys(CATEGORIA_VALUE).find(
                      (k) => CATEGORIA_VALUE[k] === e.target.value,
                    );
                    updateGastoNovo(g.id, "categoria", label ?? "Manutenção");
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
                  onChange={(e) => updateGastoNovo(g.id, "valor", e.target.value)}
                  className="h-9 rounded-md border border-zinc-300 px-2 text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeGastoNovo(g.id)}
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
            <p className={`text-lg font-medium ${margemMinima < 0 ? "text-red-600" : ""}`}>{fmt(margemMinima)}</p>
          </div>
        </div>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || enviandoFotos}
        className="h-11 rounded-md bg-brand-red font-medium text-white disabled:opacity-60"
      >
        {enviandoFotos ? "Enviando fotos..." : pending ? "Salvando..." : "Salvar alterações"}
      </button>
    </form>
  );
}
