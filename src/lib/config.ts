/**
 * Configuración tipada desde variables de entorno.
 * Todas las claves API y configuraciones sensibles se leen aquí.
 */

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const optional = (key: string, fallback: string = ""): string => {
  return process.env[key] || fallback;
};

export const config = {
  // App
  appUrl: optional("NEXT_PUBLIC_APP_URL", "http://localhost:3000"),
  calendlyUrl: optional(
    "NEXT_PUBLIC_CALENDLY_URL",
    "https://calendly.com/consultoria-seo"
  ),

  // Database (no requerido en build time — Prisma valida en runtime)
  databaseUrl: optional("DATABASE_URL", "postgresql://localhost:5432/auditaseo"),

  // Redis
  redisUrl: optional("REDIS_URL", "redis://localhost:6379"),

  // APIs
  deepseekApiKey: optional("DEEPSEEK_API_KEY"),
  serperApiKey: optional("SERPER_API_KEY"),
  pagespeedApiKey: optional("PAGESPEED_API_KEY"),

  // Email (Resend)
  resendApiKey: optional("RESEND_API_KEY"),
  emailFrom: optional("EMAIL_FROM", "AuditaSEO <hola@auditaseo.com>"),

  // Admin
  adminUser: optional("ADMIN_USER", "admin"),
  adminPassword: optional("ADMIN_PASSWORD", "admin123"),

  // MultiSEO
  multiSeoApiUrl: optional("MULTISEO_API_URL"),
  multiSeoApiKey: optional("MULTISEO_API_KEY"),
} as const;
