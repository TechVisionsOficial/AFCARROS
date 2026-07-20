-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "CategoriaGasto" ADD VALUE 'DESPACHANTE';
ALTER TYPE "CategoriaGasto" ADD VALUE 'POLIMENTO';
ALTER TYPE "CategoriaGasto" ADD VALUE 'MARTELINHO';
ALTER TYPE "CategoriaGasto" ADD VALUE 'TAPECARIA';
ALTER TYPE "CategoriaGasto" ADD VALUE 'MECANICO';
ALTER TYPE "CategoriaGasto" ADD VALUE 'PECAS';
ALTER TYPE "CategoriaGasto" ADD VALUE 'LAUDO';
ALTER TYPE "CategoriaGasto" ADD VALUE 'DIVIDA_ATIVA';
ALTER TYPE "CategoriaGasto" ADD VALUE 'DEBITOS_DETRAN';
