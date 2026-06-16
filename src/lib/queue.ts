/**
 * Configuración de colas BullMQ con Redis.
 * Usamos lazy initialization para evitar conectarnos durante el build de Next.js.
 *
 * Colas:
 * - audit-queue: procesa las auditorías SEO
 * - email-queue: programa y envía los emails de seguimiento
 */

import { Queue, type ConnectionOptions } from "bullmq";
import { config } from "./config";

// Conexión a Redis (Upstash o local)
function getConnection(): ConnectionOptions {
  return {
    url: config.redisUrl,
    maxRetriesPerRequest: null, // Requerido por BullMQ
  };
}

// --- Colas (lazy initialization) ---

let _auditQueue: Queue | null = null;
let _emailQueue: Queue | null = null;

function getAuditQueue(): Queue {
  if (!_auditQueue) {
    _auditQueue = new Queue("audit-queue", {
      connection: getConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 5000,
        },
        removeOnComplete: { age: 7 * 24 * 3600 }, // 7 días
        removeOnFail: { age: 30 * 24 * 3600 }, // 30 días
      },
    });
  }
  return _auditQueue;
}

function getEmailQueue(): Queue {
  if (!_emailQueue) {
    _emailQueue = new Queue("email-queue", {
      connection: getConnection(),
      defaultJobOptions: {
        attempts: 2,
        backoff: {
          type: "fixed",
          delay: 60000,
        },
      },
    });
  }
  return _emailQueue;
}

// --- Helpers ---

/**
 * Añade una auditoría a la cola para procesamiento en background.
 */
export async function enqueueAudit(leadId: string, email: string, url: string) {
  const queue = getAuditQueue();
  return queue.add("run-audit", { leadId, email, url });
}

/**
 * Programa emails de seguimiento con delays.
 * Día 3, 7 y 14 después del envío del informe.
 */
export async function scheduleFollowUpEmails(
  leadId: string,
  email: string,
  informeUrl: string
) {
  const queue = getEmailQueue();
  const delays = [
    { type: "follow_up_3" as const, delayMs: 3 * 24 * 60 * 60 * 1000 },
    { type: "follow_up_7" as const, delayMs: 7 * 24 * 60 * 60 * 1000 },
    { type: "follow_up_14" as const, delayMs: 14 * 24 * 60 * 60 * 1000 },
  ];

  for (const { type, delayMs } of delays) {
    await queue.add("send-follow-up", { leadId, email, type, informeUrl }, { delay: delayMs });
  }

  console.log(`[Queue] Follow-up emails scheduled for lead ${leadId}`);
}
