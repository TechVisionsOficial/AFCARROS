import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const nome = process.env.SEED_ADMIN_NOME;
  const senha = process.env.SEED_ADMIN_SENHA;
  const papel = process.env.SEED_ADMIN_PAPEL ?? "EQUIPE";

  if (!email || !nome || !senha) {
    throw new Error(
      "Defina SEED_ADMIN_EMAIL, SEED_ADMIN_NOME e SEED_ADMIN_SENHA antes de rodar o seed.",
    );
  }

  if (papel !== "DONO" && papel !== "EQUIPE") {
    throw new Error('SEED_ADMIN_PAPEL deve ser "DONO" ou "EQUIPE".');
  }

  const senhaHash = await bcrypt.hash(senha, 12);

  const usuario = await prisma.usuario.upsert({
    where: { email },
    update: { nome, senhaHash, papel },
    create: {
      nome,
      email,
      senhaHash,
      papel,
    },
  });

  console.log(`Usuário criado: ${usuario.email} (${usuario.papel})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
