import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { FranjaHoraria } from "@/models";
import { DIA_SEMANA_LABELS, type DiaSemana } from "@/models/types";
import { requireAuth, requireEmpresaTenant } from "@/lib/require-auth";

export async function GET() {
  const authResult = await requireAuth(["empresa"]);
  if (authResult.error) return authResult.error;

  const tenantResult = await requireEmpresaTenant(authResult.session);
  if (tenantResult.error) return tenantResult.error;

  await connectDB();

  const franjas = await FranjaHoraria.find({ activa: true })
    .sort({ diaSemana: 1, horaInicio: 1 })
    .lean();

  const resumen = franjas.map((f) => ({
    ...f,
    diaLabel: DIA_SEMANA_LABELS[f.diaSemana as DiaSemana],
  }));

  return NextResponse.json({ franjas: resumen });
}
