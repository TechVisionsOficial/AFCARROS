"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { linkWhatsapp, INSTAGRAM_URL, FACEBOOK_URL } from "@/lib/contato";
import { IconeWhatsapp, IconeInstagram, IconeFacebook } from "./icones";

export type VeiculoPublico = {
  id: string;
  tipo: string;
  marca: string;
  modelo: string;
  ano: number;
  anoFabricacao: number;
  km: number;
  condicao: string;
  status: string;
  descricao: string | null;
  precoVenda: number;
  fotos: string[];
};

const CONDICAO_LABEL: Record<string, string> = {
  NOVO: "Novo",
  SEMINOVO: "Seminovo",
};

const TIPO_LABEL: Record<string, string> = {
  CARRO: "Carro",
  MOTO: "Moto",
};

function fmtMoeda(n: number) {
  return "R$ " + n.toLocaleString("pt-BR");
}

/** Ano no padrão brasileiro: fabricação/modelo, ex.: "2015/2016". */
function fmtAno(veiculo: VeiculoPublico) {
  return `${veiculo.anoFabricacao}/${veiculo.ano}`;
}

function BotoesContato({ veiculo }: { veiculo: VeiculoPublico }) {
  const mensagem = `Olá! Tenho interesse no ${veiculo.marca} ${veiculo.modelo} ${fmtAno(veiculo)} anunciado na AFCARROS.`;
  return (
    <div className="flex gap-2">
      <a
        href={linkWhatsapp(mensagem)}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex h-10 flex-1 items-center justify-center gap-2 rounded-md bg-green-600 text-sm font-medium text-white transition-opacity hover:opacity-90"
      >
        <IconeWhatsapp className="h-4 w-4" />
        Conversar
      </a>
      <a
        href={INSTAGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        aria-label="Instagram da AFCARROS"
        className="flex h-10 w-10 items-center justify-center rounded-md border border-zinc-300 text-brand-graphite transition-colors hover:bg-zinc-100"
      >
        <IconeInstagram className="h-4 w-4" />
      </a>
      <a
        href={FACEBOOK_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        aria-label="Facebook da AFCARROS"
        className="flex h-10 w-10 items-center justify-center rounded-md border border-zinc-300 text-brand-graphite transition-colors hover:bg-zinc-100"
      >
        <IconeFacebook className="h-4 w-4" />
      </a>
    </div>
  );
}

function VeiculoCard({
  veiculo,
  index,
  onClick,
}: {
  veiculo: VeiculoPublico;
  index: number;
  onClick: () => void;
}) {
  const capa = veiculo.fotos[0] ?? null;
  const atraso = ["", "af-delay-1", "af-delay-2"][index % 3];

  return (
    <div
      onClick={onClick}
      className={`af-reveal ${atraso} cursor-pointer overflow-hidden rounded-2xl border border-zinc-200 bg-white transition-shadow hover:shadow-md`}
    >
      <div className="relative bg-zinc-100" style={{ aspectRatio: "4 / 3" }}>
        {capa ? (
          <Image
            src={capa}
            alt={`${veiculo.marca} ${veiculo.modelo}`}
            fill
            sizes="(min-width: 768px) 25vw, 50vw"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-brand-gray">Sem foto</div>
        )}
        {veiculo.status === "RESERVADO" && (
          <span className="absolute left-3 top-3 rounded-md bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
            Reservado
          </span>
        )}
        {veiculo.fotos.length > 1 && (
          <span className="absolute bottom-3 right-3 rounded-md bg-black/60 px-2 py-0.5 text-xs text-white">
            +{veiculo.fotos.length - 1} fotos
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-base font-medium text-brand-graphite">
          {veiculo.marca} {veiculo.modelo}
        </p>
        <p className="mt-0.5 text-sm text-brand-gray">
          {fmtAno(veiculo)} · {veiculo.km.toLocaleString("pt-BR")} km · {CONDICAO_LABEL[veiculo.condicao]}
        </p>
        <p className="mt-2 text-lg font-medium text-brand-graphite">{fmtMoeda(veiculo.precoVenda)}</p>

        <div className="mt-4">
          <BotoesContato veiculo={veiculo} />
        </div>
      </div>
    </div>
  );
}

function GaleriaModal({ veiculo, onClose }: { veiculo: VeiculoPublico; onClose: () => void }) {
  const [indice, setIndice] = useState(0);
  const fotos = veiculo.fotos;

  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIndice((i) => (i + 1) % Math.max(fotos.length, 1));
      if (e.key === "ArrowLeft") setIndice((i) => (i - 1 + fotos.length) % Math.max(fotos.length, 1));
    }
    window.addEventListener("keydown", aoTeclar);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = "";
    };
  }, [fotos.length, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ zIndex: 100 }}
      className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-black/70 p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "90vh" }}
        className="flex w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white"
      >
        <div className="relative h-64 shrink-0 bg-zinc-100 sm:h-72">
          {fotos.length > 0 ? (
            <Image
              src={fotos[indice]}
              alt={`${veiculo.marca} ${veiculo.modelo}`}
              fill
              sizes="(min-width: 768px) 768px, 100vw"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-brand-gray">Sem foto</div>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white"
          >
            ×
          </button>

          {fotos.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setIndice((i) => (i - 1 + fotos.length) % fotos.length)}
                aria-label="Foto anterior"
                className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => setIndice((i) => (i + 1) % fotos.length)}
                aria-label="Próxima foto"
                className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white"
              >
                ›
              </button>
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                {fotos.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIndice(i)}
                    aria-label={`Ver foto ${i + 1}`}
                    className={`h-1.5 w-1.5 rounded-full ${i === indice ? "bg-white" : "bg-white/40"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="overflow-y-auto p-6">
          <p className="text-xl font-medium text-brand-graphite">
            {veiculo.marca} {veiculo.modelo}
          </p>
          <p className="mt-1 text-sm text-brand-gray">
            {TIPO_LABEL[veiculo.tipo]} · {fmtAno(veiculo)} · {veiculo.km.toLocaleString("pt-BR")} km ·{" "}
            {CONDICAO_LABEL[veiculo.condicao]}
          </p>
          <p className="mt-3 text-2xl font-medium text-brand-graphite">{fmtMoeda(veiculo.precoVenda)}</p>

          {veiculo.descricao && (
            <p className="mt-4 whitespace-pre-line text-sm text-brand-gray">{veiculo.descricao}</p>
          )}

          <div className="mt-6">
            <BotoesContato veiculo={veiculo} />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

const FAIXAS_PRECO = [
  { valor: "todas", label: "Qualquer preço", min: 0, max: Infinity },
  { valor: "ate50", label: "Até R$ 50 mil", min: 0, max: 50000 },
  { valor: "50a100", label: "R$ 50 a 100 mil", min: 50000, max: 100000 },
  { valor: "100a200", label: "R$ 100 a 200 mil", min: 100000, max: 200000 },
  { valor: "acima200", label: "Acima de R$ 200 mil", min: 200000, max: Infinity },
];

const ORDENACOES = [
  { valor: "recentes", label: "Mais recentes" },
  { valor: "menorPreco", label: "Menor preço" },
  { valor: "maiorPreco", label: "Maior preço" },
  { valor: "menorKm", label: "Menor km" },
  { valor: "maisNovo", label: "Ano mais novo" },
];

function Seletor({
  rotulo,
  valor,
  onChange,
  children,
}: {
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <select
      aria-label={rotulo}
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      className="h-10 rounded-md border border-zinc-300 bg-white px-3 text-sm text-brand-graphite outline-none focus:border-brand-red"
    >
      {children}
    </select>
  );
}

export function EstoquePublico({ veiculos }: { veiculos: VeiculoPublico[] }) {
  const [selecionado, setSelecionado] = useState<VeiculoPublico | null>(null);
  const [tipo, setTipo] = useState("todos");
  const [condicao, setCondicao] = useState("todas");
  const [marca, setMarca] = useState("todas");
  const [faixa, setFaixa] = useState("todas");
  const [ordem, setOrdem] = useState("recentes");

  const marcas = useMemo(
    () => [...new Set(veiculos.map((v) => v.marca))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [veiculos],
  );

  const filtrados = useMemo(() => {
    const f = FAIXAS_PRECO.find((x) => x.valor === faixa) ?? FAIXAS_PRECO[0];
    const lista = veiculos.filter((v) => {
      if (tipo !== "todos" && v.tipo !== tipo) return false;
      if (condicao !== "todas" && v.condicao !== condicao) return false;
      if (marca !== "todas" && v.marca !== marca) return false;
      if (v.precoVenda < f.min || v.precoVenda >= f.max) return false;
      return true;
    });

    switch (ordem) {
      case "menorPreco":
        return [...lista].sort((a, b) => a.precoVenda - b.precoVenda);
      case "maiorPreco":
        return [...lista].sort((a, b) => b.precoVenda - a.precoVenda);
      case "menorKm":
        return [...lista].sort((a, b) => a.km - b.km);
      case "maisNovo":
        return [...lista].sort((a, b) => b.ano - a.ano);
      default:
        return lista; // já vem do servidor por mais recentes
    }
  }, [veiculos, tipo, condicao, marca, faixa, ordem]);

  const temFiltro =
    tipo !== "todos" || condicao !== "todas" || marca !== "todas" || faixa !== "todas";

  function limparFiltros() {
    setTipo("todos");
    setCondicao("todas");
    setMarca("todas");
    setFaixa("todas");
    setOrdem("recentes");
  }

  return (
    <section id="estoque" className="bg-white px-6 py-24">
      <h2 className="af-reveal mx-auto mb-6 max-w-5xl text-center text-2xl font-medium text-brand-graphite">
        Estoque disponível
      </h2>

      {veiculos.length === 0 ? (
        <p className="text-center text-brand-gray">
          Nenhum veículo disponível no momento — volte em breve.
        </p>
      ) : (
        <>
          {/* Filtros */}
          <div className="mx-auto mb-3 flex max-w-5xl flex-wrap items-center justify-center gap-2">
            <Seletor rotulo="Tipo de veículo" valor={tipo} onChange={setTipo}>
              <option value="todos">Carros e motos</option>
              <option value="CARRO">Carros</option>
              <option value="MOTO">Motos</option>
            </Seletor>

            <Seletor rotulo="Condição" valor={condicao} onChange={setCondicao}>
              <option value="todas">Novos e seminovos</option>
              <option value="NOVO">Novos</option>
              <option value="SEMINOVO">Seminovos</option>
            </Seletor>

            <Seletor rotulo="Marca" valor={marca} onChange={setMarca}>
              <option value="todas">Todas as marcas</option>
              {marcas.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Seletor>

            <Seletor rotulo="Faixa de preço" valor={faixa} onChange={setFaixa}>
              {FAIXAS_PRECO.map((f) => (
                <option key={f.valor} value={f.valor}>
                  {f.label}
                </option>
              ))}
            </Seletor>

            <Seletor rotulo="Ordenar por" valor={ordem} onChange={setOrdem}>
              {ORDENACOES.map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.label}
                </option>
              ))}
            </Seletor>
          </div>

          {/* Resultado */}
          <div className="mx-auto mb-8 flex max-w-5xl items-center justify-center gap-3 text-sm text-brand-gray">
            <span>
              {filtrados.length}{" "}
              {filtrados.length === 1 ? "veículo encontrado" : "veículos encontrados"}
            </span>
            {temFiltro && (
              <button
                type="button"
                onClick={limparFiltros}
                className="underline transition-colors hover:text-brand-graphite"
              >
                Limpar filtros
              </button>
            )}
          </div>

          {filtrados.length === 0 ? (
            <div className="flex flex-col items-center gap-3">
              <p className="text-center text-brand-gray">
                Nenhum veículo com esses filtros. Tente ampliar a busca.
              </p>
              <button
                type="button"
                onClick={limparFiltros}
                className="rounded-md border border-zinc-300 px-4 py-2 text-sm text-brand-graphite transition-colors hover:bg-zinc-50"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {filtrados.map((veiculo, i) => (
                <VeiculoCard
                  key={veiculo.id}
                  veiculo={veiculo}
                  index={i}
                  onClick={() => setSelecionado(veiculo)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {selecionado && (
        <GaleriaModal key={selecionado.id} veiculo={selecionado} onClose={() => setSelecionado(null)} />
      )}
    </section>
  );
}
