import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requireAdmin } from "@/lib/admin/require-admin";
import { listFranjas } from "@/lib/admin/queries";
import { FranjaHoraria } from "@/models";
import { franjaInputSchema } from "@/lib/validations/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const franjas = await listFranjas();
  return NextResponse.json({ franjas });
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = franjaInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  await connectDB();

  const franja = await FranjaHoraria.create({
    ...parsed.data,
    activa: parsed.data.activa ?? true,
  });

  return NextResponse.json({ franja }, { status: 201 });
}
