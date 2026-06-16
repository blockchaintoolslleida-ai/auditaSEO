/**
 * Worker principal de auditoría SEO.
 * Procesa los jobs de la cola "audit-queue" en segundo plano.
 *
 * Flujo completo:
 * 1. Extrae dominio y detecta el sector (DeepSeek)
 * 2. Genera 10 keywords relevantes (DeepSeek)
 * 3. Obtiene posiciones actuales (Serper.dev)
 * 4. Auditoría técnica (Lighthouse + PageSpeed Insights)
 * 5. Calcula puntuación SEO global (ponderada)
 * 6. Genera recomendaciones (DeepSeek)
 * 7. Crea PDF con el informe (Puppeteer)
 * 8. Envía email al usuario (Resend)
 * 9. Programa emails de seguimiento (BullMQ delayed jobs)
 * 10. Guarda todo en la base de datos
 */

import prisma from "./db";
import { extractDomain, calculateSeoScore } from "./utils";
import { detectSector, generateKeywords, generateRecommendations } from "./deepseek";
import { analyzeKeywords } from "./serper";
import { runPageSpeedAudit } from "./pagespeed";
import { runTechnicalAudit } from "./lighthouse";
import { generateAuditPDF } from "./pdfGenerator";
import { sendScheduledEmail } from "./emailSender";
import { scheduleFollowUpEmails } from "./queue";
import type { AuditJobData, AuditResult, ErrorEntry } from "@/types";

