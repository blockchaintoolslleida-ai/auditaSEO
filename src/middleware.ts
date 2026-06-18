/**
 * Middleware de Next.js — Protege /admin con HTTP Basic Auth.
 * Se ejecuta en el edge (antes de Vercel) y funciona con el
 * diálogo de autenticación nativo del navegador.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Solo proteger rutas /admin
  if (!request.nextUrl.pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Basic ")) {
    return new NextResponse("Authentication required", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Admin Panel", charset="UTF-8"',
      },
    });
  }

  try {
    const base64 = authHeader.slice(6);
    const decoded = atob(base64);
    const [user, password] = decoded.split(":");

    const adminUser = process.env.ADMIN_USER || "admin";
    const adminPass = process.env.ADMIN_PASSWORD || "admin123";

    if (user === adminUser && password === adminPass) {
      return NextResponse.next();
    }
  } catch {
    // Invalid auth header
  }

  return new NextResponse("Invalid credentials", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Admin Panel", charset="UTF-8"',
    },
  });
}

export const config = {
  matcher: "/admin/:path*",
};
