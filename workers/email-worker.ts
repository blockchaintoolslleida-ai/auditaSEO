/**
 * Worker de emails — Proceso independiente.
 *
 * Ejecutar con: npm run email:worker
 *
 * Procesa los jobs de la cola "email-queue" para enviar
 * emails de seguimiento programados (día 3, 7, 14).
 */

import "dotenv/config";

import { Worker } from "bullmq";
import { config } from "../src/lib/config";
import { sendScheduledEmail } from "../src/lib/emailSender";
import { extractDomain } from "../src/lib/utils";
import prisma from "../src/lib/db";
import type { EmailJobData } from "../src/types";

if (!config.redisUrl) {
  console.error("[EmailWorker] REDIS_URL is required.");
  process.exit(1);
}

const worker = new Worker<EmailJobData>(
  "email-queue",
  async (job) => {
    const { leadId, email, type, informeUrl } = job.data;

    // Obtener el dominio del lead para personalizar el email
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { url: true },
    });
    const domain = lead ? extractDomain(lead.url) : "tu web";

    console.log(`[EmailWorker] Sending ${type} email to ${email}`);
    await sendScheduledEmail(leadId, email, type, informeUrl, domain);
  },
  {
    connection: { url: config.redisUrl, maxRetriesPerRequest: null },
    concurrency: 5,
  }
);

worker.on("completed", (job) => {
  console.log(`[EmailWorker] ✅ ${job.data.type} sent to ${job.data.email}`);
});

worker.on("failed", (job, error) => {
  console.error(`[EmailWorker] ❌ Failed to send ${job?.data?.type}:`, error.message);
});

async function shutdown() {
  await worker.close();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

console.log("[EmailWorker] Email worker started. Waiting for scheduled jobs...");
