# Deployment Guide

## Prerequisites

1. **GitHub Account**: You need a GitHub account
2. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
3. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)

## Step 1: Create GitHub Repository

1. **Go to GitHub**: Visit [github.com](https://github.com) and sign in
2. **Create New Repository**: Click the "+" button → "New repository"
3. **Repository Settings**:
   - Name: `nostrmart` (or your preferred name)
   - Description: "Decentralized marketplace built on Nostr protocol"
   - Visibility: Public (required for free Vercel deployment)
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)

4. **Connect Local Repository**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/nostrmart.git
   git push -u origin main
   ```

## Step 2: Set Up Supabase

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose organization and enter project details
   - Wait for project to be created

2. **Get Project Credentials**:
   - Go to Settings → API
   - Copy the following:
     - `Project URL` (SUPABASE_URL)
     - `anon public` key (SUPABASE_ANON_KEY)
     - `service_role` key (SUPABASE_SERVICE_ROLE_KEY) - optional

3. **Run Database Migration**:
   - Go to SQL Editor in Supabase dashboard
   - Copy the contents of `migrations/001_init.sql`
   - Paste and run the SQL to create tables

## Step 3: Deploy to Vercel

1. **Connect to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Import your `nostrmart` repository

2. **Configure Project**:
   - Framework Preset: "Other"
   - Root Directory: `./` (default)
   - Build Command: Leave empty (not needed for serverless functions)
   - Output Directory: Leave empty

3. **Set Environment Variables**:
   In the Vercel project settings, add these environment variables:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   NOSTR_RELAY_URL=wss://your-relay.com
   ```
   
   Optional variables:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   BLOSSOM_ENDPOINT=https://blossom.server.com
   LOG_LEVEL=INFO
   ```

4. **Deploy**:
   - Click "Deploy"
   - Wait for deployment to complete
   - Your app will be available at `https://your-project.vercel.app`

## Step 4: Verify Deployment

1. **Test Health Endpoint**:
   ```bash
   curl https://your-project.vercel.app/api/health
   ```
   Expected response:
   ```json
   {"ok":true,"data":{"status":"ok","build":"unknown"},"error":null}
   ```

2. **Test Nostr Endpoints**:
   ```bash
   curl "https://your-project.vercel.app/api/nostr/events?limit=5"
   ```
   Should return events from your Supabase database

3. **Check Logs**:
   - Go to Vercel dashboard → Functions tab
   - Check for any errors in the logs

## Step 5: Set Up Custom Domain (Optional)

1. **Add Domain in Vercel**:
   - Go to Project Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

2. **Update Environment Variables**:
   - Update any hardcoded URLs to use your custom domain

## Troubleshooting

### Common Issues

1. **Environment Variables Not Set**:
   - Check Vercel project settings
   - Ensure all required variables are set
   - Redeploy after adding variables

2. **Database Connection Errors**:
   - Verify Supabase credentials
   - Check if tables exist (run migration)
   - Ensure Supabase project is active

3. **Function Timeout**:
   - Check Vercel function logs
   - Optimize database queries
   - Consider increasing timeout in vercel.json

4. **Import Errors**:
   - Ensure all dependencies are in pyproject.toml
   - Check Python version compatibility

### Debug Commands

```bash
# Test local build
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key"
export NOSTR_RELAY_URL="wss://your-relay.com"
uvicorn api.health:app --host 0.0.0.0 --port 8000

# Check logs
vercel logs your-project-url

# Test specific endpoint
curl -X POST https://your-project.vercel.app/api/nostr/event \
  -H "Content-Type: application/json" \
  -d '{"id":"test","pubkey":"test","kind":1,"created_at":1640995200,"tags":[],"content":"test","sig":"test"}'
```

## Next Steps

After successful deployment:

1. **Set up monitoring**: Configure alerts for function errors
2. **Performance optimization**: Monitor cold start times
3. **Security review**: Ensure all secrets are properly configured
4. **Frontend integration**: Connect your frontend to the API endpoints
5. **Authentication**: Implement Nostr authentication flow

## Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **FastAPI Docs**: [fastapi.tiangolo.com](https://fastapi.tiangolo.com)
