# NostrMart - Serverless Nostr Marketplace

A decentralized marketplace built on the Nostr protocol, deployed on Vercel with Supabase backend.

## Architecture

- **Frontend**: Static HTML/CSS/JS (served by Vercel)
- **Backend**: Python serverless functions (FastAPI on Vercel)
- **Database**: Supabase (PostgreSQL via REST API)
- **Authentication**: Nostr protocol (NIP-07 browser extensions)
- **Media Storage**: Blossom protocol (decentralized)

## Quick Start

### Prerequisites

1. **Supabase Project**: Create a project at [supabase.com](https://supabase.com)
2. **Environment Variables**: Set up the required environment variables
3. **Database Schema**: Run the migration to create tables

### Environment Variables

Required environment variables:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
NOSTR_RELAY_URL=wss://your-relay.com
```

Optional environment variables:

```bash
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
BLOSSOM_ENDPOINT=https://blossom.server.com
LOG_LEVEL=INFO
HTTP_CONNECT_TIMEOUT=1.0
HTTP_READ_TIMEOUT=2.0
HTTP_RETRY_MAX=2
MAX_EVENT_BYTES=65536
RATE_LIMIT_MAX=1000
MEDIA_ALLOWED_MIME=image/jpeg,image/png,image/gif
```

### Database Setup

1. Run the migration in your Supabase SQL editor:

```sql
-- Copy contents from migrations/001_init.sql
```

### Local Development

1. **Install Dependencies**:
   ```bash
   pip install -e .
   ```

2. **Set Environment Variables**:
   ```bash
   export SUPABASE_URL="https://your-project.supabase.co"
   export SUPABASE_ANON_KEY="your-anon-key"
   export NOSTR_RELAY_URL="wss://your-relay.com"
   ```

3. **Test Health Endpoint**:
   ```bash
   uvicorn api.health:app --host 0.0.0.0 --port 8000
   curl http://localhost:8000/api/health
   ```

4. **Test Nostr Endpoints**:
   ```bash
   uvicorn api.nostr:app --host 0.0.0.0 --port 8001
   curl "http://localhost:8001/api/nostr/events?limit=5"
   ```

### Deployment to Vercel

1. **Connect Repository**: Link your GitHub repository to Vercel

2. **Set Environment Variables**: Add all required environment variables in Vercel dashboard

3. **Deploy**: Push to your main branch - Vercel will automatically deploy

4. **Verify Deployment**: Check that all endpoints respond correctly

## API Endpoints

### Health Check
- `GET /api/health` - Returns service status

### Nostr Events
- `POST /api/nostr/event` - Create a new Nostr event
- `GET /api/nostr/events` - Get events with optional filtering

### Media
- `POST /api/media` - Upload media file
- `GET /api/media/{id}` - Get media information

## Project Structure

```
api/                    # Serverless function endpoints
  health.py            # Health check endpoint
  nostr.py             # Nostr event endpoints
  media.py             # Media upload endpoints

app/                   # Application core
  core/                # Core utilities
    config.py          # Environment configuration
    logging.py         # JSON logging setup
    response.py        # Response envelope format
  models/              # Pydantic data models
    nostr.py           # Nostr event models
  services/            # Business logic
    nostr_service.py   # Nostr event handling
    media_service.py   # Media handling
  adapters/            # External service clients
    supabase_client.py # Supabase REST client

migrations/            # Database schema
  001_init.sql        # Initial table creation

docs/                  # Documentation
  MANUAL_VALIDATION.md # Manual testing checklist
  adr/                 # Architecture decision records

static/                # Static assets
templates/             # HTML templates
```

## Security Features

- **Environment Variable Validation**: Fails fast on missing required config
- **Input Validation**: Pydantic models validate all inputs
- **Security Headers**: CSP, X-Frame-Options, etc. configured in vercel.json
- **No Secrets in Code**: All sensitive data via environment variables
- **Request ID Tracking**: All requests have unique IDs for debugging

## Manual Validation

See [docs/MANUAL_VALIDATION.md](docs/MANUAL_VALIDATION.md) for a comprehensive testing checklist.

## Architecture Decision Records

See [docs/adr/0001-serverless-migration.md](docs/adr/0001-serverless-migration.md) for details on the serverless migration.

## Development Status

✅ **Completed**:
- Serverless architecture setup
- FastAPI endpoints
- Supabase integration
- Pydantic models and validation
- JSON logging with request IDs
- Security headers and configuration
- Database migrations
- Manual validation documentation

🚧 **In Progress**:
- Frontend integration
- Authentication system
- Media upload implementation

📋 **Planned**:
- Rate limiting
- Performance optimization
- Advanced Nostr features
- Payment integration

## Contributing

1. Follow the manual validation checklist before submitting PRs
2. Ensure all environment variables are properly configured
3. Test locally before deploying
4. Update documentation as needed

## License

[Add your license here]
