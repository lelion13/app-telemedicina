import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requireAdmin } from "@/lib/admin/require-admin";
import { FranjaHoraria } from "@/models";
import { franjaUpdateSchema } from "@/lib/validations/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await context.params;
  const body = await request.json();
  const parsed = franjaUpdateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  await connectDB();

  const franja = await FranjaHoraria.findByIdAndUpdate(id, parsed.data, {
    new: true,
    runValidators: true,
  });

  if (!franja) {
    return NextResponse.json({ error: "Franja no encontrada" }, { status: 404 });
  }

  return NextResponse.json({ franja });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { id } = await context.params;
  await connectDB();

  const franja = await FranjaHoraria.findByIdAndUpdate(
    id,
    { activa: false },
    { new: true },
  );

  if (!franja) {
    return NextResponse.json({ error: "Franja no encontrada" }, { status: 404 });
  }

  return NextResponse.json({ franja });
}
