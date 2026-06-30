import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requireAdmin } from "@/lib/admin/require-admin";
import { hashPassword } from "@/lib/password";
import { Usuario } from "@/models";
import { usuarioInputSchema } from "@/lib/validations/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await context.params;
  const body = await request.json();
  const parsed = usuarioInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  await connectDB();

  const update: Record<string, unknown> = {
    nombre: parsed.data.nombre,
    apellido: parsed.data.apellido,
    email: parsed.data.email.toLowerCase(),
    rol: parsed.data.rol,
    activo: parsed.data.activo,
    empresaId: parsed.data.rol === "empresa" ? parsed.data.empresaId : null,
  };

  if (parsed.data.password) {
    update.passwordHash = await hashPassword(parsed.data.password);
  }

  try {
    const usuario = await Usuario.findByIdAndUpdate(id, update, {
      new: true,
      runValidators: true,
    })
      .select("-passwordHash")
      .populate("empresaId", "nombre");

    if (!usuario) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ usuario });
  } catch {
    return NextResponse.json({ error: "Email ya registrado" }, { status: 409 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await context.params;
  await connectDB();

  const usuario = await Usuario.findByIdAndUpdate(
    id,
    { activo: false },
    { new: true },
  ).select("-passwordHash");

  if (!usuario) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
  }

  return NextResponse.json({ usuario });
}
