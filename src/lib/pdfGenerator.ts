/**
 * Generador de PDF usando Puppeteer.
 * Renderiza una plantilla HTML con Tailwind (vía CDN) y la convierte a PDF.
 *
 * NOTA: Puppeteer se ejecuta en el worker, NO en las API routes de Next.js.
 * En Vercel serverless functions no hay Chrome disponible.
 */

import type { AuditResult } from "@/types";
import { getScoreColor, formatDate } from "./utils";

/**
 * Genera el HTML completo para el informe PDF.
 * Usa Tailwind CSS vía CDN para estilos consistentes.
 */
function buildReportHTML(result: AuditResult): string {
  const scoreInfo = getScoreColor(result.score);
  const date = formatDate(result.createdAt);

  // Rankings table rows
  const rankingRows = result.rankings
    .map(
      (r) => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${r.keyword}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        ${r.position > 0 ? `#${r.position}` : '<span style="color: #9ca3af;">Fuera del top 20</span>'}
      </td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        ${r.change > 0 ? `<span style="color: #10b981;">↑${r.change}</span>` : r.change < 0 ? `<span style="color: #ef4444;">↓${Math.abs(r.change)}</span>` : "—"}
      </td>
    </tr>`
    )
    .join("");

  // Errors list
  const errorRows = result.errors
    .slice(0, 15)
    .map(
      (e) => `
    <div style="background: #f9fafb; border-radius: 8px; padding: 12px; margin-bottom: 8px; border-left: 4px solid ${e.priority === "critical" ? "#ef4444" : e.priority === "high" ? "#f59e0b" : "#3b82f6"};">
      <p style="font-weight: bold; margin: 0 0 4px 0;">[${e.type}] ${e.category}</p>
      <p style="margin: 0 0 4px 0; color: #4b5563;">${e.description}</p>
      <p style="margin: 0; color: #10b981; font-size: 14px;">💡 ${e.suggestion}</p>
    </div>`
    )
    .join("");

  // Recommendations
  const recRows = result.recommendations
    .map(
      (r, i) => `
    <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <h3 style="margin: 0; font-size: 16px;">${i + 1}. ${r.title}</h3>
        <div>
          <span style="background: ${r.impact === "high" ? "#fef3c7" : r.impact === "medium" ? "#dbeafe" : "#f3f4f6"}; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-left: 4px;">${r.impact}</span>
          <span style="background: ${r.difficulty === "hard" ? "#fee2e2" : r.difficulty === "medium" ? "#fef3c7" : "#d1fae5"}; padding: 2px 8px; border-radius: 4px; font-size: 12px; margin-left: 4px;">${r.difficulty}</span>
        </div>
      </div>
      <p style="color: #4b5563; margin: 8px 0;">${r.description}</p>
      <p style="font-size: 13px; color: #6b7280; margin: 0;">⏱️ ${r.time}</p>
    </div>`
    )
    .join("");

  // Competitors table
  const compRows = result.competitors
    .map(
      (c) => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${c.domain}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">#${c.position}</td>
    </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Informe SEO - ${result.url}</title>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; color: #1a2a3a; margin: 0; padding: 0; }
    .page { padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
    .score-circle { display: inline-block; width: 120px; height: 120px; border-radius: 50%; background: ${scoreInfo.color}; color: white; font-size: 36px; font-weight: bold; line-height: 120px; text-align: center; margin: 20px 0; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th { text-align: left; padding: 8px 12px; background: #f9fafb; font-size: 14px; text-transform: uppercase; color: #6b7280; }
    h2 { font-size: 20px; margin-top: 32px; padding-bottom: 8px; border-bottom: 2px solid #e5e7eb; }
    .cta { background: #1a2a3a; color: white; text-align: center; padding: 24px; border-radius: 12px; margin-top: 40px; }
    .footer { text-align: center; color: #9ca3af; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <h1 style="font-size: 28px; margin: 0;">Audita<span style="color: #10b981;">SEO</span></h1>
      <p style="color: #6b7280;">Informe de Auditoría SEO</p>
      <p style="color: #9ca3af; font-size: 14px;">${date}</p>
    </div>

    <div style="text-align: center;">
      <h2 style="border: none; margin-bottom: 8px;">Puntuación SEO Global</h2>
      <p style="color: #6b7280;">${result.url} • Sector: ${result.sector}</p>
      <div class="score-circle">${result.score}</div>
      <p style="font-weight: bold; color: ${scoreInfo.color};">${scoreInfo.label}</p>
    </div>

    <h2>📊 Posiciones en Google</h2>
    <table>
      <tr><th>Keyword</th><th>Posición</th><th>Cambio</th></tr>
      ${rankingRows}
    </table>

    <h2>🔍 Errores Detectados</h2>
    ${errorRows || '<p style="color: #6b7280;">No se detectaron errores críticos.</p>'}

    <h2>💡 Recomendaciones Priorizadas</h2>
    ${recRows}

    <h2>🏆 Comparativa con Competidores</h2>
    <table>
      <tr><th>Dominio</th><th>Posición Media</th></tr>
      ${compRows}
    </table>

    <div class="cta">
      <p style="font-size: 18px; margin: 0 0 12px 0;"><strong>¿Listo para mejorar tu SEO?</strong></p>
      <p style="margin: 0 0 12px 0;">Agenda una consultoría gratuita con un experto SEO</p>
      <p style="margin: 0; font-size: 14px; opacity: 0.8;">Reserva en: ${result.url ? `https://calendly.com/consultoria-seo` : ""}</p>
    </div>

    <div class="footer">
      <p>AuditaSEO — Auditorías SEO gratuitas</p>
      <p>Este informe fue generado automáticamente el ${date}</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Genera un PDF a partir de los resultados de la auditoría.
 * Requiere Puppeteer (se ejecuta en el worker, no en serverless).
 */
export async function generateAuditPDF(result: AuditResult): Promise<Buffer> {
  const html = buildReportHTML(result);

  // En entornos sin Puppeteer (desarrollo), devolvemos un placeholder
  if (process.env.VERCEL || process.env.NO_PUPPETEER) {
    console.warn("[PDF] Puppeteer not available, returning HTML as buffer");
    return Buffer.from(html, "utf-8");
  }

  try {
    // Import dinámico para que no falle en entornos sin Puppeteer
    const puppeteer = await import("puppeteer");

    const browser = await puppeteer.default.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      margin: { top: "20mm", right: "20mm", bottom: "20mm", left: "20mm" },
      printBackground: true,
    });

    await browser.close();
    return Buffer.from(pdf);
  } catch (error) {
    console.error("[PDF] Error generating PDF:", error);
    // Fallback: devolver el HTML
    return Buffer.from(html, "utf-8");
  }
}
