import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";

type RouteContext = { params: Promise<{ id: string }> };

const deprecatedResponse = () =>
  NextResponse.json(
    {
      error:
        "Las franjas horarias fueron reemplazadas por agendas del rol administrativo.",
    },
    { status: 410 },
  );

export async function PATCH(_request: Request, _context: RouteContext) {
  const { error } = await requireAdmin();
  if (error) return error;

  return deprecatedResponse();
}

export async function DELETE(_request: Request, _context: RouteContext) {
  const { error } = await requireAdmin();
  if (error) return error;

  return deprecatedResponse();
}
