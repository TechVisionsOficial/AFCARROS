-- CreateEnum
CREATE TYPE "PapelUsuario" AS ENUM ('DONO', 'EQUIPE');

-- CreateEnum
CREATE TYPE "TipoVeiculo" AS ENUM ('CARRO', 'MOTO');

-- CreateEnum
CREATE TYPE "CondicaoVeiculo" AS ENUM ('NOVO', 'SEMINOVO');

-- CreateEnum
CREATE TYPE "StatusVeiculo" AS ENUM ('DISPONIVEL', 'RESERVADO', 'VENDIDO');

-- CreateEnum
CREATE TYPE "OrigemAquisicao" AS ENUM ('LEILAO', 'TROCA', 'PARTICULAR', 'CONSIGNADO', 'OUTRO');

-- CreateEnum
CREATE TYPE "CategoriaGasto" AS ENUM ('MANUTENCAO', 'DOCUMENTACAO', 'ESTETICA', 'FUNILARIA', 'OUTROS');

-- CreateEnum
CREATE TYPE "OrigemLead" AS ENUM ('SITE', 'WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'INDICACAO', 'OUTRO');

-- CreateEnum
CREATE TYPE "StatusKanban" AS ENUM ('NOVO', 'ENTRAR_EM_CONTATO', 'AGUARDANDO_CLIENTE', 'RETORNAR_PARA_CLIENTE', 'NEGOCIANDO', 'VENDA_CONCLUIDA', 'PERDIDO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha_hash" TEXT NOT NULL,
    "papel" "PapelUsuario" NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veiculos" (
    "id" TEXT NOT NULL,
    "tipo" "TipoVeiculo" NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "km" INTEGER NOT NULL,
    "condicao" "CondicaoVeiculo" NOT NULL,
    "status" "StatusVeiculo" NOT NULL DEFAULT 'DISPONIVEL',
    "descricao" TEXT,
    "preco_venda" DECIMAL(12,2) NOT NULL,
    "preco_compra" DECIMAL(12,2) NOT NULL,
    "preco_minimo" DECIMAL(12,2) NOT NULL,
    "data_aquisicao" TIMESTAMP(3),
    "origem_aquisicao" "OrigemAquisicao",
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "veiculos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "veiculo_fotos" (
    "id" TEXT NOT NULL,
    "veiculo_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "veiculo_fotos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gastos" (
    "id" TEXT NOT NULL,
    "veiculo_id" TEXT NOT NULL,
    "categoria" "CategoriaGasto" NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "descricao" TEXT,
    "data" DATE NOT NULL,

    CONSTRAINT "gastos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT,
    "email" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" TEXT NOT NULL,
    "cliente_id" TEXT NOT NULL,
    "veiculo_id" TEXT,
    "responsavel_id" TEXT,
    "origem" "OrigemLead" NOT NULL,
    "status_kanban" "StatusKanban" NOT NULL DEFAULT 'NOVO',
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- AddForeignKey
ALTER TABLE "veiculo_fotos" ADD CONSTRAINT "veiculo_fotos_veiculo_id_fkey" FOREIGN KEY ("veiculo_id") REFERENCES "veiculos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gastos" ADD CONSTRAINT "gastos_veiculo_id_fkey" FOREIGN KEY ("veiculo_id") REFERENCES "veiculos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_veiculo_id_fkey" FOREIGN KEY ("veiculo_id") REFERENCES "veiculos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;
