# AuditaSEO — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development

**Goal:** Build a complete SEO audit landing page with backend worker, report dashboard, and email automation.

**Architecture:** Next.js 14 App Router for frontend + API, BullMQ worker (separate process) for audit processing, PostgreSQL via Prisma, Redis via Upstash.

**Tech Stack:** Next.js 14, TailwindCSS, shadcn/ui, Prisma, BullMQ, Serper.dev, DeepSeek API, PageSpeed Insights, Puppeteer, Resend

---

## Phase 1: Project Setup

### Task 1: Initialize Next.js project
- Create: `package.json`, `tsconfig.json`, `next.config.js`, `tailwind.config.ts`, `postcss.config.js`
- Install dependencies: next, react, tailwindcss, shadcn/ui, prisma, bullmq, etc.

### Task 2: Configure Prisma + Database
- Create: `prisma/schema.prisma` with all models (Lead, AuditRanking, AuditError, AuditRecommendation, Competitor)
- Create: `src/lib/db.ts` - Prisma client singleton

### Task 3: Environment & Config
- Create: `.env.example` with all required variables
- Create: `src/lib/config.ts` - typed env loader

## Phase 2: Core Library

### Task 4: API Clients
- Create: `src/lib/serper.ts`, `src/lib/deepseek.ts`, `src/lib/pagespeed.ts`, `src/lib/lighthouse.ts`
- Create: `src/lib/emailSender.ts` (Resend), `src/lib/pdfGenerator.ts` (Puppeteer)

### Task 5: Queue System
- Create: `src/lib/queue.ts` - BullMQ queue configuration
- Create: `src/lib/auditWorker.ts` - Main audit processing logic

### Task 6: Types & Utilities
- Create: `src/types/index.ts` - All TypeScript interfaces
- Create: `src/lib/utils.ts` - Helper functions

## Phase 3: Landing Page

### Task 7: Layout & Global Styles
- Create: `src/app/layout.tsx`, `src/app/globals.css`
- Create: `src/components/ui/` - shadcn components

### Task 8: Landing Page Components
- Create: `src/components/LandingHero.tsx`, `Benefits.tsx`, `AuditForm.tsx`, `Testimonials.tsx`, `Footer.tsx`
- Create: `src/app/page.tsx` - Main landing page

### Task 9: Thank You Page
- Create: `src/app/gracias/page.tsx`

## Phase 4: API Routes

### Task 10: Audit API Endpoints
- Create: `src/app/api/audit/route.ts` (POST), `src/app/api/audit/status/[id]/route.ts` (GET)
- Create: `src/app/api/audit/result/[id]/route.ts` (GET), `src/app/api/audit/pdf/[id]/route.ts` (GET)

## Phase 5: Report Dashboard

### Task 11: Report Page
- Create: `src/app/informe/[id]/page.tsx` - Full SEO report dashboard
- Create: `src/components/ScoreGauge.tsx`, `RadarChart.tsx`, `KeywordsTable.tsx`, `ErrorsList.tsx`, `RecommendationsCard.tsx`, `CompetitorsTable.tsx`

## Phase 6: Admin Panel

### Task 12: Admin Dashboard
- Create: `src/app/admin/page.tsx` - Protected admin with stats, leads list

## Phase 7: Worker & PDF

### Task 13: Worker Entry Point
- Create: `workers/audit-worker.ts` - Standalone worker process
- Create: `src/lib/reportTemplate.tsx` - HTML template for PDF

## Phase 8: Email Automation

### Task 14: Email Follow-ups
- Create: `src/lib/emailScheduler.ts` - Schedule follow-up emails with BullMQ delayed jobs

## Phase 9: Documentation

### Task 15: README & Deployment
- Create: `README.md`, `docker-compose.yml`
