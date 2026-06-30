import { ConsultaProfesionalPanel } from "@/components/profesional/consulta-panel";

type PageProps = {
  params: Promise<{ turnoId: string }>;
};

export default async function ConsultaProfesionalPage({ params }: PageProps) {
  const { turnoId } = await params;

  return <ConsultaProfesionalPanel turnoId={turnoId} />;
}
