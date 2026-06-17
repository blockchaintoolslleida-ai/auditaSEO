/**
 * Script de procesamiento de auditorías para GitHub Actions.
 * Se conecta directamente a Neon PostgreSQL (sin Redis/BullMQ).
 *
 * Flujo:
 * 1. Busca la auditoría pendiente más antigua en Neon
 * 2. La procesa usando las APIs reales (DeepSeek, Serper, etc.)
 * 3. Guarda resultados en Neon
 * 4. Si sobra tiempo, procesa otra
 */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { processAuditJob } from "../../src/lib/auditWorker";

const prisma = new PrismaClient();

async function main() {
  console.log("[GH-Worker] Starting audit processing...");

  let processed = 0;
  const maxToProcess = 3;

  while (processed < maxToProcess) {
    const pending = await prisma.lead.findFirst({
      where: { status: "pending" },
      orderBy: { createdAt: "asc" },
    });

    if (!pending) {
      console.log("[GH-Worker] No pending audits found.");
      break;
    }

    console.log(
      `[GH-Worker] Processing audit ${pending.id} for ${pending.url} (${processed + 1}/${maxToProcess})`
    );

    try {
      await processAuditJob({
        leadId: pending.id,
        email: pending.email,
        url: pending.url,
      });
      console.log(`[GH-Worker] ✅ Audit ${pending.id} completed`);
      processed++;
    } catch (error) {
      console.error(`[GH-Worker] ❌ Audit ${pending.id} failed:`, error);
      // Marcar como error para no reintentarlo infinitamente
      await prisma.lead.update({
        where: { id: pending.id },
        data: {
          status: "error",
          notes: `GitHub Actions error: ${error instanceof Error ? error.message : "Unknown"}`,
        },
      });
    }

    // Pequeña pausa entre auditorías
    if (processed < maxToProcess) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  console.log(`[GH-Worker] Done. Processed ${processed} audits.`);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("[GH-Worker] Fatal error:", error);
    process.exit(1);
  });
