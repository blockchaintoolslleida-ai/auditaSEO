/**
 * GET /api/audit/status/[id]
 * Devuelve el estado actual de una auditoría.
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/db";

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
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        score: true,
      },
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Auditoría no encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: lead.id,
      status: lead.status,
      score: lead.score,
      createdAt: lead.createdAt.toISOString(),
      updatedAt: lead.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("[API] GET /api/audit/status error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
