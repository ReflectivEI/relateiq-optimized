# RelateIQ System Architecture

## Overview

The RelateIQ system architecture is organized into three core layers:

```
┌─────────────────────────────────────────┐
│     Presentation Layer (React UI)       │
│  - Pages, Components, User Interactions │
└────────────────┬────────────────────────┘
                 │
┌────────────────v────────────────────────┐
│   Intelligence Layer (System Core)      │
│  - Decision Engine                      │
│  - Context Management                   │
│  - Perspective Analysis                 │
│  - Relationship Type Registry           │
└────────────────┬────────────────────────┘
                 │
┌────────────────v────────────────────────┐
│   Data & Persistence Layer              │
│  - API Layer (Cloudflare Worker)        │
│  - KV Cache (decision outputs)          │
│  - Database (user data)                 │
└─────────────────────────────────────────┘
```

## Core Components

### 1. ContextManager (`client/src/lib/system/ContextManager.ts`)

**Purpose**: Single source of truth for relationship context data

**Key Capabilities**:
- Immutable context snapshots with Object.freeze()
- Strict pairId isolation (prevents cross-relationship data leakage)
- 5-minute TTL cache with access logging
- Invalidation controls (full or selective)

**Usage**:
```typescript
import { contextManager } from '@/lib/system';

const snapshot = contextManager.getSnapshot(pairId, 'partner', 'me', sourceData);
// Returns immutable ContextSnapshot with patterns, profiles, risks, outcomes

contextManager.invalidate(pairId); // Clear entire cache
contextManager.invalidate(pairId, 'partner'); // Clear by type
```

**Isolation Guarantees**:
- Every cached object tagged with pairId
- Cross-pairId data detected and rejected
- getSnapshot() validates all profiles match pairId
- Access patterns logged for audit

### 2. RelationshipTypeRegistry (`client/src/lib/system/RelationshipTypeRegistry.ts`)

**Purpose**: Centralized configuration for each relationship type

**Supported Types**:
- **Partner**: Gottman + EFT frameworks; supports intimacy, polarity dynamics
- **Colleague**: CBT + NVC frameworks; emphasizes boundaries and roles
- **Friend**: NVC + IFS frameworks; emphasizes mutual support
- **Family**: IFS + NVC frameworks; emphasizes emotional complexity

**Key Capabilities**:
- Framework mapping per relationship type
- Prompt templates (coach, mirror, deepAnalysis, repair, beforeYouReact)
- Questionnaire schema per type
- Field validation (required/optional per type)
- Constraint definitions (canHaveIntimacy, canHaveLongTermPlans, etc.)

**Usage**:
```typescript
import { relationshipTypeRegistry } from '@/lib/system';

const config = relationshipTypeRegistry.get('partner');
// Returns RelationshipTypeConfig with all settings

relationshipTypeRegistry.validateAgainstSchema(data, 'partner', 'profile');
// Throws if required fields missing
```

### 3. PerspectiveAnalyzer (`client/src/lib/system/PerspectiveAnalyzer.ts`)

**Purpose**: First-class multi-perspective intelligence

**Key Capabilities**:
- Parallel "me" and "them" perspective analysis
- Alignment detection (shared needs, complementary strengths, conflicts)
- Automatic heuristic pattern matching (compounded weaknesses, clashing patterns)
- System diagnosis generation
- Perspective isolation enforcement

**Usage**:
```typescript
import { perspectiveAnalyzer } from '@/lib/system';

const analysis = perspectiveAnalyzer.analyze(
  pairId, relationshipType, 
  myProfile, theirProfile,
  myPatterns, theirPatterns,
  myNeeds, theirNeeds
);

// Returns PerspectiveAnalysisResult with:
// - myPerspective, theirPerspective (parallel views)
// - alignment (sharedNeeds, conflictingNeeds, compoundedWeaknesses)
// - systemDiagnosis (narrative explanation)
```

**Alignment Detection Heuristics**:
- `findSharedNeeds()`: Identifies mutual needs
- `findComplementaryStrengths()`: Pairs different strengths (synergy)
- `findConflictingNeeds()`: Opposite needs with commonGround
- `findCompoundedWeaknesses()`: Pattern cycles (pursue/withdraw)
- `findDivergentPatterns()`: Shows pattern clashes

### 4. DecisionEngine (`client/src/lib/system/DecisionEngine.ts`)

**Purpose**: System-level orchestration and prioritization

**Four-Phase Model**:
1. **Assessment**: Risk assessment (immediate/emerging/chronic) + Opportunity assessment
2. **Prioritization**: High-impact, high-probability, high-momentum recommendations
3. **Action**: Convert top recommendations to executable next steps
4. **Tracking**: Define metrics and success criteria

**Key Capabilities**:
- Risk severity classification
- Opportunity strength evaluation
- Recommendation prioritization
- Executable action generation with prerequisites
- Success metric definition

**Usage**:
```typescript
import { decisionEngine } from '@/lib/system';

const decision = decisionEngine.analyze(contextSnapshot);

// Returns DecisionOutput with:
// - riskAssessment (immediate/emerging/chronic)
// - opportunityAssessment (strengths, wins, momentum)
// - prioritization (highImpact, highProbability, highMomentum)
// - immediateNextSteps (ranked 1-5 actions)
// - metricsToTrack (daily/weekly/session)
// - successCriteria (what success looks like)
```

## Navigation Architecture (4-Phase Model)

The system implements four-phase navigation that maps to user needs:

