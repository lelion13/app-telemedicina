import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/require-admin";

const deprecatedResponse = () =>
  NextResponse.json(
    {
      error:
        "Las franjas horarias fueron reemplazadas por agendas del rol administrativo.",
    },
    { status: 410 },
  );

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  return deprecatedResponse();
}

export async function POST() {
  const { error } = await requireAdmin();
  if (error) return error;

  return deprecatedResponse();
}
