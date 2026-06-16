import Link from "next/link";
import { BarChart3 } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-primary text-white">
      <div className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold mb-4">
              <BarChart3 className="w-6 h-6 text-accent" />
              Audita<span className="text-accent">SEO</span>
            </Link>
            <p className="text-primary-foreground/60 text-sm max-w-md leading-relaxed">
              Auditorías SEO gratuitas para ayudar a empresas a mejorar su
              visibilidad online. Descubre el potencial real de tu web.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="font-semibold mb-4">Servicios</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/60">
              <li>
                <Link href="/" className="hover:text-accent transition">
                  Auditoría gratuita
                </Link>
              </li>
              <li>
                <a
                  href="https://multiseo.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-accent transition"
                >
                  MultiSEO Platform
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-accent transition">
                  Consultoría SEO
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-primary-foreground/60">
              <li>
                <Link href="/privacidad" className="hover:text-accent transition">
                  Política de Privacidad
                </Link>
              </li>
              <li>
                <Link href="/terminos" className="hover:text-accent transition">
                  Términos de Uso
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-accent transition">
                  Política de Cookies
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-primary-foreground/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-primary-foreground/40">
          <p>
            &copy; {new Date().getFullYear()} AuditaSEO. Todos los derechos
            reservados.
          </p>
          <p>
            Desarrollado con ❤️ por el equipo de{" "}
            <a
              href="https://multiseo.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline"
            >
              MultiSEO
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
