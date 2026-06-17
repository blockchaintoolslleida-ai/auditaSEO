/**
 * GET /api/cron/process
 * Endpoint llamado por Vercel Cron cada minuto.
 * Procesa la auditoría pendiente más antigua directamente (sin Redis).
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { processAuditJob } from "@/lib/auditWorker";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Vercel Hobby: 60s max para cron

export async function GET() {
  try {
    // Buscar la auditoría pendiente más antigua
    const pending = await prisma.lead.findFirst({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" },
    });

    if (!pending) {
      return NextResponse.json({ message: "No pending audits" });
    }

    console.log(`[Cron] Processing audit ${pending.id} for ${pending.url}`);

    // Procesar la auditoría
    await processAuditJob({
      leadId: pending.id,
      email: pending.email,
      url: pending.url,
    });

    return NextResponse.json({
      message: "Audit processed",
      auditId: pending.id,
    });
  } catch (error) {
    console.error("[Cron] Error:", error);
    return NextResponse.json(
      { error: "Processing failed" },
      { status: 500 }
    );
  }
}
