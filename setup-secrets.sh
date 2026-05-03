#!/bin/bash

# Auto-Configure GitHub Secrets for relateiq-optimized
# Run this script to set up all deployment secrets

set -e

REPO="ReflectivEI/relateiq-optimized"

echo "🔐 Setting up GitHub Secrets for relateiq-optimized"
echo "════════════════════════════════════════════════════"
echo ""

# Step 1: Cloudflare Account ID (already verified)
echo "✅ Step 1: Cloudflare Account ID"
CLOUDFLARE_ACCOUNT_ID="59fea97fab54fbd4d4168ccaa1fa3410"
gh secret set CLOUDFLARE_ACCOUNT_ID -b"$CLOUDFLARE_ACCOUNT_ID" -R "$REPO"
echo "   ✓ Set CLOUDFLARE_ACCOUNT_ID"
echo ""

# Step 2: Cloudflare API Token
echo "📋 Step 2: Cloudflare API Token"
echo "   Go to: https://dash.cloudflare.com/profile/api-tokens"
echo "   1. Click 'Create Token'"
echo "   2. Select 'Edit Cloudflare Workers' template"
echo "   3. Click 'Continue to summary'"
echo "   4. Click 'Create Token'"
echo "   5. Copy the token"
echo ""
read -p "Paste your Cloudflare API Token: " CLOUDFLARE_API_TOKEN
if [ -n "$CLOUDFLARE_API_TOKEN" ]; then
  gh secret set CLOUDFLARE_API_TOKEN -b"$CLOUDFLARE_API_TOKEN" -R "$REPO"
  echo "   ✓ Set CLOUDFLARE_API_TOKEN"
else
  echo "   ⚠ Skipped CLOUDFLARE_API_TOKEN"
fi
echo ""

# Step 3: Vercel Token
echo "📋 Step 3: Vercel API Token"
echo "   Go to: https://vercel.com/account/tokens"
echo "   1. Click 'Create' (new token)"
echo "   2. Give it a name (e.g., 'GitHub Actions')"
echo "   3. Expiration: 7 days or longer"
echo "   4. Click 'Create'"
echo "   5. Copy the token (starts with 'ver_')"
echo ""
read -p "Paste your Vercel Token: " VERCEL_TOKEN
if [ -n "$VERCEL_TOKEN" ]; then
  gh secret set VERCEL_TOKEN -b"$VERCEL_TOKEN" -R "$REPO"
  echo "   ✓ Set VERCEL_TOKEN"
else
  echo "   ⚠ Skipped VERCEL_TOKEN"
fi
echo ""

# Step 4: Vercel Org ID
echo "📋 Step 4: Vercel Organization ID"
echo "   Go to: https://vercel.com/account/overview"
echo "   Look for 'User ID' or 'Team ID' (gray text)"
echo ""
read -p "Paste your Vercel Org ID: " VERCEL_ORG_ID
if [ -n "$VERCEL_ORG_ID" ]; then
  gh secret set VERCEL_ORG_ID -b"$VERCEL_ORG_ID" -R "$REPO"
  echo "   ✓ Set VERCEL_ORG_ID"
else
  echo "   ⚠ Skipped VERCEL_ORG_ID"
fi
echo ""

# Step 5: Vercel Scope (username)
echo "📋 Step 5: Vercel Username/Scope"
echo "   Go to: https://vercel.com/account/settings"
echo "   Look for your username in the URL or profile"
echo ""
read -p "Paste your Vercel username: " VERCEL_SCOPE
if [ -n "$VERCEL_SCOPE" ]; then
  gh secret set VERCEL_SCOPE -b"$VERCEL_SCOPE" -R "$REPO"
  echo "   ✓ Set VERCEL_SCOPE"
else
  echo "   ⚠ Skipped VERCEL_SCOPE"
fi
echo ""

# Step 6: Vercel Project ID
echo "📋 Step 6: Vercel Project ID (optional)"
echo "   This will be auto-generated after first deploy"
echo "   For now, you can skip this"
echo ""
read -p "Paste your Vercel Project ID (or press Enter to skip): " VERCEL_PROJECT_ID
if [ -n "$VERCEL_PROJECT_ID" ]; then
  gh secret set VERCEL_PROJECT_ID -b"$VERCEL_PROJECT_ID" -R "$REPO"
  echo "   ✓ Set VERCEL_PROJECT_ID"
fi
echo ""

# Verify all secrets
echo "════════════════════════════════════════════════════"
echo "✅ Verification"
echo "════════════════════════════════════════════════════"
gh secret list -R "$REPO"

echo ""
echo "✨ Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Push code to main:"
echo "   git push origin main"
echo ""
echo "2. Watch workflows:"
echo "   https://github.com/$REPO/actions"
echo ""
echo "3. Frontend will deploy to:"
echo "   https://relateiq-optimized.vercel.app"
echo ""
echo "4. API will deploy to:"
echo "   https://relateiq-growth-worker.relay.app"
echo ""
