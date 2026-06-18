/**
 * GET /api/audit/pdf/[id]
 * Sirve el PDF del informe desde la base de datos.
 * El PDF lo genera el worker (GitHub Actions) y se guarda en lead.pdfReport.
 */

import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const dynamic = "force-dynamic";

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
        pdfReport: true,
        url: true,
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
        { error: "El informe aún no está disponible. La auditoría sigue en proceso." },
        { status: 202 }
      );
    }

    if (!lead.pdfReport) {
      return NextResponse.json(
        { error: "El PDF aún no se ha generado. Inténtalo de nuevo en unos minutos." },
        { status: 404 }
      );
    }

    const domain = lead.url
      .replace(/^https?:\/\//, "")
      .replace(/^www\./, "")
      .split("/")[0] || "informe";
    const filename = `auditaseo-${domain}-${new Date().toISOString().split("T")[0]}.pdf`;

    return new NextResponse(new Uint8Array(lead.pdfReport), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": lead.pdfReport.length.toString(),
      },
    });
  } catch (error) {
    console.error("[API] GET /api/audit/pdf error:", error);
    return NextResponse.json(
      { error: "Error sirviendo el PDF" },
      { status: 500 }
    );
  }
}
