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
