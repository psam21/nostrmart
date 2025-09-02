# Execution Plan (Tracking)

Reference Source: TODO.md (authoritative). Do not mark items Done until local build + manual validation pass.

## Meta
- Last Updated: <UPDATE_TIMESTAMP>
- Maintainer: <OWNER>
- Build Status (local): <UNKNOWN|CLEAN|BROKEN>
- Deploy Status (vercel): <UNKNOWN|LIVE|ROLLBACK_REQUIRED>

## Global Constraints
- No hard-coded secrets/endpoints.
- No mock data.
- Local build & manual checks before push.
- Placeholders only (<LIKE_THIS>).
- No premature success summaries.

## Phases
1. Foundation (Structure, Config, Logging)
2. Data Layer (Supabase schema + adapter)
3. Core Features (Nostr ingest/query)
4. Extended (Media optional, Rate limiting)
5. Harden & Docs (Checklist, ADR, headers)

## Kanban
### Backlog
T4 T5 T6 T7 T8 T9 T10 T11 T12
### In Progress
T1 T2 T3
### Review
(none)
### Done
(none)

## Detailed Task Table
| ID | Task | Phase | Priority | Status | Local Build Verified | Manual Validation Done | Notes / Next Step |
|----|------|-------|----------|--------|----------------------|------------------------|-------------------|
| T1 | Directory restructure | 1 | P1 | IN_PROGRESS | NO | NO | Create folders & stubs |
| T2 | config.py env loader | 1 | P1 | IN_PROGRESS | NO | NO | Fail fast on missing env |
| T3 | Logging setup (JSON) | 1 | P1 | IN_PROGRESS | NO | NO | Add req_id integration |
| T4 | NostrEvent model + signature verify | 3 | P1 | BACKLOG | NO | NO | Implement verification |
| T5 | POST ingest endpoint | 3 | P1 | BACKLOG | NO | NO | Envelope + size check |
| T6 | GET events endpoint + pagination | 3 | P1 | BACKLOG | NO | NO | Limit enforcement |
| T7 | Supabase client wrapper | 2 | P1 | BACKLOG | NO | NO | Timeout + retry via env |
| T8 | Media service (optional) | 4 | P2 | BACKLOG | NO | NO | MIME allow list env |
| T9 | Rate limit stub (env) | 4 | P3 | BACKLOG | NO | NO | 429 envelope |
| T10 | Manual validation doc | 5 | P1 | BACKLOG | NO | NO | docs/MANUAL_VALIDATION.md |
| T11 | ADR: serverless migration | 5 | P2 | BACKLOG | NO | NO | docs/adr/0001-serverless.md |
| T12 | CSP + security headers | 5 | P2 | BACKLOG | NO | NO | vercel.json headers set |

## Progress Update Log
- <YYYY-MM-DDTHH:MMZ> INIT plan created.
- <YYYY-MM-DDTHH:MMZ> [T1][T2][T3] Scaffolding files created (config/logging/health, vercel.json, manual validation doc, env example). Imports pending local build verification.
- <YYYY-MM-DDTHH:MMZ> [T1] Slimmed dependencies (removed Flask/SQLAlchemy stack) to align with serverless FastAPI design; legacy stack moved to optional extra.

Log entry template:
- <TIMESTAMP> [T<ID>] <ACTION> <NOTE>

## Risks
| Risk | Impact | Mitigation | Owner | Status |
|------|--------|------------|-------|--------|
| Missing env vars | High | Pre-push local run | <OWNER> | OPEN |
| Signature verification delay | Medium | Stub then implement | <OWNER> | OPEN |
| Rate limit uncertainty | Low | Env-disabled default | <OWNER> | OPEN |

## Next Immediate Actions
1. Execute T1 locally.
2. Implement T2 (fail-fast config).
3. Implement T3 (JSON logging).

## Definitions
Local Build Clean = install + import api/*.py no exceptions.
Manual Validation Done = Checklist items executed & passed.

## Update Procedure
1. Implement task locally.
2. Local build & manual curls succeed.
3. Update PLAN.md (status, log entry).
4. Commit & push.

## Placeholders Inventory
<SUPABASE_URL>, <SUPABASE_ANON_KEY>, <SERVICE_ROLE_KEY_IF_REQUIRED>, <NOSTR_RELAY_URL>, <BLOSSOM_ENDPOINT_OPTIONAL>, <OPTIONAL_INTEGER>, <SET_DURING_BUILD>, <COMMA_SEPARATED_LIST>, <PORT>, <OWNER>, <UPDATE_TIMESTAMP>

## Verification Commands
pip install -e .
uvicorn api.health:app --host 127.0.0.1 --port <PORT>
curl -s http://127.0.0.1:<PORT>/api/health

## Pending Decisions
| Topic | Decision Needed By | Owner | Notes |
|-------|--------------------|-------|-------|
| Signature algorithm lib | Before T4 | <OWNER> | Keep minimal dep |
| Rate limit approach | Before T9 | <OWNER> | In-memory hash |

## Manual Validation Doc
Create docs/MANUAL_VALIDATION.md referencing TODO steps (no data examples).
