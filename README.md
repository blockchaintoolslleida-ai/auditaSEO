# AuditaSEO 🚀

**Landing page de auditorías SEO gratuitas para captación de leads y conversión a la plataforma MultiSEO.**

Ofrece auditorías SEO automatizadas que analizan el posicionamiento, la salud técnica y generan un plan de acción personalizado. El usuario recibe un informe online y PDF por email, con seguimiento automatizado para conversión.

---

## 🎯 Funcionalidades

- 🌐 **Landing page** de alta conversión con formulario email + URL
- 🔍 **Auditoría SEO automatizada**: rankings, competidores, salud técnica, Lighthouse
- 📊 **Informe online** interactivo con puntuación, gráficos y recomendaciones
- 📧 **Email marketing automatizado**: informe + 3 seguimientos (día 3, 7, 14)
- 📄 **PDF profesional** generado con Puppeteer
- 🛡️ **Panel de administración** con estadísticas y gestión de leads

## 🏗️ Arquitectura

```
Next.js (Frontend + API)
    │
    ├── BullMQ (Redis) ── Cola de auditorías
    │       │
    │       └── Worker (proceso independiente)
    │               ├── Serper.dev (keywords + rankings)
    │               ├── DeepSeek API (keywords + recomendaciones)
    │               ├── PageSpeed Insights (Core Web Vitals)
    │               ├── Lighthouse técnico
    │               └── Puppeteer (PDF)
    │
    └── PostgreSQL ── Lead, Rankings, Errores, Recomendaciones
```

## 🚀 Quick Start

### 1. Clonar e instalar

```bash
git clone <repo-url>
cd auditaseo
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env.local
# Editar .env.local con tus claves API
```

### 3. Iniciar servicios (Docker)

```bash
# PostgreSQL + Redis para desarrollo
docker compose up -d
```

### 4. Crear base de datos

```bash
npx prisma generate
npx prisma db push
```

### 5. Iniciar en desarrollo

```bash
# Terminal 1: Next.js (frontend + API)
npm run dev

# Terminal 2: Worker de auditorías
npm run worker

# Terminal 3: Worker de emails
npm run email:worker
```

