import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { requireAdmin } from "@/lib/admin/require-admin";
import { listEmpresas } from "@/lib/admin/queries";
import { Empresa } from "@/models";
import { empresaInputSchema } from "@/lib/validations/admin";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  const empresas = await listEmpresas();
  return NextResponse.json({ empresas });
}

export async function POST(request: Request) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await request.json();
  const parsed = empresaInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  await connectDB();

  const contacto = parsed.data.contacto
    ? {
        ...parsed.data.contacto,
        email: parsed.data.contacto.email || undefined,
      }
    : {};

  const empresa = await Empresa.create({
    nombre: parsed.data.nombre,
    cuit: parsed.data.cuit || undefined,
    contacto,
    activa: parsed.data.activa ?? true,
  });

  return NextResponse.json({ empresa }, { status: 201 });
}
