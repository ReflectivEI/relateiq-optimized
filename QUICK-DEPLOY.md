# Quick Manual Deployment Guide

## Status: Deployments Need Manual Setup

The automated GitHub workflows are ready, but need to be connected to Vercel and Cloudflare accounts.

## 🚀 Deploy to Vercel (Frontend)

### Option 1: Via GitHub (Recommended)

1. Go to: **https://vercel.com/new**
2. Click "Import Git Repository"
3. Select: `github.com/ReflectivEI/relateiq-optimized`
4. Configure:
   - **Project Name**: `relateiq-optimized`
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Click "Deploy"
6. Get your **Project ID** from: Settings → General
7. Add to GitHub Secrets (Settings → Secrets → Actions):
   - `VERCEL_PROJECT_ID` = your project ID
   - `VERCEL_ORG_ID` = your org/account ID (from profile)
   - `VERCEL_TOKEN` = from https://vercel.com/account/tokens
   - `VERCEL_SCOPE` = your username

### Option 2: Via CLI (Manual)

```bash
cd /Users/anthonyabdelmalak/dev/relateiq-optimized

# Link Vercel account
vercel login

# Link project to Vercel
vercel link

# Deploy to production
vercel --prod
```

## 🔗 Deploy to Cloudflare (Worker API)

### Prerequisites

1. Go to: https://dash.cloudflare.com/
2. Get your **Account ID** (bottom left)
3. Create **API Token**: https://dash.cloudflare.com/profile/api-tokens
   - Permissions: "Edit Cloudflare Workers"
   - Copy the token
4. Add to GitHub Secrets:
   - `CLOUDFLARE_API_TOKEN` = your API token
   - `CLOUDFLARE_ACCOUNT_ID` = your account ID

### Deploy Worker

```bash
cd /Users/anthonyabdelmalak/dev/relateiq-optimized/relate-iq-growth-worker

# Link Cloudflare account
wrangler login

# Deploy worker
wrangler publish --env production
```

## ✅ After Both Deployments

URLs will be:
- **Frontend**: https://relateiq-optimized.vercel.app
- **API**: https://relateiq-growth-worker.relay.app

## 🔄 Automatic Deployment After Setup

Once GitHub Secrets are configured, pushing to main will:

```bash
git add .
git commit -m "Trigger deployment"
git push origin main
```

→ Automatically deploys to **both Vercel and Cloudflare** 🚀

## 📊 Check Workflow Status

After first deployment, monitor at:
- GitHub Actions: https://github.com/ReflectivEI/relateiq-optimized/actions
- Vercel Dashboard: https://vercel.com/dashboard
- Cloudflare Dashboard: https://dash.cloudflare.com/

---

**TL;DR**: Link project on Vercel, add secrets to GitHub, then all future pushes auto-deploy.
