export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-paper-50 px-6 py-16">
      <main className="w-full max-w-lg text-center">
        <p className="font-data text-sm uppercase tracking-widest text-mist-400">
          Telemedicina Lion
        </p>
        <h1 className="mt-4 font-display text-4xl font-semibold text-clinical-900">
          Teleasistencia médica
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-clinical-700/80">
          Plataforma en construcción. Los profesionales y empresas podrán
          gestionar turnos; los pacientes ingresarán por link seguro.
        </p>
        <a
          href="/login"
          className="mt-10 inline-flex h-12 min-w-[12rem] items-center justify-center rounded-lg bg-clinical-700 px-6 text-base font-medium text-white transition-colors hover:bg-clinical-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinical-700"
        >
          Iniciar sesión
        </a>
      </main>
    </div>
  );
}
