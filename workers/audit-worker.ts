/**
 * Worker de auditoría SEO — Proceso independiente.
 *
 * Ejecutar con: npm run worker
 * o: npx tsx workers/audit-worker.ts
 *
 * Este worker se conecta a Redis y procesa jobs de la cola "audit-queue".
 * Debe ejecutarse en un entorno con Node.js y acceso a Redis.
 * Para producción: Railway, Heroku, VPS con PM2, etc.
 */

import { Worker } from "bullmq";
import { config } from "../src/lib/config";
import { processAuditJob } from "../src/lib/auditWorker";
import type { AuditJobData } from "../src/types";

// Validar configuración mínima
if (!config.redisUrl) {
  console.error("[Worker] REDIS_URL is required. Check your .env.local file.");
  process.exit(1);
}

const worker = new Worker<AuditJobData>(
  "audit-queue",
  async (job) => {
    console.log(`[Worker] Processing job ${job.id} for ${job.data.url}`);
    await processAuditJob(job.data);
    console.log(`[Worker] Job ${job.id} completed successfully`);
  },
  {
    connection: { url: config.redisUrl, maxRetriesPerRequest: null },
    concurrency: 3, // Procesar hasta 3 auditorías en paralelo
    limiter: {
      max: 10,        // Máximo 10 jobs
      duration: 60000, // Por minuto
    },
  }
);

// Eventos del worker
worker.on("completed", (job) => {
  console.log(`[Worker] ✅ Job ${job.id} completed`);
});

worker.on("failed", (job, error) => {
  console.error(`[Worker] ❌ Job ${job?.id} failed:`, error.message);
});

worker.on("error", (error) => {
  console.error("[Worker] Worker error:", error);
});

// Graceful shutdown
async function shutdown() {
  console.log("[Worker] Shutting down...");
  await worker.close();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

console.log("[Worker] Audit worker started. Waiting for jobs...");
console.log(`[Worker] Redis: ${config.redisUrl.replace(/\/\/.*@/, "//***@")}`);
