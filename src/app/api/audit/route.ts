/**
 * POST /api/audit
 * Inicia una auditoría SEO: valida datos, crea el Lead y encola el job.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/db";
import { enqueueAudit } from "@/lib/queue";
import { isValidEmail, isValidUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

// Schema de validación con Zod
const auditRequestSchema = z.object({
  email: z
    .string()
    .min(1, "El email es obligatorio")
    .email("Email inválido")
    .refine((val) => isValidEmail(val), "Email inválido"),
  url: z
    .string()
    .min(1, "La URL es obligatoria")
    .refine((val) => isValidUrl(val), "URL inválida"),
});

// Rate limiting simple (en producción usar upstash/ratelimit)
const rateLimitMap = new Map<string, { count: number; reset: number }>();
const RATE_LIMIT = 10; // Máximo 10 solicitudes por IP
const RATE_WINDOW = 60 * 1000; // Ventana de 1 minuto

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + RATE_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT) return false;

  entry.count++;
  return true;
}

export async function POST(request: Request) {
  try {
    // --- Rate limiting ---
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "unknown";

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Inténtalo en un minuto." },
        { status: 429 }
      );
    }

    // --- Validar body ---
    const body = await request.json();
    const parsed = auditRequestSchema.safeParse(body);

    if (!parsed.success) {
      const errors = parsed.error.flatten().fieldErrors;
      return NextResponse.json(
        {
          error: "Datos inválidos",
          details: errors,
        },
        { status: 400 }
      );
    }

    const { email, url } = parsed.data;

    // Normalizar URL
    const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;

    // --- Verificar si ya existe una auditoría reciente para este email+url ---
    const recentAudit = await prisma.lead.findFirst({
      where: {
        email,
        url: normalizedUrl,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Últimas 24h
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recentAudit && recentAudit.status === "completed") {
      return NextResponse.json({
        auditId: recentAudit.id,
        status: recentAudit.status,
        message:
          "Ya tienes un informe reciente para esta URL. Te redirigimos a él.",
      });
    }

    // --- Crear lead en la DB ---
    const lead = await prisma.lead.create({
      data: {
        email,
        url: normalizedUrl,
        status: "pending",
      },
    });

    // --- Encolar auditoría (fire-and-forget, no bloquea la respuesta) ---
    enqueueAudit(lead.id, email, normalizedUrl).catch((e) =>
      console.error("[API] Queue error (non-blocking):", e.message)
    );

    return NextResponse.json({
      auditId: lead.id,
      status: "pending",
    });
  } catch (error) {
    console.error("[API] POST /api/audit error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
