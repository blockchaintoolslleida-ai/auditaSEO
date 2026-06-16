"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  BarChart3,
  Download,
  ExternalLink,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Target,
  ArrowUp,
  ArrowDown,
  Minus,
  Shield,
  Search,
  Zap,
} from "lucide-react";
import type { AuditResult } from "@/types";
import { getScoreColor, formatDate } from "@/lib/utils";
import ScoreRadarChart from "@/components/ScoreRadarChart";
import KeywordsBarChart from "@/components/KeywordsBarChart";

export default function InformePage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/audit/result/${id}`)
      .then((res) => {
        if (res.status === 202) throw new Error("La auditoría aún está en proceso");
        if (!res.ok) throw new Error("No se pudo cargar el informe");
        return res.json();
      })
      .then((result) => setData(result))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto" />
          <h1 className="text-2xl font-bold text-primary">
            {error || "Informe no encontrado"}
          </h1>
          <Link href="/" className="text-accent hover:underline">
            Volver al inicio
          </Link>
        </div>
      </div>
    );
  }

  const scoreInfo = getScoreColor(data.score);
  const date = formatDate(data.createdAt);

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold">
            <BarChart3 className="w-6 h-6 text-accent" />
            Audita<span className="text-accent">SEO</span>
          </Link>
          <a
            href={`/api/audit/pdf/${id}`}
            className="flex items-center gap-2 text-sm bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-light transition"
          >
            <Download className="w-4 h-4" />
            Descargar PDF
          </a>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Score */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border text-center">
          <p className="text-sm text-muted-foreground mb-2">{date}</p>
          <h1 className="text-2xl font-bold mb-1">
            Informe SEO de{" "}
            <span className="text-accent">{data.url.replace(/^https?:\/\//, "").replace(/^www\./, "")}</span>
          </h1>
          <p className="text-muted-foreground mb-6">Sector: {data.sector}</p>

          <div className="flex justify-center gap-8 flex-wrap items-center">
            {/* Score circle */}
            <div className="text-center">
              <div
                className="w-32 h-32 rounded-full flex items-center justify-center mx-auto text-white text-3xl font-extrabold shadow-lg"
                style={{ background: scoreInfo.color }}
              >
                {data.score}
              </div>
              <p className="mt-2 font-semibold">{scoreInfo.label}</p>
              <p className="text-xs text-muted-foreground">Puntuación global</p>
            </div>

            {/* Radar Chart */}
            <div className="w-64">
              <ScoreRadarChart scores={data.scores} />
            </div>

            {/* Category scores */}
            <div className="grid grid-cols-2 gap-4 text-center">
              <ScoreBadge label="Ranking" score={data.scores.ranking} weight="40%" />
              <ScoreBadge label="Técnico" score={data.scores.technical} weight="30%" />
              <ScoreBadge label="Contenido" score={data.scores.content} weight="20%" />
              <ScoreBadge label="Backlinks" score={data.scores.backlinks} weight="10%" />
            </div>
          </div>
        </section>

        {/* Keywords Rankings */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-accent" />
            Posiciones en Google
          </h2>
          {/* Gráfico de barras */}
          <KeywordsBarChart rankings={data.rankings} />
          <div className="overflow-x-auto mt-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 font-medium">Keyword</th>
                  <th className="py-2 font-medium text-center">Posición</th>
                  <th className="py-2 font-medium text-center">Cambio</th>
                </tr>
              </thead>
              <tbody>
                {data.rankings.map((r) => (
                  <tr key={r.keyword} className="border-b last:border-0">
                    <td className="py-3 font-medium">{r.keyword}</td>
                    <td className="py-3 text-center">
                      {r.position > 0 ? (
                        <span className="font-bold">#{r.position}</span>
                      ) : (
                        <span className="text-muted-foreground">Fuera del top 20</span>
                      )}
                    </td>
                    <td className="py-3 text-center">
                      <TrendIcon trend={r.trend} change={r.change} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Errors */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Errores detectados ({data.errors.length})
          </h2>
          <div className="space-y-3">
            {data.errors.slice(0, 20).map((e, i) => (
              <div
                key={i}
                className={`p-4 rounded-xl border-l-4 ${
                  e.priority === "critical"
                    ? "border-red-500 bg-red-50"
                    : e.priority === "high"
                    ? "border-amber-500 bg-amber-50"
                    : e.priority === "medium"
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-300 bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                      {e.type} • {e.category}
                    </p>
                    <p className="font-medium">{e.description}</p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                      e.priority === "critical"
                        ? "bg-red-200 text-red-800"
                        : e.priority === "high"
                        ? "bg-amber-200 text-amber-800"
                        : e.priority === "medium"
                        ? "bg-blue-200 text-blue-800"
                        : "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {e.priority}
                  </span>
                </div>
                {e.suggestion && (
                  <p className="mt-2 text-sm text-accent">
                    💡 {e.suggestion}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Recommendations */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-accent" />
            Recomendaciones priorizadas
          </h2>
          <div className="space-y-4">
            {data.recommendations.map((r, i) => (
              <div
                key={i}
                className="bg-muted/30 rounded-xl p-5 border border-border/50"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="font-bold">
                    <span className="text-accent mr-2">#{i + 1}</span>
                    {r.title}
                  </h3>
                  <div className="flex gap-2">
                    <Badge
                      label={r.difficulty}
                      color={
                        r.difficulty === "easy"
                          ? "bg-green-100 text-green-700"
                          : r.difficulty === "medium"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-red-100 text-red-700"
                      }
                    />
                    <Badge
                      label={r.impact}
                      color={
                        r.impact === "high"
                          ? "bg-green-100 text-green-700"
                          : r.impact === "medium"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      }
                    />
                  </div>
                </div>
                <p className="text-muted-foreground text-sm">{r.description}</p>
                <p className="text-xs text-muted-foreground mt-2">⏱️ {r.time}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Competitors */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent" />
            Comparativa con competidores
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 font-medium">Dominio</th>
                  <th className="py-2 font-medium text-center">Posición Media</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b bg-accent/5">
                  <td className="py-3 font-bold flex items-center gap-2">
                    <Shield className="w-4 h-4 text-accent" />
                    {data.url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0]}
                    <span className="text-xs text-muted-foreground">(tú)</span>
                  </td>
                  <td className="py-3 text-center">
                    {data.score > 0 ? `#${Math.round(data.rankings.reduce((a,b) => a + b.position, 0) / Math.max(data.rankings.length, 1))}` : "—"}
                  </td>
                </tr>
                {data.competitors.map((c) => (
                  <tr key={c.domain} className="border-b last:border-0">
                    <td className="py-3">{c.domain}</td>
                    <td className="py-3 text-center">#{c.position}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Lighthouse scores (if available) */}
        {data.lighthouse && (
          <section className="bg-white rounded-2xl p-6 shadow-sm border">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-accent" />
              Lighthouse Scores
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <LighthouseBadge
                label="Performance"
                score={data.lighthouse.performance}
              />
              <LighthouseBadge label="SEO" score={data.lighthouse.seo} />
              <LighthouseBadge
                label="Best Practices"
                score={data.lighthouse.bestPractices}
              />
              <LighthouseBadge
                label="Accessibility"
                score={data.lighthouse.accessibility}
              />
            </div>
          </section>
        )}

        {/* CTA Final */}
        <section className="bg-primary rounded-2xl p-8 sm:p-12 text-white text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold">
            ¿Listo para mejorar tu SEO?
          </h2>
          <p className="text-primary-foreground/70 max-w-xl mx-auto">
            Nuestro equipo de expertos te ayudará a implementar estas mejoras y
            escalar tu tráfico orgánico.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href={process.env.NEXT_PUBLIC_CALENDLY_URL || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-accent text-white font-semibold py-3 px-8 rounded-xl hover:bg-accent-dark transition"
            >
              Agendar consultoría gratuita
              <ExternalLink className="w-4 h-4" />
            </a>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-white/10 text-white font-semibold py-3 px-8 rounded-xl hover:bg-white/20 transition"
            >
              Nueva auditoría
              <Search className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer simple */}
      <footer className="text-center py-8 text-sm text-muted-foreground">
        <p>AuditaSEO — Informe generado el {date}</p>
      </footer>
    </div>
  );
}

// --- Helper components ---

function ScoreBadge({
  label,
  score,
  weight,
}: {
  label: string;
  score: number;
  weight: string;
}) {
  const color =
    score >= 80 ? "text-green-600" : score >= 50 ? "text-amber-600" : "text-red-600";
  return (
    <div className="bg-muted/50 rounded-xl p-3 min-w-[80px]">
      <p className="text-2xl font-bold">{score}</p>
      <p className={`text-xs font-medium ${color}`}>{label}</p>
      <p className="text-xs text-muted-foreground">{weight}</p>
    </div>
  );
}

function TrendIcon({
  trend,
  change,
}: {
  trend: "up" | "down" | "stable";
  change: number;
}) {
  if (trend === "up") {
    return (
      <span className="text-green-600 flex items-center justify-center gap-1">
        <ArrowUp className="w-3 h-3" />+{change}
      </span>
    );
  }
  if (trend === "down") {
    return (
      <span className="text-red-600 flex items-center justify-center gap-1">
        <ArrowDown className="w-3 h-3" />
        {change}
      </span>
    );
  }
  return (
    <span className="text-muted-foreground flex items-center justify-center gap-1">
      <Minus className="w-3 h-3" />—
    </span>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>
      {label}
    </span>
  );
}

function LighthouseBadge({
  label,
  score,
}: {
  label: string;
  score: number;
}) {
  const color =
    score >= 90
      ? "text-green-600 border-green-200 bg-green-50"
      : score >= 50
      ? "text-amber-600 border-amber-200 bg-amber-50"
      : "text-red-600 border-red-200 bg-red-50";
  return (
    <div className={`rounded-xl p-4 text-center border ${color}`}>
      <p className="text-3xl font-bold">{score}</p>
      <p className="text-xs mt-1 opacity-75">{label}</p>
    </div>
  );
}
