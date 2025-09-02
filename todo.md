# NostrMart Refactor: Vercel + Supabase Only

## Foundational Guidelines (Must Follow)
1. NO hard-coding of secrets, API keys, endpoints, pubkeys, relay URLs, event IDs, or domain values in code. All must come from environment variables or runtime input.
2. NO mock or fake data committed (e.g., no dummy pubkeys, signatures, sample events, or placeholder JSON rows).
3. Documentation may show placeholders ONLY in the form <PLACEHOLDER>; never commit those literal placeholders into runtime code.
4. Any constant that influences behavior must be:
   - Passed via environment variable, OR
   - Passed as a function argument.
5. Do not embed default values for secrets in code (env lookup must fail fast if missing).
6. No automated test scaffolding; all validation will be manual (documented in Manual Validation Checklist).
7. Continuous deployment: push to GitHub -> Vercel build & deploy (no separate CI test phase).
8. Perform periodic code review to ensure guideline compliance (search for strings like "http", "key", "pk_", "sig", etc.).
9. Never log secrets or raw Authorization headers; redact before logging.
10. Use placeholders ONLY in documentation: <SUPABASE_URL>, <NOSTR_RELAY_URL>, <BLOSSOM_ENDPOINT>, etc.
11. Local build & run is mandatory before committing or deploying: execute local dependency install and a local serverless function invocation to confirm import success and startup (treat terminal output as feedback loop; fix issues immediately).
12. Do not declare tasks or milestones “complete” until a local clean build (no import errors, no startup exceptions) and manual endpoint smoke run both pass.
13. All manual validation steps must be executed locally first; only then push.

Legend: [P1]=High, [P2]=Medium, [P3]=Low | Type: SV=Serverless, DB=Database, SEC=Security, FE=Frontend, OPS=Operations

## 0. Core Goal
Single deployment on Vercel (Python serverless) + Supabase (Postgres / optional Storage). Fully stateless per request. No background workers, no persistent sockets.

## 1. Architecture (Serverless-Oriented)
- [P1][SV] Directory structure:
  ```
  api/
    health.py
    nostr.py
    media.py
  app/
    core/ (config.py, logging.py, errors.py, response.py)
    models/ (nostr.py, media.py)
    services/ (nostr_service.py, media_service.py)
    adapters/ (supabase_client.py, relay_client.py, blossom_client.py)
    utils/
  migrations/
  docs/
  ```
- [P1][SV] Remove any long-lived loops / subscriptions.
- [P1][SV] Async network I/O (httpx).
- [P2][SV] Keep imports minimal for cold start.
- [P3][SV] Document cold start strategies.

## 2. Supabase Integration
- [P1][DB] supabase_client wrapper (REST) with retry + timeout (no embedded URLs; compose from env).
- [P1][DB] Tables: nostr_events, media_objects (DDL below) created via migrations.
- [P2][DB] Add indexes; enable RLS after schema stabilized.
- [P2][SEC] Separate service-role usage strictly to server-side code (never exposed).
- [P3][DB] Consider ETag / conditional requests later.

## 3. Configuration & Env
- [P1][SV] config.py: strictly load required variables (no defaults for critical ones).
  Required: SUPABASE_URL, SUPABASE_ANON_KEY, NOSTR_RELAY_URL
  Optional: SUPABASE_SERVICE_ROLE_KEY, BLOSSOM_ENDPOINT, LOG_LEVEL (default INFO)
- [P1][SEC] Fail fast if required env missing.
- [P2][SEC] Redact secret values in logs.
- [P3][OPS] Add environment variable audit script (manual).

## 4. Nostr Logic
- [P1][SV] Pydantic NostrEvent.
- [P1][SV] POST /api/nostr/event: validate, verify signature (placeholder until implemented), persist.
- [P1][SV] GET /api/nostr/events: filter by pubkey, pagination.
- [P2][SV] Dedupe by id.
- [P3][SV] Optional relay lazy fetch fallback (time-bounded).

## 5. Media Handling (Optional)
- [P1][SV] media_service: size, MIME validation via env MEDIA_ALLOWED_MIME.
- [P2][SEC] SHA-256 checksum.
- [P3][SV] Future Supabase Storage path.

## 6. API Design
- [P1][SV] Response envelope: {"ok": bool, "data": <object|null>, "error": {code, message}|null}
- [P1][SV] Central exception mapping.
- [P2][SV] Cursor/offset pagination.
- [P3][SV] Rate limit stub (env RATE_LIMIT_MAX).

## 7. Performance & Limits
- [P1][SV] httpx timeouts (HTTP_CONNECT_TIMEOUT, HTTP_READ_TIMEOUT).
- [P2][SV] Retry count via HTTP_RETRY_MAX (GET only).
- [P2][SV] Lazy heavy imports.
- [P3][SV] Log request duration ms.

## 8. Logging & Observability
- [P1][SV] JSON logs: ts, level, msg, req_id, path, duration_ms.
- [P2][SV] Request ID middleware.
- [P3][SV] Health includes build env GIT_SHA.

