import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requireAdmin } from "@/lib/admin/require-admin";
import { listUsuarios } from "@/lib/admin/queries";
import { hashPassword } from "@/lib/password";
import { Usuario } from "@/models";
import { usuarioCreateSchema } from "@/lib/validations/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const usuarios = await listUsuarios();
  return NextResponse.json({ usuarios });
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = usuarioCreateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  await connectDB();

  const passwordHash = await hashPassword(parsed.data.password);

  try {
    const usuario = await Usuario.create({
      nombre: parsed.data.nombre,
      apellido: parsed.data.apellido,
      email: parsed.data.email.toLowerCase(),
      passwordHash,
      rol: parsed.data.rol,
      empresaId: parsed.data.rol === "empresa" ? parsed.data.empresaId : undefined,
      activo: parsed.data.activo ?? true,
    });

    const safe = await Usuario.findById(usuario._id)
      .select("-passwordHash")
      .populate("empresaId", "nombre")
      .lean();

    return NextResponse.json({ usuario: safe }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Email ya registrado" }, { status: 409 });
  }
}
