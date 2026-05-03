# Deployment Setup Guide

## ✅ Current Status

- ✅ Repository created: https://github.com/ReflectivEI/relateiq-optimized
- ✅ Code pushed to main branch
- ✅ GitHub Actions workflows configured
- ✅ Vercel configuration created
- ✅ Cloudflare Worker configuration updated
- 🟡 GitHub Secrets need to be configured

## 🔐 Configure GitHub Secrets

Add these secrets to your GitHub repository for automated deployment:

### Steps:
1. Go to: https://github.com/ReflectivEI/relateiq-optimized/settings/secrets/actions
2. Click "New repository secret"
3. Add each secret below:

### Vercel Secrets

#### `VERCEL_TOKEN`
- Get from: https://vercel.com/account/tokens
- Create a new token with default settings
- Value: `<your-vercel-token>`

#### `VERCEL_ORG_ID`
- Get from: https://vercel.com/account/settings
- Find your "Team ID" or "Org ID"
- Value: `<your-org-id>`

#### `VERCEL_PROJECT_ID`
- After first deployment: https://vercel.com/dashboard
- Click on your project → Settings → General
- Find "Project ID"
- Value: `<your-project-id>`

#### `VERCEL_SCOPE`
- Usually your username or organization name
- Value: `<your-vercel-username>`

### Cloudflare Secrets

#### `CLOUDFLARE_API_TOKEN`
- Get from: https://dash.cloudflare.com/profile/api-tokens
- Create a new token with "Edit Cloudflare Workers" permission
- Value: `<your-api-token>`

#### `CLOUDFLARE_ACCOUNT_ID`
- Get from: https://dash.cloudflare.com/
- Bottom left corner, click "Manage Account"
- Find "Account ID" in the sidebar
- Value: `<your-account-id>`

## 🚀 Deploy Steps

### Step 1: Set Up Vercel Project

```bash
# Option A: Link existing project
vercel link

# Option B: Create new project
vercel --prod --name relateiq-optimized
```

This gives you `VERCEL_PROJECT_ID`.

### Step 2: Add Secrets to GitHub

Go to Settings → Secrets and add:
- ✅ VERCEL_TOKEN
- ✅ VERCEL_ORG_ID
- ✅ VERCEL_PROJECT_ID
- ✅ VERCEL_SCOPE
- ✅ CLOUDFLARE_API_TOKEN
- ✅ CLOUDFLARE_ACCOUNT_ID

### Step 3: Trigger Workflows

Push a commit to main to trigger all workflows:

```bash
git log --oneline -1
# Latest commit will trigger:
# 1. Build & Test
# 2. Deploy to Vercel (frontend)
# 3. Deploy to Cloudflare Worker (API)
```

### Step 4: Check Deployment Status

**GitHub Actions:**
- https://github.com/ReflectivEI/relateiq-optimized/actions

**Vercel:**
- https://vercel.com/dashboard/relateiq-optimized

**Cloudflare Workers:**
- https://dash.cloudflare.com/?to=/:account/workers

## 📊 Workflow Status

### Build & Test (`.github/workflows/build.yml`)
Triggers on: `push` to `main` or `system-architecture`

```
✓ Node 18.x & 20.x matrix
✓ Install dependencies
✓ Type checking
✓ Build with Vite
✓ Verify system components
✓ Upload artifacts
```

**Status**: Configured ✅

### Deploy Frontend (`.github/workflows/deploy.yml`)
Triggers on: `push` to `main`

```
✓ Build application
✓ Deploy to Vercel (production)
✓ Update preview environment
```

**Status**: Needs VERCEL secrets 🔐

### Deploy Worker (`.github/workflows/deploy-worker.yml`)
Triggers on: `push` to `main` + changes to `relate-iq-growth-worker/`

```
✓ Build worker
✓ Publish to Cloudflare
✓ Update KV namespaces
```

**Status**: Needs CLOUDFLARE secrets 🔐

## 🔗 Deployment URLs

After secrets are configured and workflows run:

- **Frontend**: `https://relateiq-optimized.vercel.app`
- **API**: `https://relateiq-growth-worker.relay.app`
- **Health Check**: `https://relateiq-growth-worker.relay.app/api/health`

## 🧪 Test Deployment

After all secrets are added, trigger a build:

```bash
git add . && git commit --allow-empty -m "Trigger deployment workflows"
git push origin main
```

Watch workflows at: https://github.com/ReflectivEI/relateiq-optimized/actions

## ✨ Features After Deployment

Once deployed, you'll have:

✅ **Continuous Integration**
- Auto-build on every push
- TypeScript validation
- Component verification

✅ **Continuous Deployment**
- Auto-deploy to Vercel on main branch push
- Auto-deploy Worker to Cloudflare
- Zero-downtime updates

✅ **Decision Engine API**
- POST /api/decisions/analyze
- GET /api/decisions/:pairId
- DELETE /api/decisions/:pairId
- GET /api/health

✅ **Frontend App**
- React 18 + Vite
- System architecture components
- Real-time updates from Decision Engine API

## 🛟 Troubleshooting

### Workflows not running
- Check: Settings → Actions → "Actions permissions"
- Enable: "Allow all actions and reusable workflows"

### Vercel deployment fails
- Check `VERCEL_PROJECT_ID` is correct
- Run `vercel link` to get correct ID

### Worker deployment fails
- Check `CLOUDFLARE_ACCOUNT_ID` format
- Verify API token has "Edit Workers" permission

### API endpoint unreachable
- Check Worker deployment status in Cloudflare dashboard
- Verify KV namespace is created: `DECISION_CACHE`

## 📝 Next Steps

1. ✅ Create GitHub secrets
2. ✅ Set up Vercel project
3. ✅ Verify all workflows pass
4. ✅ Test live URLs
5. ⏭️ Integrate Decision Engine into UI
6. ⏭️ Add outcome tracking
7. ⏭️ Build AI Orchestration Bus

---

**Need help?** Check GitHub Actions logs at: https://github.com/ReflectivEI/relateiq-optimized/actions
