/**
 * Utilidades generales para AuditaSEO
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge de clases Tailwind con soporte para conflictos */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Extrae el dominio de una URL */
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] || url;
  }
}

/** Valida un email */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Valida una URL */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return !!parsed.hostname && parsed.hostname.includes(".");
  } catch {
    return false;
  }
}

/** Genera un ID aleatorio (para tokens no secuenciales) */
export function generateToken(length: number = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    result += chars[array[i]! % chars.length]!;
  }
  return result;
}

/** Calcula la puntuación SEO ponderada */
export function calculateSeoScore(scores: {
  ranking: number;
  technical: number;
  content: number;
  backlinks: number;
}): number {
  return Math.round(
    scores.ranking * 0.4 +
    scores.technical * 0.3 +
    scores.content * 0.2 +
    scores.backlinks * 0.1
  );
}

/** Determina el color del semáforo según puntuación */
export function getScoreColor(score: number): {
  color: string;
  label: string;
  textColor: string;
} {
  if (score >= 80) return { color: "#10b981", label: "Bueno", textColor: "text-green-600" };
  if (score >= 50) return { color: "#f59e0b", label: "Regular", textColor: "text-amber-600" };
  return { color: "#ef4444", label: "Necesita mejoras", textColor: "text-red-600" };
}

/** Formatea una fecha para mostrar */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Retraso artificial (para animaciones de carga) */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Trunca texto con ellipsis */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/** Sanitiza input de usuario contra XSS básico */
export function sanitize(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}
