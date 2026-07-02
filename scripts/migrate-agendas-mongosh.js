/**
 * Migración franjas → agendas (mongosh puro).
 * Uso en VPS sin git pull:
 *   curl -fsSL https://raw.githubusercontent.com/lelion13/app-telemedicina/main/scripts/migrate-agendas-mongosh.js \
 *     | docker compose --env-file .env.prod -f docker-compose.prod.yml exec -T mongo mongosh telemedicina --quiet
 */
const TZ = "America/Argentina/Buenos_Aires";
const DEFAULT_DURATION_MIN = Number(process.env.AGENDA_DEFAULT_SLOT_MIN ?? 15);
const MIGRATION_DAYS = Number(process.env.AGENDA_MIGRATION_DAYS ?? 90);

const WEEKDAY_MAP = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function getDiaSemanaArgentina(date) {
  const dayStr = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "short",
  }).format(date);
  return WEEKDAY_MAP[dayStr] ?? 0;
}

function getAgendaDayKey(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function parseAgendaDayKey(dayKey) {
  return new Date(`${dayKey}T12:00:00.000Z`);
}

function getHoraArgentina(date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}

function timeToMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function generateSlots(horaInicio, horaFin, duracionTurnoMinutos) {
  const start = timeToMinutes(horaInicio);
  const end = timeToMinutes(horaFin);
  const slots = [];
  for (let cursor = start; cursor + duracionTurnoMinutos <= end; cursor += duracionTurnoMinutos) {
    const hours = Math.floor(cursor / 60);
    const minutes = cursor % 60;
    slots.push(
      `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
    );
  }
  return slots;
}

function isSameAgendaDay(a, b) {
  return getAgendaDayKey(a) === getAgendaDayKey(b);
}

function matchesAgendaSlot(fechaHoraProgramada, agenda) {
  if (!isSameAgendaDay(fechaHoraProgramada, agenda.fecha)) {
    return false;
  }
  const hora = getHoraArgentina(fechaHoraProgramada);
  return generateSlots(
    agenda.horaInicio,
    agenda.horaFin,
    agenda.duracionTurnoMinutos,
  ).includes(hora);
}

function addDays(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function findMigrationCreatorId() {
  let user = db.usuarios.findOne({ rol: "administrativo", activo: true });
  if (!user) {
    user = db.usuarios.findOne({ rol: "admin", activo: true });
  }
  if (!user) {
    print("Error: no hay usuario admin ni administrativo para creadoPorId");
    quit(1);
  }
  return user._id;
}

function migrateFranjasToAgendas(creadoPorId) {
  const franjas = db.franjahorarias.find({ activa: true }).toArray();
  const today = new Date();
  let created = 0;

  for (const franja of franjas) {
    for (let offset = 0; offset < MIGRATION_DAYS; offset += 1) {
      const day = addDays(today, offset);
      if (getDiaSemanaArgentina(day) !== franja.diaSemana) {
        continue;
      }

      const dayKey = getAgendaDayKey(day);
      const fecha = parseAgendaDayKey(dayKey);
      const existing = db.agendas.findOne({
        fecha,
        horaInicio: franja.horaInicio,
        horaFin: franja.horaFin,
        duracionTurnoMinutos: DEFAULT_DURATION_MIN,
      });

      if (existing) {
        continue;
      }

      db.agendas.insertOne({
        nombre: `Migrada ${dayKey} ${franja.horaInicio}-${franja.horaFin}`,
        fecha,
        horaInicio: franja.horaInicio,
        horaFin: franja.horaFin,
        duracionTurnoMinutos: DEFAULT_DURATION_MIN,
        empresaIds: [],
        creadoPorId,
        activa: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      created += 1;
    }
  }

  return created;
}

function backfillTurnoAgendaIds() {
  const turnos = db.turnos
    .find({ $or: [{ agendaId: { $exists: false } }, { agendaId: null }] })
    .toArray();

  let updated = 0;
  let skipped = 0;

  for (const turno of turnos) {
    const fecha = parseAgendaDayKey(getAgendaDayKey(turno.fechaHoraProgramada));
    const hora = getHoraArgentina(turno.fechaHoraProgramada);
    const agendas = db.agendas.find({ activa: true, fecha }).toArray();
    const match = agendas.find((agenda) =>
      matchesAgendaSlot(turno.fechaHoraProgramada, agenda),
    );

    if (!match) {
      skipped += 1;
      print(
        `Aviso: turno ${turno._id} sin agenda (${getAgendaDayKey(turno.fechaHoraProgramada)} ${hora})`,
      );
      continue;
    }

    db.turnos.updateOne(
      { _id: turno._id },
      { $set: { agendaId: match._id, updatedAt: new Date() } },
    );
    updated += 1;
  }

  return { updated, skipped };
}

const creadoPorId = findMigrationCreatorId();
const agendasCreated = migrateFranjasToAgendas(creadoPorId);
const backfill = backfillTurnoAgendaIds();

print(`Agendas creadas: ${agendasCreated}`);
print(`Turnos actualizados: ${backfill.updated}`);
print(`Turnos sin agenda compatible: ${backfill.skipped}`);
