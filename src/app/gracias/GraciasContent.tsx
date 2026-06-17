"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Loader2,
  Search,
  BarChart3,
  FileText,
  Lightbulb,
  ArrowRight,
  Clock,
} from "lucide-react";

const PROCESSING_STEPS = [
  { icon: Search, text: "Analizando tu dominio..." },
  { icon: BarChart3, text: "Revisando posiciones en Google..." },
  { icon: FileText, text: "Realizando auditoría técnica..." },
  { icon: Lightbulb, text: "Generando recomendaciones..." },
];

const POLL_INTERVAL = 5000; // 5 segundos entre polls
const MAX_POLL_TIME = 3 * 60 * 1000; // 3 minutos máximo de espera

export default function GraciasContent() {
  const searchParams = useSearchParams();
  const auditId = searchParams.get("auditId");
  const [step, setStep] = useState(0);
  const [status, setStatus] = useState<
    "processing" | "completed" | "error" | "timeout"
  >("processing");
  const pollStartRef = useRef(Date.now());

  // Rotar los mensajes de procesamiento
  useEffect(() => {
    if (status !== "processing") return;
    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % PROCESSING_STEPS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [status]);

  // Polling del estado de la auditoría (con timeout)
  useEffect(() => {
    if (!auditId) return;

    const checkStatus = async () => {
      try {
        // Timeout: si llevamos más de MAX_POLL_TIME, mostramos fallback
        if (Date.now() - pollStartRef.current > MAX_POLL_TIME) {
          setStatus("timeout");
          return;
        }

        const response = await fetch(`/api/audit/status/${auditId}`);
        if (!response.ok) return;
        const data = await response.json();
        if (data.status === "completed") {
          setStatus("completed");
        } else if (data.status === "error") {
          setStatus("error");
        }
      } catch {
        // Silently retry
      }
    };

    const interval = setInterval(checkStatus, POLL_INTERVAL);
    checkStatus(); // Immediate first check

    return () => clearInterval(interval);
  }, [auditId]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-transparent to-accent/5">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-lg mx-auto text-center">
          {status === "processing" && (
            <div className="animate-fade-in space-y-8">
              {/* Spinner */}
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 border-4 border-muted rounded-full" />
                <div className="absolute inset-0 border-4 border-t-accent rounded-full animate-spin" />
                <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-accent animate-pulse" />
              </div>

              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-primary">
                  Estamos analizando tu web
                </h1>
                <p className="text-muted-foreground">
                  Esto tomará aproximadamente 1-2 minutos. No cierres esta
                  página.
                </p>
              </div>

              {/* Processing steps */}
              <div className="space-y-3">
                {PROCESSING_STEPS.map((s, i) => {
                  const isActive = i === step;
                  const isPast = i < step;
                  return (
                    <div
                      key={s.text}
                      className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-300 ${
                        isActive
                          ? "bg-accent/10 border border-accent/20"
                          : isPast
                          ? "bg-muted/30 opacity-50"
                          : "bg-muted/30 opacity-30"
                      }`}
                    >
                      <s.icon
                        className={`w-5 h-5 ${
                          isActive
                            ? "text-accent animate-pulse"
                            : "text-muted-foreground"
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          isActive ? "font-medium text-primary" : "text-muted-foreground"
                        }`}
                      >
                        {s.text}
                      </span>
                      {isPast && (
                        <CheckCircle2 className="w-4 h-4 text-accent ml-auto" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {status === "completed" && (
            <div className="animate-fade-in space-y-8">
              <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-accent" />
              </div>

              <div className="space-y-3">
                <h1 className="text-3xl font-bold text-primary">
                  ¡Tu informe está listo!
                </h1>
                <p className="text-lg text-muted-foreground">
                  Te lo hemos enviado por email. También puedes verlo online:
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href={`/informe/${auditId}`}
                  className="inline-flex items-center justify-center gap-2 bg-accent text-white font-semibold py-3 px-6 rounded-xl hover:bg-accent-dark transition shadow-lg shadow-accent/25"
                >
                  Ver informe online
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <p className="text-sm text-muted-foreground">
                ¿No lo encuentras? Revisa tu bandeja de spam o{" "}
                <Link href="/" className="text-accent hover:underline">
                  solicita otra auditoría
                </Link>
              </p>
            </div>
          )}

          {status === "timeout" && (
            <div className="animate-fade-in space-y-8">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-10 h-10 text-amber-600" />
              </div>

              <div className="space-y-3">
                <h1 className="text-2xl font-bold text-primary">
                  Tu auditoría está en marcha
                </h1>
                <p className="text-muted-foreground">
                  Está tardando un poco más de lo esperado. Te enviaremos el
                  informe por email en cuanto esté listo. No hace falta que
                  esperes aquí.
                </p>
              </div>

              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-primary text-white font-semibold py-3 px-6 rounded-xl hover:bg-primary-light transition"
              >
                Volver al inicio
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="animate-fade-in space-y-8">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl">😔</span>
              </div>

              <div className="space-y-3">
                <h1 className="text-2xl font-bold text-primary">
                  Algo salió mal
                </h1>
                <p className="text-muted-foreground">
                  No pudimos completar la auditoría. Esto puede deberse a que el
                  sitio no es accesible o tiene restricciones.
                </p>
              </div>

              <Link
                href="/"
                className="inline-flex items-center gap-2 bg-primary text-white font-semibold py-3 px-6 rounded-xl hover:bg-primary-light transition"
              >
                Intentar de nuevo
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
