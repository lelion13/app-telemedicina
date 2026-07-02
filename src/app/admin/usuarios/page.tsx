import { UsuariosPanel } from "@/components/admin/usuarios-panel";

export default function AdminUsuariosPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-semibold text-clinical-900">
          Usuarios y roles
        </h2>
        <p className="mt-1 text-sm text-mist-400">
          Creá cuentas de administrativo, empresa y profesional. El rol
          administrativo gestiona agendas y supervisa turnos.
        </p>
      </div>
      <UsuariosPanel />
    </div>
  );
}
