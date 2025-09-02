# Manual Validation Checklist

This document provides a step-by-step checklist for manually validating the NostrMart serverless deployment. All items must be verified locally before deployment.

## Prerequisites

1. **Environment Variables Set**
   ```bash
   export SUPABASE_URL="<SUPABASE_URL>"
   export SUPABASE_ANON_KEY="<SUPABASE_ANON_KEY>"
   export NOSTR_RELAY_URL="<NOSTR_RELAY_URL>"
   # Optional:
   export SUPABASE_SERVICE_ROLE_KEY="<SERVICE_ROLE_KEY_IF_REQUIRED>"
   export BLOSSOM_ENDPOINT="<BLOSSOM_ENDPOINT_OPTIONAL>"
   export LOG_LEVEL="INFO"
   ```

2. **Dependencies Installed**
   ```bash
   pip install -e .
   ```

## Local Build Validation

### 1. Import Test
- [ ] All modules import without errors
- [ ] No missing dependencies
- [ ] Configuration loads successfully

**Command:**
```bash
python -c "from app.core.config import get_settings; print('Config loaded:', get_settings())"
```

### 2. Health Endpoint Test
- [ ] Health endpoint starts without errors
- [ ] Returns proper envelope format
- [ ] Includes build information

**Command:**
```bash
uvicorn api.health:app --host 0.0.0.0 --port 8000
curl http://localhost:8000/api/health
```

**Expected Response:**
```json
{
  "ok": true,
  "data": {
    "status": "ok",
    "build": "unknown"
  },
  "error": null
}
```

### 3. Nostr Endpoints Test
- [ ] Nostr API starts without errors
- [ ] POST endpoint accepts valid events
- [ ] GET endpoint returns events with pagination
- [ ] Validation rejects invalid events

**Commands:**
```bash
# Start nostr API
uvicorn api.nostr:app --host 0.0.0.0 --port 8001

# Test POST endpoint
curl -X POST http://localhost:8001/api/nostr/event \
  -H "Content-Type: application/json" \
  -d '{
    "id": "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "pubkey": "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
    "kind": 1,
    "created_at": 1640995200,
    "tags": [],
    "content": "Hello, NostrMart!",
    "sig": "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
  }'

# Test GET endpoint
curl "http://localhost:8001/api/nostr/events?limit=10"
```

### 4. Media Endpoints Test
- [ ] Media API starts without errors
- [ ] File upload validation works
- [ ] MIME type restrictions enforced
- [ ] File size limits enforced

**Commands:**
```bash
# Start media API
uvicorn api.media:app --host 0.0.0.0 --port 8002

# Test file upload (create a test file first)
echo "test content" > test.txt
curl -X POST http://localhost:8002/api/media \
  -F "file=@test.txt" \
  -F "uploader_pubkey=abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
```

## Database Validation

### 1. Supabase Connection
- [ ] Can connect to Supabase
- [ ] Tables exist and are accessible
- [ ] Indexes are created

**Command:**
```bash
python -c "
from app.adapters.supabase_client import SupabaseClient
from app.core.config import get_settings
import asyncio

async def test():
    settings = get_settings()
    client = SupabaseClient(settings)
    events = await client.get_nostr_events(limit=1)
    print('Database connection successful:', len(events))

asyncio.run(test())
"
```

### 2. Data Persistence
- [ ] Events are stored correctly
- [ ] Queries return expected results
- [ ] Pagination works
- [ ] Filtering works

## Security Validation

### 1. Environment Variable Security
- [ ] No secrets in code
- [ ] Missing required env vars cause startup failure
- [ ] Logs don't contain secrets

**Command:**
```bash
# Test missing env vars
unset SUPABASE_URL
python -c "from app.core.config import get_settings; get_settings()"
# Should fail with validation error
```

### 2. Input Validation
- [ ] Invalid hex strings rejected
- [ ] Oversized payloads rejected
- [ ] Malformed JSON rejected
- [ ] SQL injection attempts blocked

### 3. Headers Validation
- [ ] Security headers present
- [ ] CSP header configured
- [ ] CORS properly configured

**Command:**
```bash
curl -I http://localhost:8000/api/health
# Check for security headers
```

## Performance Validation

### 1. Response Times
- [ ] Health endpoint < 100ms
- [ ] Event creation < 500ms
- [ ] Event queries < 200ms
- [ ] File uploads < 2s (for small files)

### 2. Error Handling
- [ ] 400 errors for validation failures
- [ ] 500 errors for server issues
- [ ] Proper error envelopes returned
- [ ] No stack traces in responses

## Logging Validation

### 1. Log Format
- [ ] JSON format logs
- [ ] Request IDs present
- [ ] No secrets in logs
- [ ] Appropriate log levels

**Command:**
```bash
# Check log format
uvicorn api.health:app --log-level info 2>&1 | head -5
```

## Deployment Readiness

### 1. Vercel Configuration
- [ ] vercel.json is valid
- [ ] Routes are properly configured
- [ ] Headers are set correctly
- [ ] Function timeouts are appropriate

### 2. Dependencies
- [ ] All dependencies in pyproject.toml
- [ ] No missing imports
- [ ] Version constraints are appropriate

## Final Checklist

Before marking as complete:
- [ ] All local tests pass
- [ ] No import errors
- [ ] No startup exceptions
- [ ] All endpoints respond correctly
- [ ] Database operations work
- [ ] Security validations pass
- [ ] Performance is acceptable
- [ ] Logs are properly formatted

## Troubleshooting

### Common Issues

1. **Import Errors**: Check all dependencies are installed
2. **Database Connection**: Verify Supabase credentials and network access
3. **Validation Errors**: Check environment variables are set correctly
4. **Timeout Issues**: Verify network connectivity and Supabase status

### Debug Commands

```bash
# Check Python path
python -c "import sys; print(sys.path)"

# Check installed packages
pip list | grep -E "(fastapi|pydantic|httpx)"

# Test network connectivity
curl -I https://your-supabase-url.supabase.co
```

## Success Criteria

The deployment is ready when:
- All manual validation steps pass
- Local build runs without errors
- All endpoints return proper responses
- Database operations work correctly
- Security measures are in place
- Performance is acceptable