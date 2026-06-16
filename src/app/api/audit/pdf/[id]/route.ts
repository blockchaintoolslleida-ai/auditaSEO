/**
 * GET /api/audit/pdf/[id]
 * Descarga el PDF del informe.
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { generateAuditPDF } from "@/lib/pdfGenerator";
import type { AuditResult } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id || typeof id !== "string" || id.length < 10) {
      return NextResponse.json(
        { error: "ID de auditoría inválido" },
        { status: 400 }
      );
    }

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        rankings: { orderBy: { position: "asc" } },
        errors: { orderBy: [{ priority: "asc" }, { type: "asc" }] },
        recommendations: true,
        competitors: { orderBy: { position: "asc" } },
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Auditoría no encontrada" },
        { status: 404 }
      );
    }

    if (lead.status !== "completed") {
      return NextResponse.json(
        { error: "El informe aún no está disponible" },
        { status: 202 }
      );
    }

    // Construir el resultado
    const result: AuditResult = {
      id: lead.id,
      email: lead.email,
      url: lead.url,
      score: lead.score || 0,
      sector: lead.sector || "No detectado",
      createdAt: lead.createdAt.toISOString(),
      scores: (lead.auditResult as Record<string, unknown>)?.scores as AuditResult["scores"] || {
        ranking: 0,
        technical: 0,
        content: 0,
        backlinks: 0,
      },
      rankings: lead.rankings.map((r) => ({
        keyword: r.keyword,
        position: r.position,
        url: r.url,
        change: r.change,
        trend: r.trend as "up" | "down" | "stable",
      })),
      errors: lead.errors.map((e) => ({
        type: e.type as AuditResult["errors"][0]["type"],
        category: e.category,
        description: e.description,
        suggestion: e.suggestion,
        priority: e.priority as AuditResult["errors"][0]["priority"],
      })),
      recommendations: lead.recommendations.map((r) => ({
        title: r.title,
        description: r.description,
        difficulty: r.difficulty as AuditResult["recommendations"][0]["difficulty"],
        impact: r.impact as AuditResult["recommendations"][0]["impact"],
        time: r.time,
      })),
      competitors: lead.competitors.map((c) => ({
        domain: c.domain,
        position: c.position,
      })),
      lighthouse: (lead.auditResult as Record<string, unknown>)?.lighthouse as AuditResult["lighthouse"],
    };

    // Generar PDF
    const pdfBuffer = await generateAuditPDF(result);

    const domain = lead.url.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] || "informe";
    const filename = `auditaseo-${domain}-${new Date().toISOString().split("T")[0]}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error("[API] GET /api/audit/pdf error:", error);
    return NextResponse.json(
      { error: "Error generando el PDF" },
      { status: 500 }
    );
  }
}
