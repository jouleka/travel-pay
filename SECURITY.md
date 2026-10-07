# Security maintenance and deployment

Use Node.js 24 and Java 21. The frontend uses maintained Angular 22; the backend uses Spring Boot 4.0.8. Configure the production HTTPS API endpoint in `frontend/src/app/config/api.config.ts` before building.

The backend requires these environment variables; production secrets have no source-code fallback:

| Variable | Requirement |
| --- | --- |
| `DATABASE_PASSWORD` | Password for the configured database. The default development database is local H2. |
| `JWT_SECRET` | Base64 encoding of at least 32 cryptographically random bytes. Missing, invalid, or short values prevent startup. |
| `CORS_ALLOWED_ORIGINS` | Comma-separated exact frontend origins, such as `https://example.com`. The development default is `http://localhost:4200`. |

Generate JWT key material in your secret manager or with `openssl rand -base64 32`, and store it as a deployment secret. Do not commit secret values or environment files.

## Existing installations

Previously committed database and JWT values were active development defaults, not unresolved placeholders. Their presence in Git history means they must be treated as disclosed if they were used in any installation. Changing configuration to environment variables does not rotate those values or invalidate old tokens by itself.

Before restarting an existing installation:

1. Change the database account password through the database's administration mechanism, then set `DATABASE_PASSWORD` to the new value. Existing H2 files require a matching database password change.
2. Set a newly generated `JWT_SECRET`. Changing the key invalidates existing signed sessions, so users must sign in again.
3. Remove or reset any existing demonstration accounts and review privileged role assignments. The new initialization script only creates role definitions and does not delete users from an existing database.
4. Configure the deployed frontend origin through `CORS_ALLOWED_ORIGINS`.

The repository contains no production hosting configuration from which an external deployment or actual use of the old values can be established. Coordinate rotation on any installation that used them. Git history is preserved.

## Access controls

Public registration can create ordinary users only. Requests to register with approver or finance roles are rejected. Provision privileged accounts only through a trusted administrative process. Draft updates, deletion, and submission always require ownership, including accounts with both user and approver/finance roles. Finance access to another owner's trip or expenses requires an approved trip, including generic read endpoints. H2's HTTP console is disabled, frame protection is enabled, and credentialed cross-origin requests are not enabled. Internal exception details are not returned to clients.

The frontend sends a bearer token only to the configured API origin and path. It preserves login failures, redirects guarded routes correctly, and refreshes asynchronous views after responses.

## Verification

From `frontend`:

```sh
npm ci --ignore-scripts
npm audit --audit-level=low
npm run build
npm run lint
npm test
```

From `backend`: `mvn -B verify`.

Backend regressions cover invalid/weak JWT keys, token signatures, registration privilege escalation, mixed-role draft ownership, protected routes, allowed and rejected CORS preflights, and frame headers. Tests use an isolated in-memory database and test-only key material. Frontend regressions cover API-scoped tokens, guard redirects, login errors, and delayed results.

Dependabot and pinned GitHub Actions check dependencies and run builds/tests weekly. Review Maven vulnerabilities through GitHub's dependency graph/Dependabot as well; a successful Maven build alone is not an advisory scan. Bundle warnings remain visible. Tests and known-advisory scans do not establish that every possible security issue has been eliminated.
