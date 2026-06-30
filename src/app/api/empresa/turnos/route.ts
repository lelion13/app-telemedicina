import { NextResponse } from "next/server";
import {
  createTurnoForEmpresa,
  listTurnosForEmpresa,
  TurnoValidationError,
} from "@/lib/turnos/service";
import { createTurnoSchema, listTurnosQuerySchema } from "@/lib/validations/turnos";
import { requireEmpresaTenant, requireAuth } from "@/lib/require-auth";

export async function GET(request: Request) {
  const authResult = await requireAuth(["empresa"]);
  if (authResult.error) return authResult.error;

  const tenantResult = await requireEmpresaTenant(authResult.session);
  if (tenantResult.error) return tenantResult.error;

  const { searchParams } = new URL(request.url);
  const parsed = listTurnosQuerySchema.safeParse({
    estado: searchParams.get("estado") ?? undefined,
    desde: searchParams.get("desde") ?? undefined,
    hasta: searchParams.get("hasta") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Filtros inválidos" }, { status: 400 });
  }

  const turnos = await listTurnosForEmpresa(tenantResult.session.user.empresaId!, {
    estado: parsed.data.estado,
    desde: parsed.data.desde ? new Date(parsed.data.desde) : undefined,
    hasta: parsed.data.hasta ? new Date(parsed.data.hasta) : undefined,
  });

  return NextResponse.json({ turnos });
}

export async function POST(request: Request) {
  const authResult = await requireAuth(["empresa"]);
  if (authResult.error) return authResult.error;

  const tenantResult = await requireEmpresaTenant(authResult.session);
  if (tenantResult.error) return tenantResult.error;

  const body = await request.json();
  const parsed = createTurnoSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  try {
    const { turno, mailSent } = await createTurnoForEmpresa(
      tenantResult.session.user.empresaId!,
      parsed.data,
    );

    return NextResponse.json({ turno, mailSent }, { status: 201 });
  } catch (error) {
    if (error instanceof TurnoValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    throw error;
  }
}
