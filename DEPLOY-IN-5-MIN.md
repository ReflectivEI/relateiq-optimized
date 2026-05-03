# ⚡ 5-Minute Deploy

Follow these exact steps to get your app live:

## Step 1: Deploy to Vercel (2 minutes)

1. Open: https://vercel.com/new
2. Click **"Import Git Repository"**
3. Paste: `https://github.com/ReflectivEI/relateiq-optimized`
4. Click **"Import"**
5. Vercel auto-detects Vite → Click **"Deploy"**
6. ✅ Wait 1-2 minutes
7. Copy deployment URL (e.g., `relateiq-optimized-xxxxx.vercel.app`)

## Step 2: Get Vercel Secrets (2 minutes)

1. Go to: https://vercel.com/account/tokens
2. Click **"Create Token"**
3. Name: `GitHub Actions`
4. Expiration: 7 days (or longer)
5. Click **"Create"**
6. Copy token (starts with `ver_`)

Then from your Vercel project:
1. Go to: https://vercel.com/dashboard
2. Click your project
3. Settings → General
4. Copy **"Project ID"** (gray ID at top)
5. Go back to account: https://vercel.com/account/overview
6. Find **"User ID"** or **"Team ID"**

## Step 3: Add GitHub Secrets (1 minute)

1. Go to: https://github.com/ReflectivEI/relateiq-optimized/settings/secrets/actions
2. Click **"New repository secret"**
3. Add these (one at a time):

```
Name: VERCEL_TOKEN
Value: ver_xxxxxxxxxxxxxxxxxxxx

Name: VERCEL_ORG_ID
Value: <your-user-id-or-team-id>

Name: VERCEL_PROJECT_ID
Value: <your-project-id-from-dashboard>

Name: VERCEL_SCOPE
Value: <your-username>
```

## Step 4: Cloudflare (Optional - for API)

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Click **"Create Token"**
3. Select **"Edit Cloudflare Workers"** template
4. Copy token
5. Add to GitHub:
   - `CLOUDFLARE_API_TOKEN` = token value
   - `CLOUDFLARE_ACCOUNT_ID` = from https://dash.cloudflare.com/ (bottom left)

## Step 5: Test (Already done!)

1. Open: https://github.com/ReflectivEI/relateiq-optimized/actions
2. Watch workflows run
3. ✅ Frontend should now deploy automatically

---

**Result:**
- ✅ Frontend: https://relateiq-optimized.vercel.app (auto-updates on each push)
- ✅ API: https://relateiq-growth-worker.relay.app (when secrets added)

Done! 🎉
