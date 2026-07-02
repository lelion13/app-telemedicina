import { getAdminMetrics } from "@/lib/admin/queries";
import type { TurnoEstado } from "@/models/types";

const estadoLabels: Record<TurnoEstado, string> = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  en_curso: "En curso",
  finalizado: "Finalizado",
  ausente: "Ausente",
  cancelado: "Cancelado",
};

export default async function AdminDashboardPage() {
  const metrics = await getAdminMetrics();

  return (
    <div className="space-y-8">
      <p className="rounded-xl bg-paper-50 px-4 py-3 text-sm text-clinical-700 ring-1 ring-paper-100">
        Panel de configuración y métricas. Para crear agendas y supervisar turnos,
        usá el rol <strong>administrativo</strong>.
      </p>

      <section className="grid gap-4 sm:grid-cols-3">
        <MetricCard label="Turnos hoy" value={String(metrics.turnosHoy)} />
        <MetricCard
          label="Tasa de ausentismo"
          value={`${metrics.tasaAusentismo}%`}
        />
        <MetricCard
          label="Empresas activas"
          value={String(metrics.empresasActivas)}
        />
      </section>

      <section className="rounded-xl bg-white p-6 ring-1 ring-paper-100">
        <h2 className="font-display text-xl font-semibold text-clinical-900">
          Turnos por estado
        </h2>
        <p className="mt-1 text-sm text-mist-400">
          Últimos 30 días
        </p>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(estadoLabels) as TurnoEstado[]).map((estado) => (
            <div
              key={estado}
              className="flex items-center justify-between rounded-lg bg-paper-50 px-4 py-3"
            >
              <dt className="text-sm text-clinical-700">{estadoLabels[estado]}</dt>
              <dd className="font-data text-lg text-clinical-900">
                {metrics.porEstado[estado] ?? 0}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <RankingCard
          title="Por empresa"
          items={metrics.porEmpresa.map((item) => ({
            label: item.nombre,
            value: item.count,
          }))}
        />
        <RankingCard
          title="Por profesional"
          items={metrics.porProfesional.map((item) => ({
            label: item.nombre,
            value: item.count,
          }))}
        />
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white p-5 ring-1 ring-paper-100">
      <p className="text-sm text-mist-400">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold text-clinical-900">
        {value}
      </p>
    </div>
  );
}

function RankingCard({
  title,
  items,
}: {
  title: string;
  items: { label: string; value: number }[];
}) {
  return (
    <section className="rounded-xl bg-white p-6 ring-1 ring-paper-100">
      <h2 className="font-display text-xl font-semibold text-clinical-900">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="mt-4 text-sm text-mist-400">Sin datos en el período.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {items.map((item) => (
            <li
              key={item.label}
              className="flex items-center justify-between rounded-lg bg-paper-50 px-4 py-2 text-sm"
            >
              <span className="text-clinical-900">{item.label}</span>
              <span className="font-data text-clinical-700">{item.value}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
