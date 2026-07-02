import { TurnosMonitorPanel } from "@/components/administrativo/turnos-monitor-panel";

export default function AdministrativoTurnosPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-semibold text-clinical-900">
          Monitor de turnos
        </h2>
        <p className="mt-1 text-sm text-mist-400">
          Vista cross-tenant de todos los turnos en las agendas del sistema.
        </p>
      </div>
      <TurnosMonitorPanel />
    </div>
  );
}
