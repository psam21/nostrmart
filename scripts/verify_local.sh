#!/usr/bin/env bash
set -euo pipefail

echo "[verify] Checking required environment variables..."
REQ=(SUPABASE_URL SUPABASE_ANON_KEY NOSTR_RELAY_URL)
MISS=0
for v in "${REQ[@]}"; do
  if [[ -z "${!v:-}" ]]; then
    echo "[verify][ERROR] Missing $v" >&2
    MISS=1
  fi
done
if [[ $MISS -ne 0 ]]; then
  echo "[verify] Aborting due to missing env." >&2
  exit 2
fi

echo "[verify] Installing project (editable)..."
pip install -e . >/dev/null

echo "[verify] Import smoke test..."
python - <<'PY'
import importlib
mods=["app.core.config","app.core.logging","app.core.response","api.health"]
for m in mods:
    importlib.import_module(m)
print("IMPORT_OK")
PY

echo "[verify] Launching health endpoint..."
uvicorn api.health:app --host 127.0.0.1 --port 8020 &
PID=$!
sleep 2
CODE=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8020/api/health || true)
kill $PID >/dev/null 2>&1 || true

if [[ "$CODE" != "200" ]]; then
  echo "[verify][FAIL] Health endpoint status $CODE" >&2
  exit 3
fi
echo "[verify][SUCCESS] Local build & health endpoint OK"
