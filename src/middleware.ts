/**
 * Middleware de Next.js — Protege /admin con HTTP Basic Auth.
 * Se ejecuta en el edge (antes de Vercel) y funciona con el
 * diálogo de autenticación nativo del navegador.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Decodificador base64 puro (funciona en cualquier runtime, incluido Edge)
function base64Decode(str: string): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  str = str.replace(/[^A-Za-z0-9+/=]/g, "");
  const idx = (c: string) => { const n = chars.indexOf(c); return n === -1 ? 64 : n; };
  let output = "";
  let i = 0;
  while (i < str.length) {
    const a = idx(str[i++] || "A");
    const b = idx(str[i++] || "A");
    const c = idx(str[i++] || "A");
    const d = idx(str[i++] || "A");
    output += String.fromCharCode((a << 2) | (b >> 4));
    if (c !== 64) output += String.fromCharCode(((b & 15) << 4) | (c >> 2));
    if (d !== 64) output += String.fromCharCode(((c & 3) << 6) | d);
  }
  return output;
}

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
    const decoded = base64Decode(base64);
    const colonIndex = decoded.indexOf(":");
    const user = decoded.slice(0, colonIndex);
    const password = decoded.slice(colonIndex + 1);

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
