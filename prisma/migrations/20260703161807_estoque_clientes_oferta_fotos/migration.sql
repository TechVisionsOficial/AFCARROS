-- AlterTable
ALTER TABLE "veiculos" ADD COLUMN     "comprador_id" TEXT,
ADD COLUMN     "fornecedor_id" TEXT;

-- CreateTable
CREATE TABLE "oferta_fotos" (
    "id" TEXT NOT NULL,
    "oferta_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "oferta_fotos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "veiculos" ADD CONSTRAINT "veiculos_fornecedor_id_fkey" FOREIGN KEY ("fornecedor_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "veiculos" ADD CONSTRAINT "veiculos_comprador_id_fkey" FOREIGN KEY ("comprador_id") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "oferta_fotos" ADD CONSTRAINT "oferta_fotos_oferta_id_fkey" FOREIGN KEY ("oferta_id") REFERENCES "ofertas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
