-- CreateEnum
CREATE TYPE "QualidadeRelacao" AS ENUM ('VERDE', 'AMARELO', 'VERMELHO');

-- CreateEnum
CREATE TYPE "StatusPedido" AS ENUM ('ABERTO', 'ATENDIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusOferta" AS ENUM ('ABERTA', 'RECUSADA', 'COMPRADA');

-- AlterTable
ALTER TABLE "clientes" ADD COLUMN     "qualidade_relacao" "QualidadeRelacao" NOT NULL DEFAULT 'VERDE',
ADD COLUMN     "veiculos_comprados" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "tipo" "TipoVeiculo" NOT NULL,
    "descricao" TEXT NOT NULL,
    "observacao" TEXT,
    "status" "StatusPedido" NOT NULL DEFAULT 'ABERTO',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ofertas" (
    "id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "tipo" "TipoVeiculo" NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "ano" INTEGER,
    "km" INTEGER,
    "preco_pedido" DECIMAL(12,2),
    "observacao" TEXT,
    "status" "StatusOferta" NOT NULL DEFAULT 'ABERTA',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ofertas_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "pedidos" ADD CONSTRAINT "pedidos_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ofertas" ADD CONSTRAINT "ofertas_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
