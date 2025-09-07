# Architecture Overview

High-level diagram and flow description for Teho.ai MVP.

## Components
- Next.js frontend with goal and task management UI.
- Backend API integrating with Google Drive and Postgres.

## Data Flow
1. User signs in and selects a goal.
2. System decomposes goal into milestones and tasks.
3. Workspace created on Google Drive with plan and tasks docs.
4. Task progress updates are persisted to Postgres.
