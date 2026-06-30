import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requireAdmin } from "@/lib/admin/require-admin";
import { Empresa } from "@/models";
import { empresaInputSchema } from "@/lib/validations/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await context.params;
  const body = await request.json();
  const parsed = empresaInputSchema.partial().safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  await connectDB();

  const update: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.contacto) {
    update.contacto = {
      ...parsed.data.contacto,
      email: parsed.data.contacto.email || undefined,
    };
  }

  const empresa = await Empresa.findByIdAndUpdate(id, update, {
    new: true,
    runValidators: true,
  });

  if (!empresa) {
    return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
  }

  return NextResponse.json({ empresa });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await context.params;
  await connectDB();

  const empresa = await Empresa.findByIdAndUpdate(
    id,
    { activa: false },
    { new: true },
  );

  if (!empresa) {
    return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
  }

  return NextResponse.json({ empresa });
}
