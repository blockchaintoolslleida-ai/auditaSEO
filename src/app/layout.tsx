import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AuditaSEO — Auditoría SEO Gratuita | Descubre el estado real de tu web",
  description:
    "Te mostramos tu posicionamiento actual, errores técnicos y una hoja de ruta para superar a tu competencia. Gratis y sin compromiso.",
  keywords: "auditoría SEO, SEO gratis, posicionamiento web, analizar web, informe SEO",
  openGraph: {
    title: "AuditaSEO — Auditoría SEO Gratuita",
    description: "Descubre el estado real de tu web en 5 minutos. Gratis y sin compromiso.",
    type: "website",
    locale: "es_ES",
  },
  robots: "index, follow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gradient-to-b from-white to-muted/50">
        {children}
      </body>
    </html>
  );
}
