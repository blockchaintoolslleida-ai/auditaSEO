/**
 * Panel de Administración — Protegido con autenticación básica.
 *
 * Ruta: /admin
 * Auth: Basic Auth (usuario/contraseña en variables de entorno)
 */

import { headers } from "next/headers";
import Link from "next/link";
import prisma from "@/lib/db";
import {
  BarChart3,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  ExternalLink,
  Download,
  Mail,
  MailOpen,
  Lock,
} from "lucide-react";

// --- Autenticación básica ---
function checkAuth(): { ok: boolean; user?: string } {
  try {
    const headersList = headers();
    const authHeader = headersList.get("authorization");

    if (!authHeader?.startsWith("Basic ")) return { ok: false };

    const base64 = authHeader.slice(6);
    const decoded = Buffer.from(base64, "base64").toString();
    const [user, password] = decoded.split(":");

    const adminUser = process.env.ADMIN_USER || "admin";
    const adminPass = process.env.ADMIN_PASSWORD || "admin123";

    return { ok: user === adminUser && password === adminPass, user };
  } catch {
    return { ok: false };
  }
}

export default async function AdminPage() {
  const auth = checkAuth();

  // Login form cuando no está autenticado
  if (!auth.ok) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center space-y-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-primary">Panel de Administración</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Acceso restringido. Usa tus credenciales para entrar.
            </p>
          </div>
          <form className="space-y-3 text-left">
            <div>
              <label className="block text-sm font-medium mb-1">Usuario</label>
              <input
                type="text"
                name="username"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="admin"
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contraseña</label>
              <input
                type="password"
                name="password"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-primary-light transition"
            >
              Entrar
            </button>
          </form>
          <p className="text-xs text-muted-foreground">
            Este login usa HTTP Basic Auth nativo del navegador. Si no funciona,
            visita <code className="bg-muted px-1 rounded">http://admin:admin123@localhost:2500/admin</code>
          </p>
        </div>
      </div>
    );
  }

  // --- Autenticado: cargar datos ---
  const [
    totalLeads, completedAudits, pendingAudits, conversions,
    emailsSent, emailsOpened, recentLeads,
  ] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { status: "completed" } }),
    prisma.lead.count({ where: { status: { in: ["pending", "processing"] } } }),
    prisma.lead.count({ where: { convertedAt: { not: null } } }),
    prisma.emailLog.count(),
    prisma.emailLog.count({ where: { openedAt: { not: null } } }),
    prisma.lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true, email: true, url: true, status: true,
        score: true, sector: true, createdAt: true,
        sentAt: true, convertedAt: true,
      },
    }),
  ]);

  const openRate = emailsSent > 0 ? Math.round((emailsOpened / emailsSent) * 100) : 0;
  const avgScore = completedAudits > 0
    ? Math.round((await prisma.lead.aggregate({ where: { status: "completed" }, _avg: { score: true } }))._avg.score || 0)
    : 0;

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold">
            <BarChart3 className="w-6 h-6 text-accent" />
            Audita<span className="text-accent">SEO</span>
          </Link>
          <span className="text-sm bg-primary text-white px-3 py-1 rounded-full">
            Admin Panel
          </span>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <h1 className="text-2xl font-bold">Panel de Administración</h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <StatCard icon={<Users className="w-5 h-5" />} label="Total Leads" value={totalLeads} color="bg-blue-50 text-blue-600" />
          <StatCard icon={<CheckCircle2 className="w-5 h-5" />} label="Completadas" value={completedAudits} color="bg-green-50 text-green-600" />
          <StatCard icon={<Clock className="w-5 h-5" />} label="Pendientes" value={pendingAudits} color="bg-amber-50 text-amber-600" />
          <StatCard icon={<TrendingUp className="w-5 h-5" />} label="Conversiones" value={conversions} color="bg-purple-50 text-purple-600" />
          <StatCard icon={<Mail className="w-5 h-5" />} label="Emails" value={emailsSent} color="bg-indigo-50 text-indigo-600" />
          <StatCard icon={<MailOpen className="w-5 h-5" />} label="Apertura" value={`${openRate}%`} color="bg-teal-50 text-teal-600" />
          <StatCard icon={<BarChart3 className="w-5 h-5" />} label="Score Medio" value={avgScore} color="bg-rose-50 text-rose-600" />
        </div>

        {/* Serper Usage */}
        <SerperUsage />

        {/* Leads table */}
        <section className="bg-white rounded-2xl shadow-sm border overflow-hidden">
          <div className="p-6 border-b">
            <h2 className="text-lg font-bold">Últimos Leads ({recentLeads.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 text-left text-muted-foreground">
                  <th className="py-3 px-4 font-medium">Fecha</th>
                  <th className="py-3 px-4 font-medium">Email</th>
                  <th className="py-3 px-4 font-medium">URL</th>
                  <th className="py-3 px-4 font-medium">Score</th>
                  <th className="py-3 px-4 font-medium">Sector</th>
                  <th className="py-3 px-4 font-medium">Estado</th>
                  <th className="py-3 px-4 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {recentLeads.map((lead) => (
                  <tr key={lead.id} className="border-b hover:bg-muted/20 transition">
                    <td className="py-3 px-4 whitespace-nowrap text-xs">
                      {new Date(lead.createdAt).toLocaleDateString("es-ES")}
                    </td>
                    <td className="py-3 px-4 text-xs">{lead.email}</td>
                    <td className="py-3 px-4 text-xs max-w-[180px] truncate">{lead.url}</td>
                    <td className="py-3 px-4">
                      {lead.score !== null ? (
                        <span className={`font-bold text-xs ${lead.score >= 80 ? "text-green-600" : lead.score >= 50 ? "text-amber-600" : "text-red-600"}`}>{lead.score}</span>
                      ) : "—"}
                    </td>
                    <td className="py-3 px-4 text-xs text-muted-foreground">{lead.sector || "—"}</td>
                    <td className="py-3 px-4"><StatusBadge status={lead.status} /></td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        {lead.status === "completed" && (
                          <>
                            <Link href={`/informe/${lead.id}`} className="text-accent hover:underline" title="Ver informe">
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                            <a href={`/api/audit/pdf/${lead.id}`} className="text-primary hover:underline" title="Descargar PDF">
                              <Download className="w-4 h-4" />
                            </a>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

// --- Serper usage counter ---
async function SerperUsage() {
  const month = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  const usage = await prisma.usageCounter.findUnique({
    where: { api_month: { api: "serper", month } },
  });

  if (!usage) return null;

  const pct = Math.round((usage.count / usage.limit) * 100);
  return (
    <div className="bg-white rounded-2xl border p-4 flex items-center gap-4">
      <span className="text-sm font-medium">Serper.dev</span>
      <div className="flex-1 bg-muted rounded-full h-3 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct > 90 ? "bg-red-500" : pct > 75 ? "bg-amber-500" : "bg-green-500"}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className="text-sm font-mono">{usage.count}/{usage.limit}</span>
      <span className="text-xs text-muted-foreground">({pct}%)</span>
    </div>
  );
}

// --- Helpers ---
function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode; label: string; value: number | string; color: string;
}) {
  return (
    <div className="bg-white rounded-xl p-4 border shadow-sm">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${color}`}>{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-gray-100 text-gray-600",
    processing: "bg-blue-100 text-blue-600",
    completed: "bg-green-100 text-green-600",
    error: "bg-red-100 text-red-600",
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${styles[status] || styles.pending}`}>
      {status}
    </span>
  );
}
