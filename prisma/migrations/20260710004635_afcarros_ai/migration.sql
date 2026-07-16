-- CreateEnum
CREATE TYPE "PapelMensagemAI" AS ENUM ('USUARIO', 'ASSISTENTE');

-- CreateTable
CREATE TABLE "mensagens_ai" (
    "id" TEXT NOT NULL,
    "papel" "PapelMensagemAI" NOT NULL,
    "conteudo" TEXT NOT NULL,
    "tokens_entrada" INTEGER,
    "tokens_saida" INTEGER,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mensagens_ai_pkey" PRIMARY KEY ("id")
);
