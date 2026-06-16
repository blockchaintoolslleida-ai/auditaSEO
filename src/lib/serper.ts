/**
 * Cliente para Serper.dev - Google Search API
 * Docs: https://serper.dev/docs
 *
 * Obtenemos:
 * - Posiciones de keywords para el dominio del usuario
 * - Competidores principales (top 3 dominios que aparecen en los resultados)
 */

import { config } from "./config";

const SERPER_URL = "https://google.serper.dev/search";

interface SerperResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
}

interface SerperResponse {
  searchParameters: { q: string; gl: string };
  organic: SerperResult[];
}

/**
 * Busca una keyword en Google y devuelve los resultados orgánicos.
 */
async function searchKeyword(keyword: string): Promise<SerperResult[]> {
  if (!config.serperApiKey) {
    console.warn("[Serper] API key not configured, returning mock data");
    return [];
  }

  const response = await fetch(SERPER_URL, {
    method: "POST",
    headers: {
      "X-API-KEY": config.serperApiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: keyword,
      gl: "es", // España
      num: 20,
    }),
  });

  if (!response.ok) {
    throw new Error(`Serper API error: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as SerperResponse;
  return data.organic || [];
}

/**
 * Obtiene la posición de un dominio para una keyword específica.
 * Devuelve 0 si no está en el top 20.
 */
function getPositionForDomain(
  results: SerperResult[],
  domain: string
): { position: number; url: string | null } {
  const index = results.findIndex((r) => {
    try {
      const hostname = new URL(r.link).hostname;
      return hostname.includes(domain.replace(/^www\./, ""));
    } catch {
      return false;
    }
  });

  if (index === -1) return { position: 0, url: null };
  return { position: index + 1, url: results[index]!.link };
}

/**
 * Extrae los dominios competidores de los resultados de búsqueda.
 * Devuelve los 3 dominios más frecuentes (excluyendo el propio).
 */
function extractCompetitors(
  allResults: SerperResult[][],
  ownDomain: string
): { domain: string; avgPosition: number }[] {
  const domainPositions: Map<string, number[]> = new Map();

  for (const results of allResults) {
    for (const result of results) {
      try {
        const hostname = new URL(result.link).hostname.replace(/^www\./, "");
        if (hostname === ownDomain.replace(/^www\./, "")) continue;
        if (!domainPositions.has(hostname)) {
          domainPositions.set(hostname, []);
        }
        domainPositions.get(hostname)!.push(result.position);
      } catch {
        // skip invalid URLs
      }
    }
  }

  return Array.from(domainPositions.entries())
    .map(([domain, positions]) => ({
      domain,
      avgPosition: positions.reduce((a, b) => a + b, 0) / positions.length,
    }))
    .sort((a, b) => a.avgPosition - b.avgPosition)
    .slice(0, 3);
}

/**
 * Analiza las keywords para un dominio: obtiene posiciones y competidores.
 */
export async function analyzeKeywords(
  keywords: string[],
  domain: string
): Promise<{
  rankings: Array<{
    keyword: string;
    position: number;
    url: string | null;
    change: number;
    trend: "up" | "down" | "stable";
  }>;
  competitors: Array<{ domain: string; position: number }>;
}> {
  // Si no hay API key, devolvemos datos mock para desarrollo
  if (!config.serperApiKey) {
    console.warn("[Serper] Using mock data (no API key)");
    return getMockRankings(keywords, domain);
  }

  const allResults: SerperResult[][] = [];

  const rankings = await Promise.all(
    keywords.map(async (keyword) => {
      const results = await searchKeyword(keyword);
      allResults.push(results);
      const { position, url } = getPositionForDomain(results, domain);
      return {
        keyword,
        position,
        url,
        change: 0, // No tenemos datos históricos en la primera auditoría
        trend: "stable" as const,
      };
    })
  );

  const competitors = extractCompetitors(allResults, domain).map((c) => ({
    domain: c.domain,
    position: Math.round(c.avgPosition),
  }));

  return { rankings, competitors };
}

// -----------------------------------------------------------
// Mock data para desarrollo (sin API key)
// -----------------------------------------------------------
function getMockRankings(
  keywords: string[],
  _domain: string
): {
  rankings: Array<{
    keyword: string;
    position: number;
    url: string | null;
    change: number;
    trend: "up" | "down" | "stable";
  }>;
  competitors: Array<{ domain: string; position: number }>;
} {
  const trends: Array<"up" | "down" | "stable"> = ["up", "down", "stable"];
  return {
    rankings: keywords.map((keyword, i) => ({
      keyword,
      position: Math.floor(Math.random() * 50) + 1,
      url: null,
      change: Math.floor(Math.random() * 10) - 3,
      trend: trends[i % 3]!,
    })),
    competitors: [
      { domain: "competidor1.com", position: 8 },
      { domain: "competidor2.es", position: 15 },
      { domain: "competidor3.com", position: 22 },
    ],
  };
}
