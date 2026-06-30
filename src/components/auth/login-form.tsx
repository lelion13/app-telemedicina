"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { AUTH_ERROR_MESSAGE } from "@/lib/auth-messages";
import { getDashboardForRole } from "@/lib/authz";
import type { Rol } from "@/models/types";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(AUTH_ERROR_MESSAGE);
        return;
      }

      const meResponse = await fetch("/api/auth/me");
      if (!meResponse.ok) {
        setError(AUTH_ERROR_MESSAGE);
        return;
      }

      const data = (await meResponse.json()) as {
        user: { rol: Rol };
      };

      const destination =
        callbackUrl && callbackUrl.startsWith("/")
          ? callbackUrl
          : getDashboardForRole(data.user.rol);

      router.push(destination);
      router.refresh();
    } catch {
      setError(AUTH_ERROR_MESSAGE);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm space-y-5 rounded-xl bg-white p-8 shadow-sm ring-1 ring-paper-100"
    >
      <div className="space-y-1 text-center">
        <h1 className="font-display text-2xl font-semibold text-clinical-900">
          Iniciar sesión
        </h1>
        <p className="text-sm text-mist-400">
          Acceso para empresas, profesionales y administración
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-lg bg-signal-alert/10 px-4 py-3 text-sm text-signal-alert"
        >
          {error}
        </p>
      )}

      <div className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="email" className="block text-sm font-medium text-clinical-900">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 w-full rounded-lg border border-paper-100 bg-paper-50 px-3 text-clinical-900 outline-none focus-visible:ring-2 focus-visible:ring-clinical-700"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-clinical-900"
          >
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 w-full rounded-lg border border-paper-100 bg-paper-50 px-3 text-clinical-900 outline-none focus-visible:ring-2 focus-visible:ring-clinical-700"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="h-11 w-full rounded-lg bg-clinical-700 text-base font-medium text-white transition-colors hover:bg-clinical-900 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clinical-700"
      >
        {loading ? "Ingresando…" : "Iniciar sesión"}
      </button>
    </form>
  );
}
