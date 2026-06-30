import { headers } from "next/headers";
import { ConsultaError } from "@/components/paciente/consulta-error";
import { ConsultaPacientePanel } from "@/components/paciente/consulta-panel";
import { logConsultaEvent } from "@/lib/consulta/audit";
import { getClientIp, getUserAgent } from "@/lib/request";
import {
  PatientTokenError,
  type PatientTokenErrorCode,
} from "@/lib/turnos/patient-token";
import { resolvePatientConsulta } from "@/lib/turnos/patient-consulta";

type PageProps = {
  params: Promise<{ token: string }>;
};

export default async function ConsultaPacientePage({ params }: PageProps) {
  const { token: rawToken } = await params;
  const token = decodeURIComponent(rawToken);

  try {
    const consulta = await resolvePatientConsulta(token);
    const headersList = await headers();

    await logConsultaEvent(consulta.turnoId, "paciente_ingreso", {
      ip: getClientIp(headersList),
      userAgent: getUserAgent(headersList),
    });

    return (
      <ConsultaPacientePanel
        token={token}
        fechaHoraProgramada={consulta.fechaHoraProgramada.toISOString()}
        pacienteNombre={consulta.pacienteNombre}
        profesionalNombre={consulta.profesionalNombre}
        turnoEstado={consulta.estado}
        gpsInicial={consulta.gps}
      />
    );
  } catch (error) {
    const code: PatientTokenErrorCode =
      error instanceof PatientTokenError ? error.code : "invalid";
    const message =
      error instanceof PatientTokenError ? error.message : undefined;

    return <ConsultaError code={code} message={message} />;
  }
}
