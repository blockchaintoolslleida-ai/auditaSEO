"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, Mail, Globe } from "lucide-react";
import { isValidEmail, isValidUrl } from "@/lib/utils";

export default function AuditForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    url?: string;
  }>({});

  function validate(): boolean {
    const errors: { email?: string; url?: string } = {};

    if (!email.trim()) {
      errors.email = "El email es obligatorio";
    } else if (!isValidEmail(email)) {
      errors.email = "Introduce un email válido";
    }

    if (!url.trim()) {
      errors.url = "La URL es obligatoria";
    } else if (!isValidUrl(url)) {
      errors.url = "Introduce una URL válida (ej: tudominio.com)";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!validate()) return;

    setLoading(true);

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), url: url.trim() }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Error al iniciar la auditoría");
      }

      const data = await response.json();
      // Redirigir a la página de agradecimiento con el ID de auditoría
      router.push(`/gracias?auditId=${encodeURIComponent(data.auditId)}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ha ocurrido un error inesperado. Inténtalo de nuevo."
      );
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-primary/5 border border-border/50 p-6 sm:p-8">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-primary">
          Comienza tu auditoría gratis
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Resultados en menos de 5 minutos
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {/* Email field */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-primary mb-1.5"
          >
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }}
              placeholder="tu@email.com"
              className={`w-full pl-10 pr-4 py-3 bg-muted/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition ${
                fieldErrors.email
                  ? "border-red-400 focus:ring-red-400/50"
                  : "border-border"
              }`}
              disabled={loading}
              autoComplete="email"
            />
          </div>
          {fieldErrors.email && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.email}</p>
          )}
        </div>

        {/* URL field */}
        <div>
          <label
            htmlFor="url"
            className="block text-sm font-medium text-primary mb-1.5"
          >
            URL de tu web
          </label>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              id="url"
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setFieldErrors((prev) => ({ ...prev, url: undefined }));
              }}
              placeholder="tudominio.com"
              className={`w-full pl-10 pr-4 py-3 bg-muted/50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition ${
                fieldErrors.url
                  ? "border-red-400 focus:ring-red-400/50"
                  : "border-border"
              }`}
              disabled={loading}
              autoComplete="url"
            />
          </div>
          {fieldErrors.url && (
            <p className="text-red-500 text-xs mt-1">{fieldErrors.url}</p>
          )}
        </div>

        {/* Error general */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent hover:bg-accent-dark text-white font-semibold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-accent/25 hover:shadow-accent/40 animate-pulse-glow"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Iniciando análisis...
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              Analizar mi web ahora
            </>
          )}
        </button>
      </form>

      <p className="text-xs text-center text-muted-foreground mt-4">
        Sin compromiso. No compartimos tu email con terceros.
      </p>
    </div>
  );
}
