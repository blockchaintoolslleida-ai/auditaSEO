/**
 * Tipos compartidos para AuditaSEO
 */

// --- Estados de auditoría ---
export type AuditStatus = "pending" | "processing" | "completed" | "error";

// --- Request / Response ---
export interface AuditRequest {
  email: string;
  url: string;
}

export interface AuditResponse {
  auditId: string;
  status: AuditStatus;
}

export interface AuditStatusResponse {
  id: string;
  status: AuditStatus;
  createdAt: string;
  updatedAt: string;
}

// --- Ranking ---
export interface RankingEntry {
  keyword: string;
  position: number;
  url: string | null;
  change: number;
  trend: "up" | "down" | "stable";
}

// --- Error ---
export interface ErrorEntry {
  type: "technical" | "content" | "usability" | "performance";
  category: string;
  description: string;
  suggestion: string;
  priority: "critical" | "high" | "medium" | "low";
}

// --- Recomendación ---
export interface RecommendationEntry {
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  impact: "high" | "medium" | "low";
  time: string;
}

// --- Competidor ---
export interface CompetitorEntry {
  domain: string;
  position: number;
}

// --- Resultado completo de auditoría ---
export interface AuditResult {
  id: string;
  email: string;
  url: string;
  score: number;
  sector: string;
  createdAt: string;

  // Puntuaciones por categoría (0-100)
  scores: {
    ranking: number; // 40% peso
    technical: number; // 30% peso
    content: number; // 20% peso
    backlinks: number; // 10% peso
  };

  rankings: RankingEntry[];
  errors: ErrorEntry[];
  recommendations: RecommendationEntry[];
  competitors: CompetitorEntry[];

  // Resumen de Lighthouse
  lighthouse?: {
    performance: number;
    seo: number;
    bestPractices: number;
    accessibility: number;
  };
}

// --- Email ---
export type EmailType =
  | "audit_report"
  | "follow_up_3"
  | "follow_up_7"
  | "follow_up_14";

// --- Dashboard stats ---
export interface AdminStats {
  totalLeads: number;
  completedAudits: number;
  pendingAudits: number;
  conversions: number;
  openRate: number;
  averageScore: number;
}

// --- Job data para BullMQ ---
export interface AuditJobData {
  leadId: string;
  email: string;
  url: string;
}

export interface EmailJobData {
  leadId: string;
  email: string;
  type: EmailType;
  informeUrl: string;
}
