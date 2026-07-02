import { config } from "dotenv";
import { resolve } from "path";
import { getAgendaDayKey, getHoraSlot, matchesAgendaSlot, parseAgendaDayKey } from "../src/lib/agenda/slots";
import { getDiaSemanaArgentina } from "../src/lib/turnos/franja";
import connectDB from "../src/lib/db";
import { Agenda, FranjaHoraria, Turno, Usuario } from "../src/models";

config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env.local") });

const DEFAULT_DURATION_MIN = Number(process.env.AGENDA_DEFAULT_SLOT_MIN ?? 15);
const MIGRATION_DAYS = Number(process.env.AGENDA_MIGRATION_DAYS ?? 90);

async function findMigrationCreatorId(): Promise<string> {
  const administrativo = await Usuario.findOne({
    rol: "administrativo",
    activo: true,
  })
    .select("_id")
    .lean();

  if (administrativo) {
    return administrativo._id.toString();
  }

  const admin = await Usuario.findOne({ rol: "admin", activo: true })
    .select("_id")
    .lean();

  if (!admin) {
    throw new Error("No hay usuario admin ni administrativo para asignar creadoPorId");
  }

  return admin._id.toString();
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

async function migrateFranjasToAgendas(creadoPorId: string) {
  const franjas = await FranjaHoraria.find({ activa: true }).lean();
  const today = new Date();
  let created = 0;

  for (const franja of franjas) {
    for (let offset = 0; offset < MIGRATION_DAYS; offset += 1) {
      const day = addDays(today, offset);
      if (getDiaSemanaArgentina(day) !== franja.diaSemana) {
        continue;
      }

      const fecha = parseAgendaDayKey(getAgendaDayKey(day));
      const existing = await Agenda.findOne({
        fecha,
        horaInicio: franja.horaInicio,
        horaFin: franja.horaFin,
        duracionTurnoMinutos: DEFAULT_DURATION_MIN,
      }).lean();

      if (existing) {
        continue;
      }

      await Agenda.create({
        nombre: `Migrada ${getAgendaDayKey(day)} ${franja.horaInicio}-${franja.horaFin}`,
        fecha,
        horaInicio: franja.horaInicio,
        horaFin: franja.horaFin,
        duracionTurnoMinutos: DEFAULT_DURATION_MIN,
        empresaIds: [],
        creadoPorId,
        activa: true,
      });
      created += 1;
    }
  }

  return created;
}

async function backfillTurnoAgendaIds() {
  const turnos = await Turno.find({
    $or: [{ agendaId: { $exists: false } }, { agendaId: null }],
  });

  let updated = 0;
  let skipped = 0;

  for (const turno of turnos) {
    const fecha = parseAgendaDayKey(getAgendaDayKey(turno.fechaHoraProgramada));
    const hora = getHoraSlot(turno.fechaHoraProgramada);
    const agendas = await Agenda.find({ activa: true, fecha }).lean();

    const match = agendas.find((agenda) =>
      matchesAgendaSlot(turno.fechaHoraProgramada, agenda),
    );

    if (!match) {
      skipped += 1;
      console.warn(
        `Turno ${turno._id.toString()} sin agenda (${getAgendaDayKey(turno.fechaHoraProgramada)} ${hora})`,
      );
      continue;
    }

    turno.agendaId = match._id;
    await turno.save();
    updated += 1;
  }

  return { updated, skipped };
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("Error: MONGODB_URI no está definida.");
    process.exit(1);
  }

  await connectDB();

  const creadoPorId = await findMigrationCreatorId();
  const agendasCreated = await migrateFranjasToAgendas(creadoPorId);
  const backfill = await backfillTurnoAgendaIds();

  console.log(`Agendas creadas: ${agendasCreated}`);
  console.log(`Turnos actualizados: ${backfill.updated}`);
  console.log(`Turnos sin agenda compatible: ${backfill.skipped}`);
  process.exit(0);
}

main().catch((error: unknown) => {
  console.error("Error en migración:", error);
  process.exit(1);
});
