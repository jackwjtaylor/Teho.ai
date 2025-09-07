# Security Considerations

Scope and data handling guidelines for Teho.ai.

## Data Storage
- User data (goals, tasks, provenance) in Postgres.
- Artifacts in user-selected storage (Local export or Google Drive).

## Access Control
- Better Auth for app auth; Google OAuth for Drive (drive.file scope).
- Store tokens encrypted; support revoke/disconnect.

## Operational Security
- Keep secrets out of the repo; use `.env.local` and Vercel envs.
- Rotate any accidentally committed secrets immediately.

## Future Enhancements
- Add Sentry/monitoring.
- Data retention reviews and export/delete tools.
