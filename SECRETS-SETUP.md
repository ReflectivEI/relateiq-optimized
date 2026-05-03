# Auto-Configured Secrets Guide

## ✅ Detected Existing Credentials

### Cloudflare
- ✅ **Account ID Found**: `59fea97fab54fbd4d4168ccaa1fa3410`
- ✅ **Authenticated User**: tonyabdelmalak@gmail.com
- ✅ **Token Permissions**: workers (write), workers_kv (write), d1 (write)

### GitHub
- ✅ **Authenticated**: ReflectivEI account
- ✅ **Repository**: relateiq-optimized

### Original Repo (relateiq-growth)
- ✅ **Existing Secrets**: CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN

---

## 🔐 Configure New Repository Secrets

Run the following commands to set up all secrets automatically:

```bash
# Set Cloudflare Account ID (verified)
gh secret set CLOUDFLARE_ACCOUNT_ID -b"59fea97fab54fbd4d4168ccaa1fa3410" -R ReflectivEI/relateiq-optimized

# For Cloudflare API Token, you have 2 options:

# OPTION A: Generate new token from web interface
# 1. Go to: https://dash.cloudflare.com/profile/api-tokens
# 2. Click "Create Token"
# 3. Select template: "Edit Cloudflare Workers"
# 4. Create and copy token
# 5. Run: gh secret set CLOUDFLARE_API_TOKEN -bYOUR_TOKEN_HERE -R ReflectivEI/relateiq-optimized

# OPTION B: Use existing token from original repo (if available)
# This requires extracting from environment or storing elsewhere
```

## 📋 Complete Secret Setup

Copy and paste this into your terminal (modify values as needed):

```bash
#!/bin/bash

# Cloudflare secrets (verified)
gh secret set CLOUDFLARE_ACCOUNT_ID \
  -b"59fea97fab54fbd4d4168ccaa1fa3410" \
  -R ReflectivEI/relateiq-optimized

# Vercel secrets (get from https://vercel.com)
# These are required for frontend deployment

# 1. Get VERCEL_TOKEN from: https://vercel.com/account/tokens
# 2. Get VERCEL_ORG_ID from: https://vercel.com/account/overview (Team ID or User ID)
# 3. Get VERCEL_SCOPE from your username
# Then run:

gh secret set VERCEL_TOKEN \
  -b"YOUR_VERCEL_TOKEN_HERE" \
  -R ReflectivEI/relateiq-optimized

gh secret set VERCEL_ORG_ID \
  -b"YOUR_ORG_ID_HERE" \
  -R ReflectivEI/relateiq-optimized

gh secret set VERCEL_SCOPE \
  -b"YOUR_USERNAME_HERE" \
  -R ReflectivEI/relateiq-optimized

# Cloudflare API Token (generate new if needed)
# Get from: https://dash.cloudflare.com/profile/api-tokens
# Template: "Edit Cloudflare Workers"

gh secret set CLOUDFLARE_API_TOKEN \
  -b"YOUR_CLOUDFLARE_API_TOKEN_HERE" \
  -R ReflectivEI/relateiq-optimized

# Verify all secrets are set
gh secret list -R ReflectivEI/relateiq-optimized
```

## 🎯 Quick Start (3 Steps)

### Step 1: Set Cloudflare Account ID (DONE)

```bash
gh secret set CLOUDFLARE_ACCOUNT_ID \
  -b"59fea97fab54fbd4d4168ccaa1fa3410" \
  -R ReflectivEI/relateiq-optimized
```

### Step 2: Get Vercel Secrets

1. Go to: https://vercel.com/account/tokens
2. Create a new token (or copy existing)
3. Copy the token value
4. Run:
```bash
gh secret set VERCEL_TOKEN -b"PASTE_TOKEN_HERE" -R ReflectivEI/relateiq-optimized
gh secret set VERCEL_ORG_ID -b"YOUR_ORG_ID" -R ReflectivEI/relateiq-optimized
gh secret set VERCEL_SCOPE -b"YOUR_USERNAME" -R ReflectivEI/relateiq-optimized
```

### Step 3: Get Cloudflare API Token

1. Go to: https://dash.cloudflare.com/profile/api-tokens
2. Create token (template: "Edit Cloudflare Workers")
3. Copy token
4. Run:
```bash
gh secret set CLOUDFLARE_API_TOKEN -b"PASTE_TOKEN_HERE" -R ReflectivEI/relateiq-optimized
```

### Step 4: Verify

```bash
gh secret list -R ReflectivEI/relateiq-optimized
```

Expected output:
```
NAME                     UPDATED         
CLOUDFLARE_ACCOUNT_ID    just now
CLOUDFLARE_API_TOKEN     just now
VERCEL_ORG_ID            just now
VERCEL_SCOPE             just now
VERCEL_TOKEN             just now
VERCEL_PROJECT_ID        just now
```

---

## ✨ After Secrets Are Set

All GitHub Actions workflows will automatically:
1. ✅ Build the app on every push
2. ✅ Deploy frontend to Vercel
3. ✅ Deploy API to Cloudflare Workers
4. ✅ Generate live URLs

Then visit:
- **Frontend**: https://relateiq-optimized.vercel.app
- **API**: https://relateiq-growth-worker.relay.app

---

**Next**: Run the setup commands above, then push a commit to main to trigger deployment!