export async function processAuditJob(jobData: AuditJobData): Promise<void> {
  const { leadId, email, url } = jobData;
  const domain = extractDomain(url);

  console.log(`[AuditWorker] Starting audit for ${domain} (lead: ${leadId})`);

  try {
    // --- 1. Actualizar estado a "processing" ---
    await prisma.lead.update({
      where: { id: leadId },
      data: { status: "processing" },
    });

    // --- 2. Detectar sector ---
    console.log(`[AuditWorker] Detecting sector for ${domain}...`);
    const sector = await detectSector(domain, url);

    // --- 3. Generar keywords ---
    console.log(`[AuditWorker] Generating keywords...`);
    const keywords = await generateKeywords(domain, sector);
    const effectiveKeywords = keywords.length >= 5 ? keywords : [
      "servicios SEO", "consultoría SEO", "agencia SEO", "posicionamiento web",
      "auditoría SEO", "mejorar ranking Google", "SEO para empresas",
      "marketing digital", "tráfico orgánico", "optimización web",
    ];

    // --- 4. Analizar posiciones ---
    console.log(`[AuditWorker] Analyzing keyword positions...`);
    const { rankings, competitors } = await analyzeKeywords(effectiveKeywords, domain);

    // --- 5. Auditoría técnica ---
    console.log(`[AuditWorker] Running technical audit...`);
    const technicalAudit = await runTechnicalAudit(url);

    // --- 6. PageSpeed Insights ---
    console.log(`[AuditWorker] Running PageSpeed audit...`);
    const pageSpeedResult = await runPageSpeedAudit(url);

    // --- 7. Calcular puntuaciones ---
    const rankingScore = calculateRankingScore(rankings);
    const technicalScore = calculateTechnicalScore(
      technicalAudit.score,
      pageSpeedResult.lighthouse
    );
    const contentScore = calculateContentScore(technicalAudit.checks);
    const backlinksScore = 50; // Placeholder (necesitaríamos APIs como Ahrefs/Moz)

    const globalScore = calculateSeoScore({
      ranking: rankingScore,
      technical: technicalScore,
      content: contentScore,
      backlinks: backlinksScore,
    });

    // --- 8. Recopilar errores ---
    const allErrors: ErrorEntry[] = [
      ...technicalAudit.checks
        .filter((c) => !c.passed)
        .map((c) => ({
          type: c.category,
          category: c.name,
          description: c.description,
          suggestion: c.suggestion,
          priority: c.priority,
        })),
      ...pageSpeedResult.opportunities.map((o) => ({
        type: "performance" as const,
        category: "PageSpeed",
        description: `${o.title}: ${o.description}`,
        suggestion: "Revisa las recomendaciones de PageSpeed Insights para más detalles.",
        priority: o.score < 50 ? ("critical" as const) : o.score < 70 ? ("high" as const) : ("medium" as const),
      })),
    ];

    // --- 9. Generar recomendaciones con DeepSeek ---
    console.log(`[AuditWorker] Generating recommendations...`);
    const recommendations = await generateRecommendations(
      domain,
      sector,
      allErrors,
      globalScore
    );

    // --- 10. Construir resultado completo ---
    const auditResult: AuditResult = {
      id: leadId,
      email,
      url,
      score: globalScore,
      sector,
      createdAt: new Date().toISOString(),
      scores: {
        ranking: rankingScore,
        technical: technicalScore,
        content: contentScore,
        backlinks: backlinksScore,
      },
      rankings: rankings.map((r) => ({
        keyword: r.keyword,
        position: r.position,
        url: r.url,
        change: r.change,
        trend: r.trend,
      })),
      errors: allErrors,
      recommendations,
      competitors: competitors.map((c) => ({
        domain: c.domain,
        position: c.position,
      })),
      lighthouse: pageSpeedResult.lighthouse,
    };

    // --- 11. Generar PDF ---
    console.log(`[AuditWorker] Generating PDF...`);
    let pdfBuffer: Buffer | null = null;
    try {
      pdfBuffer = await generateAuditPDF(auditResult);
    } catch (pdfError) {
      console.error("[AuditWorker] PDF generation failed:", pdfError);
    }

    // --- 12. Guardar todo en la DB ---
    console.log(`[AuditWorker] Saving results to database...`);

    await prisma.$transaction(async (tx) => {
      // Guardar rankings
      await tx.auditRanking.createMany({
        data: auditResult.rankings.map((r) => ({
          leadId,
          ...r,
        })),
      });

      // Guardar errores
      await tx.auditError.createMany({
        data: auditResult.errors.map((e) => ({
          leadId,
          ...e,
        })),
      });

      // Guardar recomendaciones
      await tx.auditRecommendation.createMany({
        data: auditResult.recommendations.map((r) => ({
          leadId,
          ...r,
        })),
      });

      // Guardar competidores
      await tx.competitor.createMany({
        data: auditResult.competitors.map((c) => ({
          leadId,
          ...c,
        })),
      });

      // Actualizar lead con resultado completo
      await tx.lead.update({
        where: { id: leadId },
        data: {
          status: "completed",
          score: globalScore,
          sector,
          auditResult: auditResult as unknown as object,
        },
      });
    });

    // --- 13. Enviar email al usuario ---
    console.log(`[AuditWorker] Sending report email to ${email}...`);
    const informeUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/informe/${leadId}`;
    await sendScheduledEmail(leadId, email, "audit_report", informeUrl, domain);

    // --- 14. Programar emails de seguimiento ---
    await scheduleFollowUpEmails(leadId, email, informeUrl);

    console.log(`[AuditWorker] Audit completed for ${domain}. Score: ${globalScore}/100`);

  } catch (error) {
    console.error(`[AuditWorker] Fatal error for ${domain}:`, error);

    // Actualizar estado a error
    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status: "error",
        notes: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
    });

    throw error; // BullMQ reintentará según la configuración
  }
}

// -----------------------------------------------------------
// Helpers de puntuación
// -----------------------------------------------------------

function calculateRankingScore(
  rankings: Array<{ position: number }>
): number {
  if (rankings.length === 0) return 0;

  const scores: number[] = rankings.map((r) => {
    if (r.position === 0) return 0;     // No está en top 20
    if (r.position === 1) return 100;    // Posición 1
    if (r.position <= 3) return 90;      // Top 3
    if (r.position <= 10) return 70;     // Top 10
    if (r.position <= 20) return 40;     // Top 20
    return 0;
  });

  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function calculateTechnicalScore(
  technicalAuditScore: number,
  lighthouse: { performance: number; seo: number; bestPractices: number; accessibility: number }
): number {
  // 50% auditoría técnica propia + 50% Lighthouse
  const lighthouseAvg =
    (lighthouse.performance + lighthouse.seo + lighthouse.bestPractices + lighthouse.accessibility) / 4;
  return Math.round(technicalAuditScore * 0.5 + lighthouseAvg * 0.5);
}

function calculateContentScore(
  checks: Array<{ category: string; passed: boolean }>
): number {
  const contentChecks = checks.filter((c) => c.category === "content");
  if (contentChecks.length === 0) return 50; // Puntuación neutral si no hay checks
  const passed = contentChecks.filter((c) => c.passed).length;
  return Math.round((passed / contentChecks.length) * 100);
}