```
Reflect (Understand)     → User enters context, views perspectives
    ↓
Decide (Prioritize)     → System generates ranked recommendations
    ↓
Repair (Intervene)      → User executes recommended action
    ↓
Grow (Long-term)        → System tracks outcomes, builds patterns
```

## Integration Patterns

### Pattern 1: Full System Analysis
```typescript
import { 
  contextManager, 
  relationshipTypeRegistry,
  perspectiveAnalyzer,
  decisionEngine 
} from '@/lib/system';

// Load context
const context = contextManager.getSnapshot(pairId, relationType, 'us');

// Analyze perspectives
const perspectives = perspectiveAnalyzer.analyze(
  pairId, relationType,
  context.activeProfile, context.partnerProfile,
  context.patterns, context.partnerPatterns,
  context.needs, context.partnerNeeds
);

// Generate decisions
const decision = decisionEngine.analyze(context);

// Return to UI
return { perspectives, decision, context };
```

### Pattern 2: Relationship Type Validation
```typescript
// Validate data for specific relationship type
relationshipTypeRegistry.validateAgainstSchema(
  questionnaireData, 
  'partner', 
  'profile'
);

// If type is 'colleague', questionnaire.intimacy_score would fail validation
// because colleagues don't have intimacy fields
```

### Pattern 3: Perspective-Aware Access
```typescript
// Request my perspective (me cannot see them)
const myView = perspectiveAnalyzer.getSafePerspectiveData(
  analysis, 
  'me' // Requesting perspective
);
// Returns: myPerspective only, throws if crossing boundary

// Request shared view (us can see alignment)
const sharedView = perspectiveAnalyzer.getSafePerspectiveData(
  analysis, 
  'us' // Requesting perspective
);
// Returns: alignment analysis
```

## Isolation & Safety Guarantees

### Data Isolation
- **Pair Isolation**: Every record tagged with pairId; cross-pairId access rejected
- **Immutability**: ContextSnapshot frozen with Object.freeze()
- **Perspective Isolation**: canAccess() prevents cross-perspective data leakage

### Type Safety
- **TypeScript**: Strict types throughout (no `any`)
- **Schema Validation**: relationshipTypeRegistry validates required fields
- **Error Handling**: Throws on invalid access, provides clear error messages

### Cache Management
- **TTL-Based Expiry**: 5-minute default TTL
- **Manual Invalidation**: Clear cache on data changes
- **Access Logging**: Track cache hits/misses for audit

## Extension Points

### Adding a New Relationship Type
```typescript
// Edit RelationshipTypeRegistry.ts
const newConfig: RelationshipTypeConfig = {
  id: 'mentor',
  frameworks: { primary: ['CBT', 'NVC'] },
  prompts: { /* custom prompts */ },
  questionnaire: { /* custom sections */ },
  // ... rest of config
};

this.configs.set('mentor', newConfig);
```

### Adding a New Intelligence Component
```typescript
// Create new file in lib/system/
export class MyNewComponent {
  private static instance: MyNewComponent;
  
  static getInstance() { 
    if (!this.instance) this.instance = new MyNewComponent();
    return this.instance;
  }
  
  analyze(context: ContextSnapshot) { /* ... */ }
}

// Add to index.ts exports
export { MyNewComponent, my NewComponent };
```

### Custom Heuristics
```typescript
// In PerspectiveAnalyzer.ts or DecisionEngine.ts
// Add new private methods like:

private customPatternDetection(pattern1, pattern2): boolean {
  // Custom logic
}
```

## Cloudflare Worker Integration

The system components can be invoked from Cloudflare Workers for edge caching and distributed decision-making:

```typescript
// In Worker (relate-iq-growth-worker/index.ts)
POST /api/decisions/analyze
  - Accepts: ContextRequest { pairId, relationshipType, profiles, patterns, risks }
  - Runs: DecisionEngine.analyze()
  - Caches: 5-minute TTL
  - Returns: DecisionOutput with ranked recommendations

GET /api/decisions/:pairId
  - Retrieves cached decision output

DELETE /api/decisions/:pairId
  - Invalidates cache
```

## Performance Characteristics

| Component | Operation | Typical Time | Cache | Notes |
|-----------|-----------|-------------|-------|-------|
| ContextManager | getSnapshot() | <1ms | 5min TTL | Immutable snapshot |
| RelationshipTypeRegistry | validateSchema() | <5ms | N/A | Simple lookup |
| PerspectiveAnalyzer | analyze() | 50-100ms | N/A | Heuristic matching |
| DecisionEngine | analyze() | 100-200ms | 5min | Recommendations generated |

## Testing Checklist

- [ ] ContextManager isolation: pairId validation
- [ ] ContextManager cache: TTL expiry, invalidation
- [ ] RelationshipTypeRegistry: Schema validation per type
- [ ] PerspectiveAnalyzer: Alignment heuristics accuracy
- [ ] DecisionEngine: Prioritization logic
- [ ] Integration: Full system analysis flow
- [ ] Cloudflare Worker: API endpoints, cache behavior

## Deployment

### Frontend
```bash
cd client
npm install
npm run build
# Deploy dist/ to production
```

### Cloudflare Worker
```bash
cd relate-iq-growth-worker
npm install
wrangler publish
# Sets up KV namespace for decision caching
```

## Next Steps

1. **Integrate with UI**: Connect DecisionOutput to recommendation cards
2. **Navigation Refactor**: Implement 4-phase routing (Reflect → Decide → Repair → Grow)
3. **AI Orchestration Bus**: Sequence features based on recommendations
4. **Outcome Tracking**: Record which recommendations were used + results
5. **Continuous Evaluation**: Adjust prioritization based on outcomes
