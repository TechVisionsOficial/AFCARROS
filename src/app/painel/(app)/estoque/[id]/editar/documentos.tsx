"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import {
  adicionarDocumento,
  removerDocumento,
  type DocumentoState,
} from "./actions";

const CATEGORIAS = [
  { value: "LAUDO", label: "Laudo" },
  { value: "DOCUMENTACAO", label: "Documentação (CRLV/CRV)" },
  { value: "TRANSFERENCIA", label: "Transferência" },
  { value: "IPVA", label: "IPVA" },
  { value: "VISTORIA", label: "Vistoria" },
  { value: "OUTRO", label: "Outro" },
];

const CATEGORIA_LABEL: Record<string, string> = Object.fromEntries(
  CATEGORIAS.map((c) => [c.value, c.label]),
);

type Documento = { id: string; categoria: string; nome: string };

const initialState: DocumentoState = { error: null };

function IconeArquivo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M14 3v4a1 1 0 0 0 1 1h4" />
      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2z" />
    </svg>
  );
}

function LinhaDocumento({
  doc,
  veiculoId,
}: {
  doc: Documento;
  veiculoId: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-white px-3 py-2">
      <a
        href={`/painel/documentos/${doc.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex min-w-0 items-center gap-2 text-sm text-brand-graphite hover:underline"
      >
        <IconeArquivo className="h-5 w-5 shrink-0 text-brand-red" />
        <span className="shrink-0 rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] text-brand-gray">
          {CATEGORIA_LABEL[doc.categoria] ?? doc.categoria}
        </span>
        <span className="truncate">{doc.nome}</span>
      </a>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => removerDocumento(doc.id, veiculoId))}
        className="ml-2 shrink-0 text-xs text-brand-gray hover:text-red-600"
      >
        remover
      </button>
    </div>
  );
}

export function DocumentosVeiculo({
  veiculoId,
  documentos,
}: {
  veiculoId: string;
  documentos: Documento[];
}) {
  const acaoComId = adicionarDocumento.bind(null, veiculoId);
  const [state, formAction, pending] = useActionState(acaoComId, initialState);
  const [nomeArquivos, setNomeArquivos] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mt-8 max-w-2xl">
      <h2 className="text-lg font-medium text-brand-graphite">Documentos</h2>
      <p className="mb-3 text-sm text-brand-gray">
        Laudo, documentação, transferência, IPVA e tudo que precisa para a venda. Aceita PDF e
        imagens.
      </p>

      {documentos.length === 0 ? (
        <p className="mb-4 text-sm text-brand-gray">Nenhum documento anexado ainda.</p>
      ) : (
        <div className="mb-4 flex flex-col gap-2">
          {documentos.map((doc) => (
            <LinhaDocumento key={doc.id} doc={doc} veiculoId={veiculoId} />
          ))}
        </div>
      )}

      <form
        action={async (formData) => {
          await formAction(formData);
          setNomeArquivos([]);
          if (inputRef.current) inputRef.current.value = "";
        }}
        className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs text-brand-gray">Tipo do documento</label>
            <select
              name="categoria"
              defaultValue="LAUDO"
              className="h-10 w-full rounded-md border border-zinc-300 px-3 text-sm"
            >
              {CATEGORIAS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-brand-gray">Arquivo(s)</label>
            <input
              ref={inputRef}
              name="documentos"
              type="file"
              accept="application/pdf,image/*"
              multiple
              onChange={(e) =>
                setNomeArquivos(Array.from(e.target.files ?? []).map((f) => f.name))
              }
              className="text-sm"
            />
          </div>
        </div>

        {nomeArquivos.length > 0 && (
          <p className="text-xs text-brand-gray">
            {nomeArquivos.length} arquivo{nomeArquivos.length > 1 ? "s" : ""} selecionado
            {nomeArquivos.length > 1 ? "s" : ""}: {nomeArquivos.join(", ")}
          </p>
        )}

        {state.error && <p className="text-xs text-red-600">{state.error}</p>}

        <div>
          <button
            type="submit"
            disabled={pending}
            className="h-10 rounded-md bg-brand-red px-4 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "Enviando..." : "Adicionar documento"}
          </button>
        </div>
      </form>
    </div>
  );
}
