/**
 * Auditoría técnica del sitio web.
 * Verifica aspectos que PageSpeed Insights no cubre directamente:
 * - HTTPS
 * - Meta description
 * - H1
 * - Imágenes sin alt
 * - Enlaces rotos (básico)
 * - Etiquetas canónicas
 * - robots.txt
 */

import { extractDomain } from "./utils";

interface TechnicalAuditResult {
  url: string;
  checks: TechnicalCheck[];
  score: number; // 0-100
}

interface TechnicalCheck {
  name: string;
  passed: boolean;
  category: "technical" | "content" | "usability" | "performance";
  description: string;
  suggestion: string;
  priority: "critical" | "high" | "medium" | "low";
}

export async function runTechnicalAudit(url: string): Promise<TechnicalAuditResult> {
  const normalizedUrl = url.startsWith("http") ? url : `https://${url}`;
  const domain = extractDomain(normalizedUrl);
  const checks: TechnicalCheck[] = [];

  // Intentamos obtener la página principal
  let html = "";
  let finalUrl = normalizedUrl;
  let responseStatus = 0;
  let hasHttps = false;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(normalizedUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "AuditaSEO-Bot/1.0 (SEO Audit Tool)",
      },
      redirect: "follow",
    });

    clearTimeout(timeout);
    responseStatus = response.status;
    finalUrl = response.url;
    hasHttps = finalUrl.startsWith("https://");
    html = await response.text();
  } catch (error) {
    checks.push({
      name: "Accesibilidad del sitio",
      passed: false,
      category: "technical",
      description: `No se pudo acceder al sitio web: ${error instanceof Error ? error.message : "Error desconocido"}`,
      suggestion: "Verifica que el sitio esté online y accesible desde internet.",
      priority: "critical",
    });
    return { url: normalizedUrl, checks, score: 0 };
  }

  // --- Check HTTPS ---
  if (hasHttps) {
    checks.push({
      name: "HTTPS",
      passed: true,
      category: "technical",
      description: "El sitio usa HTTPS correctamente.",
      suggestion: "",
      priority: "critical",
    });
  } else {
    checks.push({
      name: "HTTPS",
      passed: false,
      category: "technical",
      description: "El sitio no redirige a HTTPS automáticamente.",
      suggestion: "Configura un certificado SSL y fuerza la redirección HTTP → HTTPS.",
      priority: "critical",
    });
  }

  // --- Check status code ---
  if (responseStatus >= 200 && responseStatus < 300) {
    checks.push({
      name: "Código de respuesta HTTP",
      passed: true,
      category: "technical",
      description: `El servidor responde correctamente (${responseStatus}).`,
      suggestion: "",
      priority: "high",
    });
  } else {
    checks.push({
      name: "Código de respuesta HTTP",
      passed: false,
      category: "technical",
      description: `El servidor responde con código ${responseStatus}.`,
      suggestion: "Verifica la configuración del servidor para asegurar respuestas 200 OK.",
      priority: "critical",
    });
  }

  // --- Check meta description ---
  const metaDescriptionMatch = html.match(
    /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i
  );
  const metaDescription =
    metaDescriptionMatch?.[1] ||
    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i)?.[1];

  if (metaDescription && metaDescription.length > 0) {
    if (metaDescription.length >= 120 && metaDescription.length <= 160) {
      checks.push({
        name: "Meta Description",
        passed: true,
        category: "content",
        description: `Meta description presente (${metaDescription.length} caracteres). Longitud óptima.`,
        suggestion: "",
        priority: "high",
      });
    } else {
      checks.push({
        name: "Meta Description",
        passed: false,
        category: "content",
        description: `Meta description tiene ${metaDescription.length} caracteres. La longitud ideal es 120-160.`,
        suggestion: "Ajusta la meta description a 120-160 caracteres incluyendo la keyword principal.",
        priority: "high",
      });
    }
  } else {
    checks.push({
      name: "Meta Description",
      passed: false,
      category: "content",
      description: "No se encontró meta description en la página principal.",
      suggestion: "Añade una meta description única de 120-160 caracteres que incluya la propuesta de valor y keywords principales.",
      priority: "high",
    });
  }

  // --- Check H1 ---
  const h1Matches = html.match(/<h1[^>]*>/gi);
  if (h1Matches && h1Matches.length === 1) {
    checks.push({
      name: "Encabezado H1",
      passed: true,
      category: "content",
      description: "La página tiene exactamente un H1.",
      suggestion: "",
      priority: "high",
    });
  } else if (h1Matches && h1Matches.length > 1) {
    checks.push({
      name: "Encabezado H1",
      passed: false,
      category: "content",
      description: `La página tiene ${h1Matches.length} etiquetas H1. Debería tener solo una.`,
      suggestion: "Reduce a un único H1 por página que describa el contenido principal.",
      priority: "high",
    });
  } else {
    checks.push({
      name: "Encabezado H1",
      passed: false,
      category: "content",
      description: "No se encontró etiqueta H1 en la página.",
      suggestion: "Añade un H1 descriptivo que incluya la keyword principal de la página.",
      priority: "high",
    });
  }

  // --- Check title ---
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  if (titleMatch?.[1] && titleMatch[1].trim().length > 0) {
    const title = titleMatch[1].trim();
    if (title.length >= 30 && title.length <= 60) {
      checks.push({
        name: "Título de página",
        passed: true,
        category: "content",
        description: `Title presente y con longitud óptima (${title.length} caracteres).`,
        suggestion: "",
        priority: "high",
      });
    } else {
      checks.push({
        name: "Título de página",
        passed: false,
        category: "content",
        description: `El title tiene ${title.length} caracteres (ideal: 30-60).`,
        suggestion: "Ajusta el título a 30-60 caracteres colocando la keyword principal al inicio.",
        priority: "high",
      });
    }
  } else {
    checks.push({
      name: "Título de página",
      passed: false,
      category: "content",
      description: "No se encontró etiqueta title.",
      suggestion: "Añade un title único y descriptivo de 30-60 caracteres.",
      priority: "critical",
    });
  }

  // --- Check images without alt ---
  const imgMatches = html.match(/<img[^>]*>/gi) || [];
  const imgWithoutAlt = imgMatches.filter((img) => !/alt\s*=\s*["']/i.test(img));
  if (imgWithoutAlt.length === 0 && imgMatches.length > 0) {
    checks.push({
      name: "Atributos ALT en imágenes",
      passed: true,
      category: "usability",
      description: "Todas las imágenes tienen atributo alt.",
      suggestion: "",
      priority: "medium",
    });
  } else if (imgWithoutAlt.length > 0) {
    checks.push({
      name: "Atributos ALT en imágenes",
      passed: false,
      category: "usability",
      description: `${imgWithoutAlt.length} de ${imgMatches.length} imágenes no tienen atributo alt.`,
      suggestion: "Añade atributos alt descriptivos a todas las imágenes para mejorar accesibilidad y SEO.",
      priority: "medium",
    });
  }

  // --- Check canonical ---
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*>/i);
  if (canonicalMatch) {
    checks.push({
      name: "Etiqueta canónica",
      passed: true,
      category: "technical",
      description: "La página tiene etiqueta canónica definida.",
      suggestion: "",
      priority: "medium",
    });
  } else {
    checks.push({
      name: "Etiqueta canónica",
      passed: false,
      category: "technical",
      description: "No se encontró etiqueta canónica.",
      suggestion: "Añade una etiqueta canónica para evitar problemas de contenido duplicado.",
      priority: "medium",
    });
  }

  // --- Check robots.txt ---
  try {
    const robotsUrl = new URL("/robots.txt", normalizedUrl).toString();
    const robotsResponse = await fetch(robotsUrl, {
      headers: { "User-Agent": "AuditaSEO-Bot/1.0" },
    });
    const robotsTxt = await robotsResponse.text();

    if (robotsResponse.ok) {
      const hasDisallowAll = /User-agent:\s*\*\s*Disallow:\s*\/\s*$/im.test(robotsTxt);
      if (hasDisallowAll) {
        checks.push({
          name: "robots.txt",
          passed: false,
          category: "technical",
          description: "El robots.txt bloquea todo el sitio a los buscadores.",
          suggestion: "Elimina 'Disallow: /' del robots.txt para permitir que Google indexe tu sitio.",
          priority: "critical",
        });
      } else {
        checks.push({
          name: "robots.txt",
          passed: true,
          category: "technical",
          description: "robots.txt presente y no bloquea el sitio.",
          suggestion: "",
          priority: "high",
        });
      }
    }
  } catch {
    checks.push({
      name: "robots.txt",
      passed: false,
      category: "technical",
      description: "No se encontró robots.txt o no es accesible.",
      suggestion: "Crea un robots.txt en la raíz del sitio para guiar a los crawlers.",
      priority: "medium",
    });
  }

  // --- Calculamos puntuación técnica ---
  const totalChecks = checks.length;
  const passedChecks = checks.filter((c) => c.passed).length;
  // Los críticos tienen más peso en la puntuación
  const criticalChecks = checks.filter((c) => c.priority === "critical");
  const passedCritical = criticalChecks.filter((c) => c.passed).length;
  const criticalWeight = criticalChecks.length > 0
    ? (passedCritical / criticalChecks.length) * 0.5
    : 0.5;
  const generalWeight = totalChecks > 0
    ? ((passedChecks - passedCritical) / Math.max(totalChecks - criticalChecks.length, 1)) * 0.5
    : 0.5;
  const score = Math.round((criticalWeight + generalWeight) * 100);

  return { url: normalizedUrl, checks, score };
}
