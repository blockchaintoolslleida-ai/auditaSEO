# AuditaSEO — Design Spec

## Overview
Landing page + backend SaaS que ofrece auditorías SEO gratuitas para captar leads y convertirlos a la plataforma MultiSEO.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Vercel (Next.js)                    │
│  ┌─────────┐  ┌──────────┐  ┌────────────────────┐  │
│  │ Landing  │  │ API Routes│  │ Informe Online     │  │
│  │ (SSR)    │  │ /api/audit│  │ /informe/[token]   │  │
│  └─────────┘  └──────────┘  └────────────────────┘  │
└──────────────────────┬───────────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────┐
│                 Upstash Redis (BullMQ)                 │
│  ┌────────────────────────────────────────────────┐  │
│  │              audit-queue                        │  │
│  └────────────────────┬───────────────────────────┘  │
└───────────────────────┼──────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────┐
│              Worker (separate process)                 │
│  ┌──────┐ ┌──────┐ ┌────────┐ ┌──────┐ ┌─────────┐ │
│  │Serper│ │DeepS.│ │PageSpd │ │Light-│ │Puppeteer│ │
│  │.dev  │ │  API │ │Insights│ │house │ │  (PDF)  │ │
│  └──────┘ └──────┘ └────────┘ └──────┘ └─────────┘ │
└───────────────────────┬──────────────────────────────┘
                        │
┌───────────────────────▼──────────────────────────────┐
│              Supabase PostgreSQL                       │
│  leads │ audit_rankings │ audit_errors │ ...          │
└──────────────────────────────────────────────────────┘
```

## Tech Decisions
- **Worker separado** (script Node.js) para evitar timeout de Vercel
- **shadcn/ui** + Tailwind para UI consistente
- **Resend** para emails (mejor entregabilidad que Nodemailer)
- **Tokens UUID** para acceso a informes (no IDs secuenciales)

## Data Flow
1. User submits form → POST /api/audit → crea Lead + encola job
2. Worker procesa: Serper → DeepSeek → PageSpeed → Lighthouse → PDF
3. PDF generado → upload a Vercel Blob / Supabase Storage
4. Email enviado vía Resend con link al informe
5. Follow-ups programados con BullMQ delayed jobs

## Models (Prisma)
- Lead, AuditRanking, AuditError, AuditRecommendation, Competitor

## Security
- API keys en .env.local
- Rate limiting en /api/audit
- Auth básica en /admin
- Validación Zod en todos los endpoints
