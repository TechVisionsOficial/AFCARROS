-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CategoriaGasto" ADD VALUE 'COMISSAO';
ALTER TYPE "CategoriaGasto" ADD VALUE 'JUROS';
ALTER TYPE "CategoriaGasto" ADD VALUE 'ANUNCIO';
ALTER TYPE "CategoriaGasto" ADD VALUE 'VOLANTE';
ALTER TYPE "CategoriaGasto" ADD VALUE 'CARTORIO';
ALTER TYPE "CategoriaGasto" ADD VALUE 'UBER';
ALTER TYPE "CategoriaGasto" ADD VALUE 'JOAO_MECANICO';
ALTER TYPE "CategoriaGasto" ADD VALUE 'FEIRA_DO_AUTOMOVEL';
ALTER TYPE "CategoriaGasto" ADD VALUE 'MERCADOCAR';
ALTER TYPE "CategoriaGasto" ADD VALUE 'CARLAO_PECAS';
ALTER TYPE "CategoriaGasto" ADD VALUE 'CONTRATO_RENAV';
ALTER TYPE "CategoriaGasto" ADD VALUE 'COMBUSTIVEL';

