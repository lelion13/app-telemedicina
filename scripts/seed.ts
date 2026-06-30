import { config } from "dotenv";
import { resolve } from "path";
import connectDB from "../src/lib/db";
import { hashPassword } from "../src/lib/password";
import { Usuario } from "../src/models";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local") });

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "admin@lionapp.cloud";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_NOMBRE = process.env.ADMIN_NOMBRE ?? "Admin";
const ADMIN_APELLIDO = process.env.ADMIN_APELLIDO ?? "Sistema";

async function seedAdmin() {
  if (!process.env.MONGODB_URI) {
    console.error("Error: MONGODB_URI no está definida.");
    process.exit(1);
  }

  if (!ADMIN_PASSWORD) {
    console.error(
      "Error: ADMIN_PASSWORD no está definida. Configurala en .env antes de ejecutar el seed.",
    );
    process.exit(1);
  }

  if (ADMIN_PASSWORD.length < 12) {
    console.error("Error: ADMIN_PASSWORD debe tener al menos 12 caracteres.");
    process.exit(1);
  }

  await connectDB();

  const existing = await Usuario.findOne({ email: ADMIN_EMAIL.toLowerCase() });

  if (existing) {
    console.log(`Usuario admin ya existe: ${ADMIN_EMAIL}`);
    process.exit(0);
  }

  const passwordHash = await hashPassword(ADMIN_PASSWORD);

  await Usuario.create({
    nombre: ADMIN_NOMBRE,
    apellido: ADMIN_APELLIDO,
    email: ADMIN_EMAIL.toLowerCase(),
    passwordHash,
    rol: "admin",
    activo: true,
  });

  console.log(`Usuario admin creado: ${ADMIN_EMAIL}`);
  process.exit(0);
}

seedAdmin().catch((error: unknown) => {
  console.error("Error en seed:", error);
  process.exit(1);
});
