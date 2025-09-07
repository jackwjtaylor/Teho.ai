# Architecture Overview (Teho.ai)

High-level design for the Teho.ai MVP built on the agenda.dev base.

## Components
- Next.js frontend (App Router) with goal/milestone/task UI.
- API routes for AI planning, artifacts, and storage operations.
- Storage adapters: Local (zip export) and Google Drive.
- Postgres (Neon) via Drizzle ORM.
- Better Auth (Google), optional Stripe subscriptions, PostHog.

## Data Flow
1. User signs in and creates a goal.
2. Backend calls AI to produce milestones and tasks (validated JSON).
3. System creates a workspace/folder and initial artifacts (plan.md, tasks.md).
4. UI lists milestones/tasks with links to artifacts; updates persisted to Postgres.
5. Provenance events logged; optional reminders via cron + email.
