import connectDB from "@/lib/db";
import { calculateAusentismoRate } from "@/lib/admin/metrics";
import {
  Empresa,
  FranjaHoraria,
  LogConsulta,
  RegistroGPS,
  Turno,
  Usuario,
} from "@/models";
import type { TurnoEstado } from "@/models/types";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfToday(): Date {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}

function defaultRange() {
  const hasta = new Date();
  const desde = new Date();
  desde.setDate(desde.getDate() - 30);
  return { desde, hasta };
}

export async function getAdminMetrics(desdeInput?: Date, hastaInput?: Date) {
  await connectDB();

  const { desde, hasta } =
    desdeInput && hastaInput ? { desde: desdeInput, hasta: hastaInput } : defaultRange();

  const dateFilter = { fechaHoraProgramada: { $gte: desde, $lte: hasta } };

  const [
    turnosHoy,
    empresasActivas,
    porEstadoRaw,
    porEmpresaRaw,
    porProfesionalRaw,
    finalizados,
    ausentes,
  ] = await Promise.all([
    Turno.countDocuments({
      fechaHoraProgramada: { $gte: startOfToday(), $lte: endOfToday() },
    }),
    Empresa.countDocuments({ activa: true }),
    Turno.aggregate<{ _id: TurnoEstado; count: number }>([
      { $match: dateFilter },
      { $group: { _id: "$estado", count: { $sum: 1 } } },
    ]),
    Turno.aggregate<{ _id: typeof Empresa.prototype._id; count: number; nombre: string }>([
      { $match: dateFilter },
      {
        $lookup: {
          from: "empresas",
          localField: "empresaId",
          foreignField: "_id",
          as: "empresa",
        },
      },
      { $unwind: "$empresa" },
      {
        $group: {
          _id: "$empresaId",
          count: { $sum: 1 },
          nombre: { $first: "$empresa.nombre" },
        },
      },
      { $sort: { count: -1 } },
    ]),
    Turno.aggregate<{ _id: typeof Usuario.prototype._id; count: number; nombre: string }>([
      { $match: { ...dateFilter, profesionalId: { $ne: null } } },
      {
        $lookup: {
          from: "usuarios",
          localField: "profesionalId",
          foreignField: "_id",
          as: "profesional",
        },
      },
      { $unwind: "$profesional" },
      {
        $group: {
          _id: "$profesionalId",
          count: { $sum: 1 },
          nombre: {
            $first: {
              $concat: ["$profesional.nombre", " ", "$profesional.apellido"],
            },
          },
        },
      },
      { $sort: { count: -1 } },
    ]),
    Turno.countDocuments({ ...dateFilter, estado: "finalizado" }),
    Turno.countDocuments({ ...dateFilter, estado: "ausente" }),
  ]);

  const porEstado = Object.fromEntries(
    porEstadoRaw.map((item) => [item._id, item.count]),
  ) as Partial<Record<TurnoEstado, number>>;

  return {
    periodo: { desde: desde.toISOString(), hasta: hasta.toISOString() },
    turnosHoy,
    empresasActivas,
    tasaAusentismo: calculateAusentismoRate(finalizados, ausentes),
    porEstado,
    porEmpresa: porEmpresaRaw.map((item) => ({
      empresaId: String(item._id),
      nombre: item.nombre,
      count: item.count,
    })),
    porProfesional: porProfesionalRaw.map((item) => ({
      profesionalId: String(item._id),
      nombre: item.nombre,
      count: item.count,
    })),
  };
}

export async function getAuditoria(params: {
  tipo: "gps" | "logs";
  turnoId?: string;
  empresaId?: string;
  desde?: Date;
  hasta?: Date;
}) {
  await connectDB();

  const turnoIds = await resolveTurnoIds(params.turnoId, params.empresaId);

  if (turnoIds !== null && turnoIds.length === 0) {
    return { registros: [] };
  }

  const dateFilter =
    params.desde || params.hasta
      ? {
          timestamp: {
            ...(params.desde ? { $gte: params.desde } : {}),
            ...(params.hasta ? { $lte: params.hasta } : {}),
          },
        }
      : {};

  if (params.tipo === "gps") {
    const registros = await RegistroGPS.find({
      ...(turnoIds ? { turnoId: { $in: turnoIds } } : {}),
      ...dateFilter,
    })
      .sort({ timestamp: -1 })
      .limit(200)
      .lean();

    return { registros };
  }

  const registros = await LogConsulta.find({
    ...(turnoIds ? { turnoId: { $in: turnoIds } } : {}),
    ...dateFilter,
  })
    .sort({ timestamp: -1 })
    .limit(200)
    .lean();

  return { registros };
}

async function resolveTurnoIds(
  turnoId?: string,
  empresaId?: string,
): Promise<string[] | null> {
  if (turnoId) {
    return [turnoId];
  }
  if (empresaId) {
    const turnos = await Turno.find({ empresaId }).select("_id").lean();
    return turnos.map((t) => String(t._id));
  }
  return null;
}

export async function listEmpresas() {
  await connectDB();
  return Empresa.find().sort({ nombre: 1 }).lean();
}

export async function listUsuarios() {
  await connectDB();
  return Usuario.find()
    .select("-passwordHash")
    .populate("empresaId", "nombre")
    .sort({ apellido: 1, nombre: 1 })
    .lean();
}

export async function listFranjas() {
  await connectDB();
  return FranjaHoraria.find().sort({ diaSemana: 1, horaInicio: 1 }).lean();
}
