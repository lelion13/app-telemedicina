import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-paper-50 px-4 py-12">
      <Suspense fallback={<div className="text-mist-400">Cargando…</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
