/**
 * Categorias de gasto de um veículo.
 *
 * Fonte única da lista que aparece no cadastro (rótulo mostrado <-> valor
 * guardado no banco). Para adicionar uma categoria nova:
 *   1. inclua um item aqui, na ordem que deve aparecer;
 *   2. adicione o mesmo valor ao enum CategoriaGasto em prisma/schema.prisma
 *      e rode a migração.
 */
export const CATEGORIAS_GASTO = [
  { label: "Despachante", value: "DESPACHANTE" },
  { label: "Polimento", value: "POLIMENTO" },
  { label: "Funilaria", value: "FUNILARIA" },
  { label: "Martelinho", value: "MARTELINHO" },
  { label: "Tapeçaria", value: "TAPECARIA" },
  { label: "Mecânico", value: "MECANICO" },
  { label: "Peças", value: "PECAS" },
  { label: "Laudo", value: "LAUDO" },
  { label: "Dívida ativa", value: "DIVIDA_ATIVA" },
  { label: "Débitos detran", value: "DEBITOS_DETRAN" },
  { label: "Comissão", value: "COMISSAO" },
  { label: "Juros", value: "JUROS" },
  { label: "Anúncio", value: "ANUNCIO" },
  { label: "Volante", value: "VOLANTE" },
  { label: "Cartório", value: "CARTORIO" },
  { label: "Uber", value: "UBER" },
  { label: "João Mecânico", value: "JOAO_MECANICO" },
  { label: "Feira do automóvel", value: "FEIRA_DO_AUTOMOVEL" },
  { label: "Mercadocar", value: "MERCADOCAR" },
  { label: "Carlão peças", value: "CARLAO_PECAS" },
  { label: "Contrato Renav", value: "CONTRATO_RENAV" },
  { label: "Combustível", value: "COMBUSTIVEL" },
  { label: "Outros", value: "OUTROS" },
] as const;

/** Só os valores que o formulário pode enviar hoje (para validar no servidor). */
export const VALORES_GASTO_VALIDOS = new Set<string>(CATEGORIAS_GASTO.map((c) => c.value));

/**
 * Rótulo de qualquer valor de categoria — inclui os antigos (Manutenção,
 * Documentação, Estética) que podem estar em gastos já lançados, mesmo não
 * aparecendo mais no cadastro. Usado só para exibição.
 */
export const CATEGORIA_GASTO_LABEL: Record<string, string> = {
  ...Object.fromEntries(CATEGORIAS_GASTO.map((c) => [c.value, c.label])),
  MANUTENCAO: "Manutenção",
  DOCUMENTACAO: "Documentação",
  ESTETICA: "Estética",
};
