import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/require-auth";

export async function GET() {
  const { session, error } = await requireAuth();

  if (error) {
    return error;
  }

  return NextResponse.json({
    user: session.user,
  });
}
