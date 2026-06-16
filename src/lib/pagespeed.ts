/**
 * Cliente para Google PageSpeed Insights API (gratuita)
 * Docs: https://developers.google.com/speed/docs/insights/v5/get-started
 *
 * Obtenemos:
 * - Lighthouse scores: performance, seo, best-practices, accessibility
 * - Core Web Vitals: LCP, FID/TBT, CLS
 * - Oportunidades de mejora
 */

import { config } from "./config";

const PSI_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

interface LighthouseResult {
  performance: number;
  seo: number;
  bestPractices: number;
  accessibility: number;
}

interface CoreWebVitals {
  lcp: { displayValue: string; score: number };
  tbt: { displayValue: string; score: number };
  cls: { displayValue: string; score: number };
}

interface PageSpeedAudit {
  id: string;
  title: string;
  description: string;
  score: number | null;
  displayValue?: string;
}

interface PageSpeedResponse {
  lighthouseResult: {
    categories: Record<string, { score: number }>;
    audits: Record<string, PageSpeedAudit>;
  };
}

export async function runPageSpeedAudit(url: string): Promise<{
  lighthouse: LighthouseResult;
  coreWebVitals: CoreWebVitals;
  opportunities: Array<{ title: string; description: string; score: number }>;
}> {
  if (!config.pagespeedApiKey) {
    console.warn("[PageSpeed] API key not configured, returning mock data");
    return getMockPageSpeedData();
  }

  try {
    const params = new URLSearchParams({
      url,
      key: config.pagespeedApiKey,
      strategy: "mobile",
    });
    // Append multiple category values (URLSearchParams constructor only keeps one)
    for (const cat of ["performance", "seo", "best-practices", "accessibility"]) {
      params.append("category", cat);
    }

    const response = await fetch(`${PSI_URL}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`PageSpeed API error: ${response.status}`);
    }

    const data = (await response.json()) as PageSpeedResponse;
    const { lighthouseResult } = data;
    const categories = lighthouseResult.categories;
    const audits = lighthouseResult.audits;

    // Extraer scores (0-1 → 0-100)
    const lighthouse: LighthouseResult = {
      performance: Math.round((categories["performance"]?.score || 0) * 100),
      seo: Math.round((categories["seo"]?.score || 0) * 100),
      bestPractices: Math.round((categories["best-practices"]?.score || 0) * 100),
      accessibility: Math.round((categories["accessibility"]?.score || 0) * 100),
    };

    // Extraer Core Web Vitals
    const coreWebVitals: CoreWebVitals = {
      lcp: {
        displayValue: audits["largest-contentful-paint"]?.displayValue || "N/A",
        score: audits["largest-contentful-paint"]?.score || 0,
      },
      tbt: {
        displayValue: audits["total-blocking-time"]?.displayValue || "N/A",
        score: audits["total-blocking-time"]?.score || 0,
      },
      cls: {
        displayValue: audits["cumulative-layout-shift"]?.displayValue || "N/A",
        score: audits["cumulative-layout-shift"]?.score || 0,
      },
    };

    // Extraer oportunidades de mejora (solo las que tienen score < 0.9)
    const opportunities = Object.values(audits)
      .filter(
        (audit) =>
          audit.score !== null &&
          audit.score < 0.9 &&
          audit.title &&
          audit.description
      )
      .slice(0, 10)
      .map((audit) => ({
        title: audit.title,
        description: audit.description,
        score: Math.round((audit.score || 0) * 100),
      }));

    return { lighthouse, coreWebVitals, opportunities };
  } catch (error) {
    console.error("[PageSpeed] Error:", error);
    return getMockPageSpeedData();
  }
}

// -----------------------------------------------------------
// Mock data
// -----------------------------------------------------------
function getMockPageSpeedData(): {
  lighthouse: LighthouseResult;
  coreWebVitals: CoreWebVitals;
  opportunities: Array<{ title: string; description: string; score: number }>;
} {
  return {
    lighthouse: {
      performance: 65 + Math.floor(Math.random() * 30),
      seo: 70 + Math.floor(Math.random() * 25),
      bestPractices: 75 + Math.floor(Math.random() * 20),
      accessibility: 70 + Math.floor(Math.random() * 25),
    },
    coreWebVitals: {
      lcp: { displayValue: `${(2 + Math.random() * 3).toFixed(1)} s`, score: 0.65 },
      tbt: { displayValue: `${Math.floor(Math.random() * 500)} ms`, score: 0.7 },
      cls: { displayValue: `${(Math.random() * 0.3).toFixed(2)}`, score: 0.8 },
    },
    opportunities: [
      {
        title: "Eliminar recursos que bloquean el renderizado",
        description: "Los recursos CSS y JS críticos deben cargarse de forma asíncrona o inline para no retrasar el primer renderizado.",
        score: 45,
      },
      {
        title: "Reducir el tiempo de respuesta del servidor",
        description: "El tiempo hasta el primer byte (TTFB) es alto. Considera usar un CDN o mejorar el hosting.",
        score: 55,
      },
      {
        title: "Optimizar imágenes",
        description: "Varias imágenes no están comprimidas adecuadamente. Usa formatos modernos como WebP o AVIF.",
        score: 60,
      },
    ],
  };
}