Abre [http://localhost:3000](http://localhost:3000).

## 📋 Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | *Requerido* |
| `REDIS_URL` | Redis connection string (Upstash/local) | `redis://localhost:6379` |
| `DEEPSEEK_API_KEY` | DeepSeek API key | — |
| `SERPER_API_KEY` | Serper.dev API key | — |
| `PAGESPEED_API_KEY` | Google PageSpeed Insights API key | — |
| `RESEND_API_KEY` | Resend API key | — |
| `EMAIL_FROM` | Remitente de emails | — |
| `NEXT_PUBLIC_APP_URL` | URL pública de la app | `http://localhost:3000` |
| `NEXT_PUBLIC_CALENDLY_URL` | Link de Calendly para consultoría | — |
| `ADMIN_USER` | Usuario del panel admin | `admin` |
| `ADMIN_PASSWORD` | Contraseña del panel admin | `admin123` |

## 📦 Servicios externos (gratuitos)

| Servicio | Plan Gratuito | Uso |
|----------|---------------|-----|
| [Supabase](https://supabase.com) | 500MB DB + 2 proyectos | PostgreSQL |
| [Upstash](https://upstash.com) | 10K comandos/día | Redis (BullMQ) |
| [Serper.dev](https://serper.dev) | 2,500 consultas/mes | Rankings Google |
| [PageSpeed Insights](https://developers.google.com/speed) | Ilimitado | Core Web Vitals |
| [Resend](https://resend.com) | 100 emails/día | Emails transaccionales |
| [DeepSeek](https://platform.deepseek.com) | Pay-as-you-go (~$0.14/1M tokens) | IA (keywords, recomendaciones) |

## 📁 Estructura del Proyecto

```
auditaseo/
├── prisma/
│   └── schema.prisma          # Modelos de datos
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Layout principal
│   │   ├── page.tsx            # Landing page
│   │   ├── gracias/page.tsx    # Página post-formulario
│   │   ├── informe/[id]/page.tsx  # Dashboard de informe
│   │   ├── admin/page.tsx      # Panel de administración
│   │   └── api/
│   │       └── audit/          # Endpoints de la API
│   ├── components/
│   │   ├── LandingHero.tsx     # Hero + formulario
│   │   ├── AuditForm.tsx       # Formulario de auditoría
│   │   ├── Testimonials.tsx    # Testimonios
│   │   └── Footer.tsx          # Footer
│   ├── lib/
│   │   ├── db.ts               # Cliente Prisma
│   │   ├── queue.ts            # Colas BullMQ
│   │   ├── auditWorker.ts      # Lógica de auditoría
│   │   ├── serper.ts           # Cliente Serper.dev
│   │   ├── deepseek.ts         # Cliente DeepSeek
│   │   ├── pagespeed.ts        # PageSpeed Insights
│   │   ├── lighthouse.ts       # Auditoría técnica
│   │   ├── pdfGenerator.ts     # Generador PDF
│   │   ├── emailSender.ts      # Envío de emails
│   │   ├── config.ts           # Config tipada
│   │   └── utils.ts            # Utilidades
│   └── types/
│       └── index.ts            # Tipos TypeScript
├── workers/
│   ├── audit-worker.ts         # Worker de auditorías
│   └── email-worker.ts         # Worker de emails
├── docker-compose.yml          # PostgreSQL + Redis
├── .env.example                # Template de variables
└── README.md
```

## 🧪 Modo desarrollo (sin APIs externas)

El proyecto funciona en modo mock cuando no hay API keys configuradas:
- Las keywords usan valores por defecto
- Los rankings generan datos aleatorios
- Las recomendaciones usan fallbacks predefinidos
- Los emails se loguean en consola en vez de enviarse

**Ideal para desarrollo del frontend sin depender de servicios externos.**

## 🚢 Deploy a Producción

### Frontend + API → Vercel

```bash
# 1. Conectar repo a Vercel
# 2. Configurar variables de entorno en Vercel Dashboard
# 3. Deploy automático en cada push
```

### Workers → Railway

```bash
# 1. Desplegar workers/ como servicio aparte
# 2. Configurar REDIS_URL y DATABASE_URL
# 3. Comando: npm run worker
```

### Base de datos → Supabase

1. Crear proyecto en Supabase
2. Copiar `DATABASE_URL` de Supabase a `.env.local`
3. Ejecutar `npx prisma db push`

### Redis → Upstash

1. Crear base de datos Redis en Upstash
2. Copiar `REDIS_URL` (formato: `redis://...`)

## 🔒 Seguridad

- API keys en variables de entorno (nunca en el código)
- IDs de informe son UUIDs (no secuenciales)
- Rate limiting en `/api/audit` (10 req/min por IP)
- Panel admin protegido con Basic Auth
- Validación Zod en todos los inputs
- Sanitización XSS en utilidades

## 📊 Capacidad

- **100+ auditorías/día** sin problemas
- Worker con concurrencia de 3 auditorías simultáneas
- Rate limiter: máximo 10 jobs/minuto
- Reintentos con backoff exponencial (3 intentos)

## 📧 Contenido de Emails

| Email | Día | Objetivo |
|-------|-----|----------|
| Informe | 0 | Entregar resultados + PDF |
| Follow-up 1 | 3 | ¿Te ha sido útil? + ofrecer ayuda |
| Follow-up 2 | 7 | Oferta especial: primera consultoría gratis |
| Follow-up 3 | 14 | Caso de éxito + última oportunidad |

## 🛠️ Comandos Útiles

```bash
npm run dev          # Iniciar Next.js en desarrollo
npm run build        # Build de producción
npm run worker       # Iniciar worker de auditorías
npm run email:worker # Iniciar worker de emails
npm run db:studio    # Abrir Prisma Studio (GUI para DB)
npm run db:push      # Sincronizar schema con DB
npm run db:migrate   # Crear migración
```

## 📝 Licencia

MIT © AuditaSEO
