# Teho.ai – Goal-Driven Workspace Builder (based on agenda.dev)

Teho.ai is a goal-focused planning app that turns high-level outcomes into milestone/task plans and generates initial artifacts in your workspace. It builds on a fork of the agenda.dev codebase (Next.js, React, TypeScript, Postgres), keeping the speed and polish while adding AI-driven planning and storage integrations.

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/exon-enterprise/simple-todo)

## Features (current)

- ⚡️ Fast UI with dark mode
- 🔒 Google authentication via Better Auth
- 🗂 Workspaces for organizing items
- 💬 Comments and reminders (email)
- 📈 PostHog analytics integration

## In Progress (Teho.ai)

- 🧭 Goal → milestone/task planning (AI)
- 🗃 Storage adapters (Local zip export, Google Drive)
- 🧩 Artifacts per task (e.g., plan.md, tasks.md, docs)
- 🧾 Provenance/manifest tracking

## Current Items in Implementation:

- [ ] MCP Server for Workspaces
- [ ] Add Stripe on trial/subscription end etc emails via resend.

## Tech Stack

- **Framework:** Next.js 15+
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL with Drizzle ORM
- **Authentication:** Better Auth (+ Stripe optional)
- **Analytics:** PostHog
- **Deployment:** Vercel
- **Package Manager:** npm

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- PostgreSQL database
- Google OAuth credentials (for authentication)
- PostHog account (for analytics)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/R44VC0RP/todo-exon.git
   cd todo-exon
   ```

2. Install dependencies:
   ```bash
   bun install
   # or
   npm install
   ```

3. Copy the example environment variables:
   ```bash
   cp .env.example .env
   ```

4. Update the environment variables in `.env` with your values (see `.env.example`)

5. Run the development server:
   ```bash
   bun dev
   # or
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
teho/
├── app/              # Next.js 13+ app directory
├── components/       # React components
├── lib/             # Utility functions and types
├── hooks/           # Custom React hooks
├── public/          # Static assets
├── styles/          # Global styles
└── types/           # TypeScript type definitions
```

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Run tests and linting: `bun test`
5. Commit your changes: `git commit -m 'Add some feature'`
6. Push to the branch: `git push origin feature/your-feature`
7. Submit a pull request

## License

Original agenda.dev is MIT-licensed. This fork retains MIT unless otherwise noted.

## Acknowledgments

- Built with [v0.dev](https://v0.dev)
- Deployed on [Vercel](https://vercel.com)
- Analytics by [PostHog](https://posthog.com)
- Feedback by [Featurebase](https://featurebase.app)
