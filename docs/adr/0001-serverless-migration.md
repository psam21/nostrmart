# ADR-0001: Serverless Migration to Vercel + Supabase

## Status
Accepted

## Context
The NostrMart application was originally built as a traditional Flask web application with SQLAlchemy ORM and persistent database connections. This architecture is incompatible with serverless deployment platforms like Vercel, which require stateless functions and cannot maintain persistent connections.

## Decision
Migrate the application to a serverless architecture using:
- **Vercel** for hosting Python serverless functions
- **FastAPI** instead of Flask for better async support
- **Supabase** (PostgreSQL via REST API) instead of direct database connections
- **Stateless authentication** instead of server-side sessions

## Rationale

### Why Serverless?
1. **Cost Efficiency**: Pay only for actual usage
2. **Automatic Scaling**: Handle traffic spikes without manual intervention
3. **Reduced Maintenance**: No server management required
4. **Global Distribution**: Edge functions for better performance

### Why Vercel?
1. **Excellent Python Support**: Native Python 3.11 runtime
2. **Easy Deployment**: Git-based continuous deployment
3. **Built-in Security**: Automatic HTTPS, security headers
4. **Performance**: Edge functions and CDN integration

### Why FastAPI?
1. **Async Support**: Better performance for I/O operations
2. **Type Safety**: Built-in Pydantic validation
3. **Modern Standards**: OpenAPI, JSON Schema support
4. **Serverless Friendly**: Designed for stateless operations

### Why Supabase?
1. **PostgreSQL**: Robust, feature-rich database
2. **REST API**: No persistent connections needed
3. **Real-time Features**: Built-in subscriptions
4. **Authentication**: Integrated auth system (future use)

## Consequences

### Positive
- **Scalability**: Automatic scaling based on demand
- **Reliability**: No single points of failure
- **Cost**: Reduced infrastructure costs
- **Performance**: Edge deployment for global users
- **Security**: Built-in security features

### Negative
- **Cold Starts**: Initial request latency
- **Stateless**: No server-side sessions
- **Complexity**: More moving parts
- **Debugging**: Harder to debug distributed system
- **Vendor Lock-in**: Dependent on Vercel/Supabase

### Risks
- **Cold Start Latency**: First request after idle period
- **Function Timeouts**: 10-second limit on Vercel
- **Database Latency**: REST API calls vs direct connections
- **Complexity**: More services to manage

## Mitigation Strategies

### Cold Start Mitigation
- Keep functions warm with health checks
- Optimize imports and initialization
- Use connection pooling where possible

### Timeout Mitigation
- Optimize database queries
- Implement proper pagination
- Use async operations efficiently

### Complexity Mitigation
- Comprehensive logging and monitoring
- Clear error handling and responses
- Thorough testing and validation

## Implementation Details

### Architecture Changes
1. **API Structure**: Move from Flask routes to FastAPI endpoints in `/api/` directory
2. **Database**: Replace SQLAlchemy with Supabase REST API client
3. **Authentication**: Implement stateless JWT-based auth
4. **Sessions**: Remove server-side sessions, use client-side storage

### File Structure
```
api/
  health.py          # Health check endpoint
  nostr.py           # Nostr event endpoints
  media.py           # Media upload endpoints
app/
  core/              # Core utilities
    config.py        # Environment configuration
    logging.py       # JSON logging
    response.py      # Response envelope
  models/            # Pydantic models
    nostr.py         # Nostr event models
  services/          # Business logic
    nostr_service.py # Nostr event handling
    media_service.py # Media handling
  adapters/          # External service clients
    supabase_client.py # Supabase REST client
migrations/          # Database schema
docs/               # Documentation
```

### Configuration
- All secrets via environment variables
- Fail-fast validation for required config
- No hardcoded values in code

### Error Handling
- Consistent error envelope format
- Proper HTTP status codes
- No stack traces in production

## Alternatives Considered

### 1. Keep Flask + Traditional Hosting
**Rejected**: Incompatible with serverless, higher maintenance costs

### 2. AWS Lambda + RDS
**Rejected**: More complex setup, higher learning curve

### 3. Railway/Render
**Rejected**: Less mature serverless support, higher costs

### 4. Supabase Edge Functions
**Rejected**: Limited to Supabase ecosystem, less flexibility

## Monitoring and Metrics

### Key Metrics
- Function execution time
- Cold start frequency
- Database query performance
- Error rates by endpoint
- Memory usage

### Logging
- Structured JSON logs
- Request ID tracking
- Performance timing
- Error context

## Future Considerations

### Potential Improvements
1. **Caching**: Redis for frequently accessed data
2. **CDN**: Static asset optimization
3. **Monitoring**: APM integration
4. **Testing**: Automated test suite
5. **CI/CD**: GitHub Actions integration

### Migration Path
1. **Phase 1**: Core API endpoints (✅ Complete)
2. **Phase 2**: Authentication system
3. **Phase 3**: Frontend integration
4. **Phase 4**: Performance optimization
5. **Phase 5**: Advanced features

## References
- [Vercel Python Runtime](https://vercel.com/docs/functions/serverless-functions/runtimes/python)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Supabase REST API](https://supabase.com/docs/guides/api)
- [Serverless Best Practices](https://vercel.com/docs/functions/serverless-functions/best-practices)
