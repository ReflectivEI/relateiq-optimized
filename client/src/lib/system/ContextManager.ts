/**
 * ContextManager: Single source of truth for all relationship context
 * 
 * Responsibilities:
 * - Aggregate context from all sources (profiles, sessions, checks, patterns)
 * - Normalize and validate once at entry point
 * - Provide immutable context snapshots to features
 * - Enforce scope isolation (pairId, relationship type, perspective)
 * - Cache validated context across requests
 */

import type { Profile, Pattern, RiskSignal, Outcome } from "@/types";

export type RelationshipType = "partner" | "friend" | "family" | "colleague";
export type Perspective = "me" | "them" | "us";

export interface ContextSnapshot {
  // Core identity
  pairId: string;
  relationshipType: RelationshipType;
  perspective: Perspective;
  
  // Participant data (perspective-specific)
  activeProfile: Profile;
  partnerProfile: Profile;
  
  // Historical intelligence
  patterns: Pattern[];
  recentOutcomes: Outcome[];
  riskSignals: RiskSignal[];
  
  // System state
  lastSyncTime: number;
  isDirty: boolean;
  validationStatus: "valid" | "stale" | "error";
}

export class ContextManager {
  private static instance: ContextManager;
  private contextCache = new Map<string, ContextSnapshot>();
  private accessLog = new Map<string, number>();
  private readonly CACHE_TTL = 300000; // 5 minutes

  private constructor() {}

  static getInstance(): ContextManager {
    if (!ContextManager.instance) {
      ContextManager.instance = new ContextManager();
    }
    return ContextManager.instance;
  }

  /**
   * Get normalized context snapshot
   * Enforces strict isolation and validation
   */
  getSnapshot(
    pairId: string,
    relationshipType: RelationshipType,
    perspective: Perspective,
    sourceData?: {
      activeProfile: Profile;
      partnerProfile: Profile;
      patterns?: Pattern[];
      recentOutcomes?: Outcome[];
      riskSignals?: RiskSignal[];
    }
  ): ContextSnapshot {
    // ISOLATION: Verify access control
    if (!this.validatePairIdAccess(pairId)) {
      throw new Error(`Unauthorized access to pairId: ${pairId}`);
    }

    const cacheKey = this.getCacheKey(pairId, relationshipType, perspective);

    // CACHING: Return cached if valid and fresh
    const cached = this.contextCache.get(cacheKey);
    if (cached && !this.isCacheStale(cached)) {
      return Object.freeze(cached) as Readonly<ContextSnapshot>;
    }

    // BUILD: Create new snapshot if source data provided
    if (sourceData) {
      const snapshot = this.buildSnapshot(
        pairId,
        relationshipType,
        perspective,
        sourceData
      );

      // VALIDATION: Verify no cross-contamination
      this.validateIsolation(snapshot);

      // CACHE: Store for future use
      this.contextCache.set(cacheKey, snapshot);
      this.accessLog.set(cacheKey, Date.now());

      return Object.freeze(snapshot) as Readonly<ContextSnapshot>;
    }

    if (!cached) {
      throw new Error(
        `Context not available for ${pairId} and no source data provided`
      );
    }

    return Object.freeze(cached) as Readonly<ContextSnapshot>;
  }

  /**
   * Invalidate cache for a specific context
   */
  invalidate(
    pairId: string,
    relationshipType?: RelationshipType,
    perspective?: Perspective
  ): void {
    if (relationshipType && perspective) {
      const cacheKey = this.getCacheKey(pairId, relationshipType, perspective);
      this.contextCache.delete(cacheKey);
      this.accessLog.delete(cacheKey);
    } else {
      // Invalidate all contexts for this pair
      for (const key of this.contextCache.keys()) {
        if (key.startsWith(`${pairId}:`)) {
          this.contextCache.delete(key);
          this.accessLog.delete(key);
        }
      }
    }
  }

  /**
   * Clear entire cache (for testing or explicit reset)
   */
  clearCache(): void {
    this.contextCache.clear();
    this.accessLog.clear();
  }

  /**
   * Get cache statistics for monitoring
   */
  getStats(): {
    cacheSize: number;
    oldestEntry: number;
    mostRecentEntry: number;
  } {
    if (this.accessLog.size === 0) {
      return {
        cacheSize: 0,
        oldestEntry: 0,
        mostRecentEntry: 0,
      };
    }

    const times = Array.from(this.accessLog.values());
    return {
      cacheSize: this.contextCache.size,
      oldestEntry: Math.min(...times),
      mostRecentEntry: Math.max(...times),
    };
  }

  // ==================== PRIVATE METHODS ====================

  private getCacheKey(
    pairId: string,
    relationshipType: RelationshipType,
    perspective: Perspective
  ): string {
    return `${pairId}:${relationshipType}:${perspective}`;
  }

  private buildSnapshot(
    pairId: string,
    relationshipType: RelationshipType,
    perspective: Perspective,
    sourceData: {
      activeProfile: Profile;
      partnerProfile: Profile;
      patterns?: Pattern[];
      recentOutcomes?: Outcome[];
      riskSignals?: RiskSignal[];
    }
  ): ContextSnapshot {
    return {
      pairId,
      relationshipType,
      perspective,
      activeProfile: sourceData.activeProfile,
      partnerProfile: sourceData.partnerProfile,
      patterns: sourceData.patterns || [],
      recentOutcomes: sourceData.recentOutcomes || [],
      riskSignals: sourceData.riskSignals || [],
      lastSyncTime: Date.now(),
      isDirty: false,
      validationStatus: "valid",
    };
  }

  private validateIsolation(snapshot: ContextSnapshot): void {
    // VERIFICATION: All data must be tagged with same pairId
    const dataPairIds = new Set<string>();

    if (snapshot.activeProfile.pairId !== snapshot.pairId) {
      throw new Error("Active profile pairId mismatch");
    }
    if (snapshot.partnerProfile.pairId !== snapshot.pairId) {
      throw new Error("Partner profile pairId mismatch");
    }

    snapshot.patterns.forEach((p) => {
      if (p.pairId !== snapshot.pairId) {
        throw new Error("Pattern pairId mismatch");
      }
    });

    snapshot.recentOutcomes.forEach((o) => {
      if (o.pairId !== snapshot.pairId) {
        throw new Error("Outcome pairId mismatch");
      }
    });

    snapshot.riskSignals.forEach((r) => {
      if (r.pairId !== snapshot.pairId) {
        throw new Error("Risk signal pairId mismatch");
      }
    });

    // All data belongs to same pair - safe to proceed
  }

  private validatePairIdAccess(pairId: string): boolean {
    // TODO: Implement proper access control
    // For now, allow all; integrate with auth layer when available
    return !!pairId && typeof pairId === "string" && pairId.length > 0;
  }

  private isCacheStale(snapshot: ContextSnapshot): boolean {
    const age = Date.now() - snapshot.lastSyncTime;
    return age > this.CACHE_TTL;
  }
}

export const contextManager = ContextManager.getInstance();
