import { Star } from "lucide-react";

const testimonials = [
  {
    name: "María García",
    role: "CEO de TiendaOnline",
    text: "Gracias a la auditoría descubrimos que teníamos 47 páginas sin indexar. En 3 meses duplicamos nuestro tráfico orgánico.",
    rating: 5,
  },
  {
    name: "Carlos López",
    role: "Fundador de TechStart",
    text: "Pensaba que mi web estaba bien... hasta que vi el informe. Las recomendaciones eran muy claras y accionables.",
    rating: 5,
  },
  {
    name: "Ana Martínez",
    role: "Marketing Manager",
    text: "La comparativa con competidores fue lo más útil. Entendí exactamente dónde estábamos perdiendo tráfico.",
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary mb-4">
            Lo que dicen nuestros usuarios
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Empresas como la tuya ya han mejorado su SEO con nuestras auditorías
            gratuitas.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-muted/50 rounded-2xl p-6 border border-border/50 hover:shadow-lg transition-shadow"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4 text-amber-400 fill-amber-400"
                  />
                ))}
              </div>

              <blockquote className="text-muted-foreground mb-4 leading-relaxed">
                &ldquo;{t.text}&rdquo;
              </blockquote>

              <div>
                <p className="font-semibold text-primary">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
