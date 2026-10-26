import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { attachDatabasePool } from "@vercel/functions";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Pool de conexões com o Postgres (Neon), criado por nós para controlar como
 * ele se comporta na Vercel.
 *
 * Problema que isto resolve: com Fluid compute, a Vercel reaproveita a mesma
 * instância entre requisições e a SUSPENDE quando fica ociosa. Suspensa, nada
 * roda — nem o timer do pool que fecharia conexões paradas. Enquanto isso, o
 * Neon derruba conexões ociosas (e dorme após alguns minutos sem uso). Na
 * próxima requisição o pool entregava uma conexão já morta, e o login ou o
 * cadastro falhavam "às vezes"; tentar de novo funcionava.
 *
 * - idleTimeoutMillis: fecha conexões paradas há 5s.
 * - attachDatabasePool: mantém a instância acordada esses 5s depois do último
 *   uso, para o fechamento acontecer ANTES de ela ser suspensa.
 * - connectionTimeoutMillis: se o banco não responder em 15s (ex.: acordando),
 *   falha com erro claro em vez de deixar a tela girando por minutos.
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  idleTimeoutMillis: 5_000,
  connectionTimeoutMillis: 15_000,
});
attachDatabasePool(pool);

const adapter = new PrismaPg(pool);

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
