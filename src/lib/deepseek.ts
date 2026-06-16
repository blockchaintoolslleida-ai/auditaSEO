/**
 * Cliente para DeepSeek API (deepseek-v4-pro)
 * Usamos el endpoint Anthropic-compatible para interactuar con DeepSeek.
 *
 * Funciones:
 * - detectSector(): detecta el sector/industria de un dominio
 * - generateKeywords(): genera keywords SEO relevantes
 * - generateRecommendations(): genera recomendaciones personalizadas
 */

import { config } from "./config";

const DEEPSEEK_URL = config.deepseekApiKey
  ? "https://api.deepseek.com/v1/chat/completions"
  : "";

interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface DeepSeekResponse {
  choices: Array<{ message: { content: string } }>;
}

async function chat(
  messages: DeepSeekMessage[],
  maxTokens: number = 1000,
  temperature: number = 0.7
): Promise<string> {
  if (!config.deepseekApiKey) {
    console.warn("[DeepSeek] API key not configured, using fallback");
    return "";
  }

  const response = await fetch(DEEPSEEK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.deepseekApiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
      max_tokens: maxTokens,
      temperature,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
  }

  const data = (await response.json()) as DeepSeekResponse;
  return data.choices[0]?.message?.content || "";
}

/**
 * Detecta el sector/industria de un sitio web basado en su dominio y contenido.
 */
export async function detectSector(
  domain: string,
  url: string
): Promise<string> {
  const prompt = `Eres un experto en clasificación de negocios digitales. Basándote en el dominio "${domain}" y la URL "${url}", determina el sector o industria principal del sitio web.

Responde ÚNICAMENTE con el nombre del sector (máximo 3 palabras). Ejemplos: "Ecommerce moda", "Saas B2B", "Salud y bienestar", "Marketing digital", "Educación online".`;

  const messages: DeepSeekMessage[] = [
    { role: "system", content: "Eres un clasificador de industrias. Responde solo con el nombre del sector." },
    { role: "user", content: prompt },
  ];

  try {
    const result = await chat(messages, 50, 0.3);
    return result.trim() || "No detectado";
  } catch (error) {
    console.error("[DeepSeek] Error detecting sector:", error);
    return "No detectado";
  }
}

/**
 * Genera 10 keywords SEO relevantes para un dominio y sector.
 */
