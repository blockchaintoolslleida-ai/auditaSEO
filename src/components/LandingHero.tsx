"use client";

import { ArrowRight, BarChart3, Search, ShieldCheck, Zap } from "lucide-react";
import AuditForm from "./AuditForm";

export default function LandingHero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />

      {/* Decorative circles */}
      <div className="absolute top-20 right-10 w-72 h-72 bg-accent/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container mx-auto px-4 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left column - Text */}
          <div className="space-y-8 animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium">
              <Zap className="w-4 h-4" />
              Auditoría gratuita • Sin compromiso
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight text-primary">
              Descubre el{" "}
              <span className="text-accent">estado real</span>{" "}
              de tu web en 5 minutos
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground max-w-xl leading-relaxed">
              Te mostramos tu posicionamiento actual, errores técnicos y una hoja de
              ruta para superar a tu competencia. Gratis y sin compromiso.
            </p>

            {/* Benefits list */}
            <div className="grid sm:grid-cols-2 gap-4">
              <BenefitItem
                icon={<BarChart3 className="w-5 h-5" />}
                text="Ranking actual en Google"
              />
              <BenefitItem
                icon={<Search className="w-5 h-5" />}
                text="Análisis de competidores"
              />
              <BenefitItem
                icon={<ShieldCheck className="w-5 h-5" />}
                text="Salud técnica completa"
              />
              <BenefitItem
                icon={<ArrowRight className="w-5 h-5" />}
                text="Recomendaciones personalizadas"
              />
            </div>
          </div>

          {/* Right column - Form */}
          <div className="animate-slide-up lg:sticky lg:top-24">
            <AuditForm />
          </div>
        </div>
      </div>
    </section>
  );
}

function BenefitItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 text-muted-foreground">
      <div className="flex-shrink-0 w-9 h-9 bg-accent/10 rounded-lg flex items-center justify-center text-accent">
        {icon}
      </div>
      <span className="text-sm font-medium">{text}</span>
    </div>
  );
}
