-- CreateEnum
CREATE TYPE "CategoriaDocumento" AS ENUM ('LAUDO', 'DOCUMENTACAO', 'TRANSFERENCIA', 'IPVA', 'VISTORIA', 'OUTRO');

-- CreateTable
CREATE TABLE "veiculo_documentos" (
    "id" TEXT NOT NULL,
    "veiculo_id" TEXT NOT NULL,
    "categoria" "CategoriaDocumento" NOT NULL,
    "nome" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "veiculo_documentos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "veiculo_documentos" ADD CONSTRAINT "veiculo_documentos_veiculo_id_fkey" FOREIGN KEY ("veiculo_id") REFERENCES "veiculos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
