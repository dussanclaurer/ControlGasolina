import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de base de datos...");

  // Administrador único
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@gmail.com" },
    update: {},
    create: {
      email: "admin@gmail.com",
      name: "Administrador del Sistema",
      password: adminPassword,
      role: "SUPERVISOR",
    },
  });

  console.log(`✅ Administrador creado: ${admin.email}`);
  console.log("\n📋 Credenciales de acceso:");
  console.log("  Administrador : admin@gmail.com / admin123");
  console.log("\n✅ Seed completado exitosamente!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
