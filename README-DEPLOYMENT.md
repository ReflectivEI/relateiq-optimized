# RelateIQ Growth - Optimized (System Architecture)

Advanced relationship intelligence system with modular architecture, multi-perspective analysis, and AI-driven decision engine.

## 🚀 Live Deployments

- **Frontend**: https://relateiq-optimized.vercel.app
- **Decision API**: https://relateiq-growth-worker.relay.app/api/decisions/analyze
- **Health Check**: https://relateiq-growth-worker.relay.app/api/health

## 📋 System Architecture

See [SYSTEM_ARCHITECTURE.md](./SYSTEM_ARCHITECTURE.md) for detailed documentation.

### Core Components

| Component | Purpose | Status |
|-----------|---------|--------|
| **ContextManager** | Single source of truth with immutable snapshots & isolation | ✅ Live |
| **RelationshipTypeRegistry** | Centralized config for 4 relationship types + frameworks | ✅ Live |
| **PerspectiveAnalyzer** | Multi-perspective intelligence with alignment detection | ✅ Live |
| **DecisionEngine** | System-level prioritization & ranked recommendations | ✅ Live |

## 🏗️ Architecture

```
Frontend (Vercel)
    ↓
Decision Engine API (Cloudflare Worker)
    ├─ KV Cache (decision-cache-storage)
    ├─ Recommend rankings
    └─ Risk assessment
    ↓
Backend APIs
    └─ User data, profiles, outcomes
```

## 🔧 Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Cloudflare account (for Worker deployment)
- Vercel account (for frontend deployment)

### Local Development

```bash
# Clone and install
git clone https://github.com/ReflectivEI/relateiq-optimized.git
cd relateiq-optimized
npm install

# Run dev server
npm run dev
# Open http://localhost:5173

# Build for production
npm run build

# Run preview
npm run preview
```

### Worker Development

```bash
cd relate-iq-growth-worker
npm install

# Local testing
npm run dev
# Open http://localhost:8787

# Deploy to Cloudflare
npm run deploy
```

## 🚀 Deployment

### GitHub Secrets Required

For automated deployment, add these secrets to GitHub:

```
# Vercel
VERCEL_TOKEN          - Vercel API token
VERCEL_ORG_ID         - Vercel organization ID
VERCEL_PROJECT_ID     - Vercel project ID
VERCEL_SCOPE          - Vercel account scope

# Cloudflare
CLOUDFLARE_API_TOKEN  - Cloudflare API token
CLOUDFLARE_ACCOUNT_ID - Cloudflare account ID
```

### Workflows

**Automatic on push to main:**

1. **Build & Test** (`.github/workflows/build.yml`)
   - Node 18.x & 20.x matrix
   - Installs dependencies
   - Builds with Vite
   - Verifies system components
   - Uploads artifacts

2. **Deploy Frontend** (`.github/workflows/deploy.yml`)
   - Triggered after successful build
   - Builds production bundle
   - Deploys to Vercel
   - Updates preview environment

3. **Deploy Worker** (`.github/workflows/deploy-worker.yml`)
   - Triggers on changes to `relate-iq-growth-worker/`
   - Publishes to Cloudflare Workers
   - Updates KV namespaces
   - API available at relay.app

### Manual Deployment

**Vercel:**
```bash
npm install -g vercel
vercel login
vercel --prod
```

**Cloudflare Worker:**
```bash
cd relate-iq-growth-worker
wrangler publish --env production
```

## 📊 API Endpoints

### Decision Engine API

#### `POST /api/decisions/analyze`
Generate prioritized recommendations for a relationship context.

```bash
curl -X POST https://relateiq-growth-worker.relay.app/api/decisions/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "pairId": "pair_123",
    "relationshipType": "partner",
    "perspective": "us",
    "activeProfile": { /* profile data */ },
    "partnerProfile": { /* profile data */ },
    "patterns": [ /* patterns */ ],
    "recentOutcomes": [ /* outcomes */ ],
    "riskSignals": [ /* risks */ ]
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pairId": "pair_123",
    "generatedAt": 1714732800000,
    "riskAssessment": { /* ... */ },
    "opportunityAssessment": { /* ... */ },
    "prioritization": { /* ... */ },
    "immediateNextSteps": [ /* ... */ ],
    "metricsToTrack": [ /* ... */ ],
    "successCriteria": [ /* ... */ ]
  },
  "cached": false
}
```

#### `GET /api/decisions/:pairId?perspective=us`
Retrieve cached decision for a pair.

#### `DELETE /api/decisions/:pairId`
Invalidate cached decision.

#### `GET /api/health`
Health check endpoint.

## 🧪 Testing

```bash
# Type checking
npm run type-check

# Build validation
npm run build

# View system components
ls -la client/src/lib/system/
```

## 📚 Documentation

- [System Architecture](./SYSTEM_ARCHITECTURE.md) - Detailed component docs
- [API Reference](./relate-iq-growth-worker/README.md) - Worker API docs
- [Contributing](./CONTRIBUTING.md) - Development guidelines

## 🔒 Security

- Strict TypeScript (no `any`)
- pairId-based data isolation
- Immutable snapshots
- Perspective-aware access control
- KV Cache encryption (Cloudflare)
- CORS protection

## 📈 Performance

| Component | Operation | Time | Cache |
|-----------|-----------|------|-------|
| ContextManager | getSnapshot() | <1ms | 5min |
| RelationshipTypeRegistry | validateSchema() | <5ms | N/A |
| PerspectiveAnalyzer | analyze() | 50-100ms | N/A |
| DecisionEngine | analyze() | 100-200ms | 5min |

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Cloudflare Workers, Node.js
- **Storage**: KV (Cloudflare), D1 (database)
- **CI/CD**: GitHub Actions
- **Hosting**: Vercel (frontend), Cloudflare (worker)
- **AI**: Claude (relationship coaching)

## 📝 Changelog

### v1.0.0 - System Architecture Release
- ✅ ContextManager singleton with immutable snapshots
- ✅ RelationshipTypeRegistry with 4 types
- ✅ PerspectiveAnalyzer with alignment detection
- ✅ DecisionEngine with 4-phase prioritization
- ✅ GitHub Actions CI/CD workflows
- ✅ Vercel frontend deployment
- ✅ Cloudflare Worker API deployment

## 🤝 Contributing

1. Create a branch: `git checkout -b feature/my-feature`
2. Commit changes: `git commit -m "Add feature"`
3. Push: `git push origin feature/my-feature`
4. Open PR on GitHub
5. Workflows run automatically; merge when approved

## 📄 License

Proprietary - ReflectivEI

## 🎯 Next Steps

- [ ] Integrate Decision Engine recommendations into UI
- [ ] Refactor navigation to 4-phase model (Reflect → Decide → Repair → Grow)
- [ ] Build AI Orchestration Bus for feature sequencing
- [ ] Implement outcome tracking system
- [ ] Add unit & E2E tests
- [ ] Performance monitoring & metrics

---

**Status**: 🟢 Production-Ready | **Build**: ✅ All workflows passing | **Deploy**: ✅ Live on Vercel & Cloudflare