## 9. Security
- [P1][SEC] Pydantic validation.
- [P1][SEC] Max payload size (MAX_EVENT_BYTES).
- [P2][SEC] RLS after schema confirm.
- [P2][SEC] Redact sensitive headers.
- [P3][SEC] Manual secret scan.

## 10. Manual Validation (No Automated Tests)
Checklist in docs/MANUAL_VALIDATION.md (placeholders only).

## 11. Tooling / Deployment
- [P1][OPS] vercel.json with headers.
- [P1][OPS] pyproject runtime vs dev extras.
- [P2][OPS] Optional local lint.
- [P3][OPS] Key rotation doc.

## 12. Frontend / Static
- [P2][FE] Static assets use relative /api/.
- [P2][FE] CSP header.
- [P3][FE] Accessibility pass.

## 13. Documentation
- [P1][OPS] README placeholders only.
- [P2][OPS] ADR serverless migration.
- [P3][OPS] Config reference.

## 14. Removed / Not Included
- Automated tests, coverage.
- Background workers, WebSockets.
- Docker build.
- Mock fixtures / seed data.

## Local Build Requirement
1. Export required env vars.
2. pip install -e .
3. uvicorn api.health:app (or any endpoint) start clean.
4. curl local endpoints.
5. Only then commit & push.

## Initial Execution Order
1. Structure + config + logging.
2. Migrations.
3. Nostr models + ingest/query.
4. Media (optional).
5. Rate limit stub.
6. Docs + manual checklist.

## Task Table (Excerpt)
| ID | Task | P | Status | Done Criteria (Local Build Verified) |
|----|------|---|--------|--------------------------------------|
| T1 | Directory restructure | P1 | TODO | Import tree loads cleanly |
| T2 | config.py env loader | P1 | TODO | Missing env blocks startup |
| T3 | Logging setup (JSON) | P1 | TODO | Structured logs local run |
| T4 | NostrEvent + signature verify | P1 | TODO | Invalid sig rejected |
| T5 | POST ingest endpoint | P1 | TODO | Stores event; envelope |
| T6 | GET events + pagination | P1 | TODO | Limit works |
| T7 | Supabase client wrapper | P1 | TODO | Env-derived base URL |
| T8 | Media service (optional) | P2 | TODO | MIME + size via env |
| T9 | Rate limit stub | P3 | TODO | 429 on exceed |
| T10 | Manual validation doc | P1 | TODO | Checklist present |
| T11 | ADR serverless migration | P2 | TODO | ADR file present |
| T12 | CSP + security headers | P2 | TODO | Headers live |

## Supabase Table DDL (migrations/001_init.sql)
```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS nostr_events (
  id text PRIMARY KEY,
  pubkey text NOT NULL,
  kind int NOT NULL,
  created_at timestamptz NOT NULL,
  tags jsonb NOT NULL DEFAULT '[]'::jsonb,
  content text NOT NULL,
  sig text NOT NULL,
  relay_received_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_events_pubkey_created_at ON nostr_events(pubkey, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_kind_created_at ON nostr_events(kind, created_at DESC);

CREATE TABLE IF NOT EXISTS media_objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  uploader_pubkey text NOT NULL,
  size_bytes int,
  mime_type text,
  checksum text,
  created_at timestamptz NOT NULL DEFAULT now()
);
-- ALTER TABLE nostr_events ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE media_objects ENABLE ROW LEVEL SECURITY;
```

## vercel.json (Routing Skeleton)
```json
{
  "version": 2,
  "functions": {
    "api/*.py": {
      "runtime": "python3.11",
      "maxDuration": 10
    }
  },
  "routes": [
    { "src": "/api/health", "dest": "/api/health.py" },
    { "src": "/api/nostr/events", "dest": "/api/nostr.py" },
    { "src": "/api/nostr/event", "dest": "/api/nostr.py" },
    { "src": "/api/media", "dest": "/api/media.py" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Content-Security-Policy", "value": "default-src 'self'; img-src 'self' data:;" }
      ]
    }
  ]
}
```

## Core Skeleton Files
(See PLAN.md; implement before marking tasks complete.)

## Manual Validation Checklist (Outline)
1. Env vars exported.
2. Local startup clean.
3. Health endpoint envelope.
4. Ingest event -> stored.
5. Query events -> respects limit.
6. Oversize -> 413.
7. Missing env -> startup fails.
8. Logs contain no secrets.
9. Headers present (curl -I).

## Placeholders Inventory
<SUPABASE_URL>, <SUPABASE_ANON_KEY>, <SERVICE_ROLE_KEY_IF_REQUIRED>, <NOSTR_RELAY_URL>, <BLOSSOM_ENDPOINT_OPTIONAL>, <OPTIONAL_INTEGER>, <SET_DURING_BUILD>, <COMMA_SEPARATED_LIST>, <PORT>

## Follow Up
Update status only after local build passes.