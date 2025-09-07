# Security Considerations

Scope and data handling guidelines for Teho.ai MVP.

## Data Storage
- User tasks and provenance stored in Postgres.
- Generated artefacts stored in user Google Drive.

## Access Control
- OAuth 2.0 for authenticating with Google services.
- Least privilege scopes requested for Drive access.

## Future Enhancements
- Add Sentry for error monitoring.
- Review data retention policies.
