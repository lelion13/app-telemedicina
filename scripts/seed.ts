import { config } from "dotenv";
import { resolve } from "path";
import connectDB from "../src/lib/db";
import { hashPassword } from "../src/lib/password";
import { Usuario } from "../src/models";
import type { Rol } from "../src/models/types";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local") });

type SeedUserInput = {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  rol: Rol;
};

async function ensureUser(input: SeedUserInput) {
  const email = input.email.toLowerCase();
  const existing = await Usuario.findOne({ email });

  if (existing) {
    console.log(`Usuario ${input.rol} ya existe: ${email}`);
    return;
  }

  if (input.password.length < 12) {
    throw new Error(`La contraseña de ${email} debe tener al menos 12 caracteres`);
  }

  const passwordHash = await hashPassword(input.password);

  await Usuario.create({
    nombre: input.nombre,
    apellido: input.apellido,
    email,
    passwordHash,
    rol: input.rol,
    activo: true,
  });

  console.log(`Usuario ${input.rol} creado: ${email}`);
}

async function seed() {
  if (!process.env.MONGODB_URI) {
    console.error("Error: MONGODB_URI no está definida.");
    process.exit(1);
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    console.error(
      "Error: ADMIN_PASSWORD no está definida. Configurala en .env antes de ejecutar el seed.",
    );
    process.exit(1);
  }

  await connectDB();

  await ensureUser({
    email: process.env.ADMIN_EMAIL ?? "admin@lionapp.cloud",
    password: adminPassword,
    nombre: process.env.ADMIN_NOMBRE ?? "Admin",
    apellido: process.env.ADMIN_APELLIDO ?? "Sistema",
    rol: "admin",
  });

  const administrativoEmail = process.env.ADMINISTRATIVO_EMAIL;
  const administrativoPassword = process.env.ADMINISTRATIVO_PASSWORD;

  if (administrativoEmail && administrativoPassword) {
    await ensureUser({
      email: administrativoEmail,
      password: administrativoPassword,
      nombre: process.env.ADMINISTRATIVO_NOMBRE ?? "Coordinación",
      apellido: process.env.ADMINISTRATIVO_APELLIDO ?? "Operativa",
      rol: "administrativo",
    });
  } else if (administrativoEmail || administrativoPassword) {
    console.warn(
      "Aviso: definí ADMINISTRATIVO_EMAIL y ADMINISTRATIVO_PASSWORD para crear el usuario administrativo.",
    );
  }

  process.exit(0);
}

seed().catch((error: unknown) => {
  console.error("Error en seed:", error);
  process.exit(1);
});