export async function generateKeywords(
  domain: string,
  sector: string
): Promise<string[]> {
  const prompt = `Eres un experto SEO. Genera exactamente 10 keywords o frases de búsqueda relevantes para el sitio web "${domain}" del sector "${sector}".

Las keywords deben:
- Ser términos que usuarios reales buscarían en Google
- Incluir una mezcla de: 3 keywords informativas, 3 comerciales, 2 transaccionales, 2 long-tail
- Estar en español

Responde ÚNICAMENTE con la lista de keywords, una por línea, sin numeración ni texto adicional.`;

  const messages: DeepSeekMessage[] = [
    { role: "system", content: "Eres un experto SEO especializado en keyword research. Responde solo con la lista solicitada." },
    { role: "user", content: prompt },
  ];

  try {
    const result = await chat(messages, 300, 0.8);
    return result
      .split("\n")
      .map((line) => line.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((line) => line.length > 2 && line.length < 100);
  } catch (error) {
    console.error("[DeepSeek] Error generating keywords:", error);
    return getFallbackKeywords(sector);
  }
}

/**
 * Genera 5 recomendaciones SEO priorizadas usando DeepSeek.
 */
export async function generateRecommendations(
  domain: string,
  sector: string,
  errors: Array<{ type: string; category: string; description: string }>,
  score: number
): Promise<
  Array<{
    title: string;
    description: string;
    difficulty: "easy" | "medium" | "hard";
    impact: "high" | "medium" | "low";
    time: string;
  }>
> {
  const errorsSummary = errors
    .slice(0, 10)
    .map((e) => `- [${e.type}] ${e.description}`)
    .join("\n");

  const prompt = `Eres un consultor SEO senior con 15 años de experiencia. Has auditado "${domain}" (sector: ${sector}) y la puntuación actual es ${score}/100.

Errores principales detectados:
${errorsSummary || "No se detectaron errores críticos"}

Genera exactamente 5 recomendaciones priorizadas para mejorar el SEO. Para cada una, especifica:
- Título (máximo 80 caracteres)
- Descripción (2-3 frases explicando qué hacer y por qué)
- Dificultad: "easy" (cambio rápido), "medium" (requiere desarrollo), "hard" (proyecto grande)
- Impacto: "high" (gran mejora de tráfico), "medium" (mejora moderada), "low" (mejora marginal)
- Tiempo estimado: ej. "1-2 horas", "1 semana", "1 mes"

Responde en formato JSON, así:
[
  {"title": "...", "description": "...", "difficulty": "easy", "impact": "high", "time": "2-4 horas"},
  ...
]`;

  const messages: DeepSeekMessage[] = [
    { role: "system", content: "Eres un consultor SEO experto. Responde ÚNICAMENTE con el JSON solicitado, sin markdown ni texto adicional." },
    { role: "user", content: prompt },
  ];

  try {
    const result = await chat(messages, 1500, 0.7);
    // Intentar parsear el JSON (limpiar posibles markdown code blocks)
    const cleaned = result
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();
    const parsed = JSON.parse(cleaned) as Array<{
      title: string;
      description: string;
      difficulty: string;
      impact: string;
      time: string;
    }>;
    return parsed.slice(0, 5).map((r) => ({
      title: r.title,
      description: r.description,
      difficulty: (["easy", "medium", "hard"].includes(r.difficulty) ? r.difficulty : "medium") as "easy" | "medium" | "hard",
      impact: (["high", "medium", "low"].includes(r.impact) ? r.impact : "medium") as "high" | "medium" | "low",
      time: r.time || "1-2 semanas",
    }));
  } catch (error) {
    console.error("[DeepSeek] Error generating recommendations:", error);
    return getFallbackRecommendations();
  }
}

// -----------------------------------------------------------
// Fallbacks para desarrollo (sin API key)
// -----------------------------------------------------------

function getFallbackKeywords(sector: string): string[] {
  const baseKeywords: Record<string, string[]> = {
    default: [
      "servicios SEO profesionales",
      "consultoría SEO",
      "agencia SEO",
      "posicionamiento web",
      "auditoría SEO gratis",
      "mejorar ranking Google",
      "SEO para empresas",
      "marketing digital",
      "tráfico orgánico",
      "optimización web",
    ],
  };
  return baseKeywords[sector] || baseKeywords["default"] || [];
}

function getFallbackRecommendations(): Array<{
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  impact: "high" | "medium" | "low";
  time: string;
}> {
  return [
    {
      title: "Optimizar meta títulos y descripciones",
      description: "Los meta títulos y descripciones son el primer contacto con los usuarios en Google. Asegúrate de que cada página tenga un título único de 50-60 caracteres con la keyword principal y una descripción atractiva de 150-160 caracteres.",
      difficulty: "easy",
      impact: "high",
      time: "2-4 horas",
    },
    {
      title: "Mejorar la velocidad de carga",
      description: "Google penaliza los sitios lentos. Implementa lazy loading para imágenes, minimiza CSS/JS, usa un CDN y considera cambiar a un hosting más rápido. Apunta a un LCP menor a 2.5 segundos.",
      difficulty: "medium",
      impact: "high",
      time: "1-2 semanas",
    },
    {
      title: "Crear contenido orientado a keywords long-tail",
      description: "Las keywords long-tail tienen menos competencia y mejor tasa de conversión. Crea contenido de calidad respondiendo preguntas frecuentes de tu audiencia usando herramientas como AnswerThePublic.",
      difficulty: "medium",
      impact: "high",
      time: "2-4 semanas",
    },
    {
      title: "Corregir errores de rastreo e indexación",
      description: "Revisa Google Search Console para identificar páginas no indexadas, errores 404 y problemas de sitemap. Asegúrate de que tu robots.txt no esté bloqueando contenido importante.",
      difficulty: "medium",
      impact: "medium",
      time: "1-3 días",
    },
    {
      title: "Implementar datos estructurados (Schema.org)",
      description: "Los rich snippets mejoran el CTR en un 5-30%. Implementa schema de tipo Organization, WebSite, Article y FAQ en las páginas relevantes para destacar en los resultados de búsqueda.",
      difficulty: "medium",
      impact: "medium",
      time: "2-3 días",
    },
  ];
}
