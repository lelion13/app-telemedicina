import connectDB from "@/lib/db";
import { getAgendaDayKey, parseAgendaDayKey } from "@/lib/agenda/slots";
import { Agenda } from "@/models";
import type { Types } from "mongoose";

export async function getActiveAgendaIds(
  fromDate: Date = new Date(),
): Promise<Types.ObjectId[]> {
  await connectDB();

  const fechaMin = parseAgendaDayKey(getAgendaDayKey(fromDate));
  const agendas = await Agenda.find({
    activa: true,
    fecha: { $gte: fechaMin },
  })
    .select("_id")
    .lean();

  return agendas.map((agenda) => agenda._id);
}
