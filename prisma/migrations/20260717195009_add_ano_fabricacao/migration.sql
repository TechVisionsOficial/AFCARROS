-- Adiciona o ano de fabricação (o ano modelo já existia na coluna "ano").
-- Passo a passo para não quebrar com os veículos que já estão cadastrados:
--   1. cria a coluna aceitando nulo;
--   2. preenche os veículos existentes com fabricação = ano modelo (ponto de
--      partida razoável; o dono ajusta depois no painel);
--   3. torna a coluna obrigatória.

-- AlterTable
ALTER TABLE "veiculos" ADD COLUMN "ano_fabricacao" INTEGER;

UPDATE "veiculos" SET "ano_fabricacao" = "ano" WHERE "ano_fabricacao" IS NULL;

ALTER TABLE "veiculos" ALTER COLUMN "ano_fabricacao" SET NOT NULL;
