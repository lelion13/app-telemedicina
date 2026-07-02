import { AgendasPanel } from "@/components/administrativo/agendas-panel";

export default function AdministrativoAgendasPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-semibold text-clinical-900">
          Agendas
        </h2>
        <p className="mt-1 text-sm text-mist-400">
          Cada agenda define un día, un horario y la duración de cada turno.
        </p>
      </div>
      <AgendasPanel />
    </div>
  );
}
