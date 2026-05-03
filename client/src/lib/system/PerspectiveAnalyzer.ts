/**
 * PerspectiveAnalysis: First-class intelligence layer for multi-perspective understanding
 * 
 * Provides three parallel analyses:
 * - My perspective (what I see/experience)
 * - Their perspective (what they see/experience)
 * - Alignment analysis (where we're aligned, where we diverge)
 */

import type { Pattern, Profile } from "@/types";

export interface PerspectiveView {
  perspective: "me" | "them";
  patterns: Pattern[];
  needs: string[];
  triggers: string[];
  strengths: string[];
  defenses: string[];
}

export interface AlignmentAnalysis {
  // Areas of agreement
  sharedNeeds: string[];
  complementaryStrengths: { me: string; them: string; synergy: string }[];

  // Areas of tension
  conflictingNeeds: {
    mine: string;
    theirs: string;
    tension: string;
    commonGround?: string;
  }[];

  compoundedWeaknesses: {
    myWeakness: string;
    theirWeakness: string;
    impact: string;
  }[];

  // Pattern divergence
  divergentPatterns: {
    myPattern: string;
    theirPattern: string;
    howTheyClash: string;
  }[];
}

export interface PerspectiveAnalysisResult {
  pairId: string;
  relationshipType: string;

  // Three parallel analyses
  myPerspective: PerspectiveView;
  theirPerspective: PerspectiveView;

  // Unified alignment view
  alignment: AlignmentAnalysis;

  // System-level insight
  systemDiagnosis: string;
  keyTension?: string;
  mutualStrengths?: string[];
  actionableInsight?: string;
}

export class PerspectiveAnalyzer {
  private static instance: PerspectiveAnalyzer;

  private constructor() {}

  static getInstance(): PerspectiveAnalyzer {
    if (!PerspectiveAnalyzer.instance) {
      PerspectiveAnalyzer.instance = new PerspectiveAnalyzer();
    }
    return PerspectiveAnalyzer.instance;
  }

  /**
   * Analyze relationship from both perspectives
   */
  analyze(
    pairId: string,
    relationshipType: string,
    myProfile: Profile,
    theirProfile: Profile,
    myPatterns: Pattern[],
    theirPatterns: Pattern[],
    myNeeds: string[],
    theirNeeds: string[]
  ): PerspectiveAnalysisResult {
    const myPerspective = this.buildPerspectiveView(
      "me",
      myProfile,
      myPatterns,
      myNeeds
    );
    const theirPerspective = this.buildPerspectiveView(
      "them",
      theirProfile,
      theirPatterns,
      theirNeeds
    );
    const alignment = this.analyzeAlignment(
      myPerspective,
      theirPerspective,
      myNeeds,
      theirNeeds
    );

    const systemDiagnosis = this.generateSystemDiagnosis(
      myPerspective,
      theirPerspective,
      alignment
    );

    return {
      pairId,
      relationshipType,
      myPerspective,
      theirPerspective,
      alignment,
      systemDiagnosis,
      keyTension: this.identifyKeyTension(alignment),
      mutualStrengths: this.identifyMutualStrengths(alignment),
      actionableInsight: this.generateActionableInsight(
        alignment,
        systemDiagnosis
      ),
    };
  }

  /**
   * Check if perspective access is allowed
   * (prevents accidental cross-perspective data leakage)
   */
  canAccess(requestedPerspective: "me" | "them", currentPerspective: "me" | "them" | "us"): boolean {
    if (currentPerspective === "us") {
      return true; // "us" perspective can see both
    }
    return requestedPerspective === currentPerspective; // "me" can only see "me"
  }

  /**
   * Get safe perspective data (respects isolation)
   */
  getSafePerspectiveData(
    analysis: PerspectiveAnalysisResult,
    requestingPerspective: "me" | "them" | "us"
  ): PerspectiveView | AlignmentAnalysis {
    if (!this.canAccess(requestingPerspective as any, requestingPerspective)) {
      throw new Error("Cannot access cross-perspective data from this view");
    }

    if (requestingPerspective === "me") {
      return analysis.myPerspective;
    } else if (requestingPerspective === "them") {
      return analysis.theirPerspective;
    } else {
      // "us" perspective gets alignment
      return analysis.alignment;
    }
  }

  // ==================== PRIVATE METHODS ====================

  private buildPerspectiveView(
    perspective: "me" | "them",
    profile: Profile,
    patterns: Pattern[],
    needs: string[]
  ): PerspectiveView {
    return {
      perspective,
      patterns: patterns || [],
      needs: needs || [],
      triggers: this.extractTriggers(patterns),
      strengths: this.extractStrengths(profile, patterns),
      defenses: this.extractDefenses(patterns),
    };
  }

  private analyzeAlignment(
    myView: PerspectiveView,
    theirView: PerspectiveView,
    myNeeds: string[],
    theirNeeds: string[]
  ): AlignmentAnalysis {
    return {
      sharedNeeds: this.findSharedNeeds(myNeeds, theirNeeds),
      complementaryStrengths: this.findComplementaryStrengths(myView, theirView),
      conflictingNeeds: this.findConflictingNeeds(myNeeds, theirNeeds),
      compoundedWeaknesses: this.findCompoundedWeaknesses(myView, theirView),
      divergentPatterns: this.findDivergentPatterns(myView, theirView),
    };
  }

  private extractTriggers(patterns: Pattern[]): string[] {
    return patterns
      .filter((p) => p.trigger_words && p.trigger_words.length > 0)
      .flatMap((p) => p.trigger_words || [])
      .slice(0, 5); // Top 5
  }

  private extractStrengths(profile: Profile, patterns: Pattern[]): string[] {
    const strengths: string[] = [];

    if (profile.communication_style) {
      strengths.push(`${profile.communication_style} communication`);
    }

    const positivePatterns = patterns.filter((p) => !p.is_concern);
    if (positivePatterns.length > 0) {
      strengths.push(...positivePatterns.map((p) => p.description).slice(0, 3));
    }

    return strengths;
  }

  private extractDefenses(patterns: Pattern[]): string[] {
    return patterns
      .filter((p) => p.is_defense_pattern)
      .map((p) => p.description)
      .slice(0, 3);
  }

  private findSharedNeeds(myNeeds: string[], theirNeeds: string[]): string[] {
    return myNeeds.filter((need) =>
      theirNeeds.some(
        (theirNeed) =>
          theirNeed.toLowerCase().includes(need.toLowerCase()) ||
          need.toLowerCase().includes(theirNeed.toLowerCase())
      )
    );
  }

  private findComplementaryStrengths(
    myView: PerspectiveView,
    theirView: PerspectiveView
  ): { me: string; them: string; synergy: string }[] {
    // Simple heuristic: pair different strengths
    const pairs: { me: string; them: string; synergy: string }[] = [];

    myView.strengths.forEach((myStrength, i) => {
      if (theirView.strengths[i] && myStrength !== theirView.strengths[i]) {
        pairs.push({
          me: myStrength,
          them: theirView.strengths[i],
          synergy: `${myStrength} + ${theirView.strengths[i]} creates balance`,
        });
      }
    });

    return pairs.slice(0, 3);
  }

  private findConflictingNeeds(
    myNeeds: string[],
    theirNeeds: string[]
  ): {
    mine: string;
    theirs: string;
    tension: string;
    commonGround?: string;
  }[] {
    // Simple heuristic: identify opposite needs
    const conflicts: {
      mine: string;
      theirs: string;
      tension: string;
      commonGround?: string;
    }[] = [];

    myNeeds.forEach((myNeed) => {
      theirNeeds.forEach((theirNeed) => {
        if (
          this.areOppositeNeeds(myNeed, theirNeed) &&
          conflicts.length < 3
        ) {
          conflicts.push({
            mine: myNeed,
            theirs: theirNeed,
            tension: `You need ${myNeed} but they need ${theirNeed}`,
            commonGround: this.findCommonGround(myNeed, theirNeed),
          });
        }
      });
    });

    return conflicts;
  }

  private findCompoundedWeaknesses(
    myView: PerspectiveView,
    theirView: PerspectiveView
  ): { myWeakness: string; theirWeakness: string; impact: string }[] {
    // Find patterns that amplify each other's challenges
    const compounded: { myWeakness: string; theirWeakness: string; impact: string }[] = [];

    myView.defenses.forEach((myDefense) => {
      theirView.defenses.forEach((theirDefense) => {
        if (this.amplifyEachOther(myDefense, theirDefense)) {
          compounded.push({
            myWeakness: myDefense,
            theirWeakness: theirDefense,
            impact: `When you ${myDefense}, they ${theirDefense}, which escalates the situation`,
          });
        }
      });
    });

    return compounded.slice(0, 3);
  }

  private findDivergentPatterns(
    myView: PerspectiveView,
    theirView: PerspectiveView
  ): { myPattern: string; theirPattern: string; howTheyClash: string }[] {
    // Find patterns that directly conflict
    const divergent: { myPattern: string; theirPattern: string; howTheyClash: string }[] = [];

    myView.patterns.forEach((myPattern) => {
      theirView.patterns.forEach((theirPattern) => {
        if (
          this.patternsClash(myPattern, theirPattern) &&
          divergent.length < 3
        ) {
          divergent.push({
            myPattern: myPattern.description,
            theirPattern: theirPattern.description,
            howTheyClash: `Your pattern of ${myPattern.description} triggers their pattern of ${theirPattern.description}`,
          });
        }
      });
    });

    return divergent;
  }

  private generateSystemDiagnosis(
    myView: PerspectiveView,
    theirView: PerspectiveView,
    alignment: AlignmentAnalysis
  ): string {
    const sharedStrength = alignment.complementaryStrengths.length > 0;
    const sharedNeed = alignment.sharedNeeds.length > 0;
    const tension = alignment.conflictingNeeds.length > 0;

    if (sharedNeed && sharedStrength && !tension) {
      return `You both value ${alignment.sharedNeeds[0]} and have complementary strengths to support it. This is a foundation for growth.`;
    }

    if (tension && alignment.compoundedWeaknesses.length > 0) {
      return `You have opposite needs (${alignment.conflictingNeeds[0]?.mine} vs ${alignment.conflictingNeeds[0]?.theirs}), which creates a cycle where both of you feel unheard. Breaking this cycle requires understanding the underlying needs.`;
    }

    if (sharedStrength) {
      return `You have complementary strengths that can work well together. The challenge is channeling them effectively when stress appears.`;
    }

    return `You have different patterns and needs. With awareness and practice, these differences can become complementary rather than clashing.`;
  }

  private identifyKeyTension(alignment: AlignmentAnalysis): string | undefined {
    if (alignment.conflictingNeeds.length > 0) {
      const primary = alignment.conflictingNeeds[0];
      return `${primary.mine} vs ${primary.theirs}`;
    }
    return undefined;
  }

  private identifyMutualStrengths(alignment: AlignmentAnalysis): string[] {
    return alignment.complementaryStrengths.map((cs) => cs.synergy);
  }

  private generateActionableInsight(
    alignment: AlignmentAnalysis,
    diagnosis: string
  ): string {
    if (alignment.sharedNeeds.length > 0) {
      return `Start by acknowledging your shared need for ${alignment.sharedNeeds[0]}, then discuss different paths to meet it.`;
    }

    if (alignment.conflictingNeeds.length > 0) {
      return `The core tension is ${alignment.conflictingNeeds[0]?.mine} vs ${alignment.conflictingNeeds[0]?.theirs}. Before solving it, ensure both needs are fully understood and valued.`;
    }

    return "Focus on building shared understanding through perspective-taking exercises.";
  }

  // ==================== HEURISTIC HELPERS ====================

  private areOppositeNeeds(need1: string, need2: string): boolean {
    const opposites = [
      ["independence", "togetherness"],
      ["alone time", "connection"],
      ["spontaneity", "planning"],
      ["openness", "privacy"],
    ];

    return opposites.some(
      ([a, b]) =>
        (need1.toLowerCase().includes(a) && need2.toLowerCase().includes(b)) ||
        (need1.toLowerCase().includes(b) && need2.toLowerCase().includes(a))
    );
  }

  private findCommonGround(need1: string, need2: string): string | undefined {
    // Try to find common underlying value
    if (
      need1.toLowerCase().includes("independent") &&
      need2.toLowerCase().includes("together")
    ) {
      return "Both want to feel respected and valued";
    }
    if (
      need1.toLowerCase().includes("alone") &&
      need2.toLowerCase().includes("connection")
    ) {
      return "Both need to feel secure in the relationship";
    }
    return undefined;
  }

  private amplifyEachOther(defense1: string, defense2: string): boolean {
    // Check if two defenses amplify each other (e.g., withdraw + pursue)
    const pairs = [
      ["withdraw", "pursue"],
      ["shutdown", "criticize"],
      ["avoid", "confront"],
    ];

    return pairs.some(
      ([a, b]) =>
        (defense1.toLowerCase().includes(a) &&
          defense2.toLowerCase().includes(b)) ||
        (defense1.toLowerCase().includes(b) &&
          defense2.toLowerCase().includes(a))
    );
  }

  private patternsClash(pattern1: Pattern, pattern2: Pattern): boolean {
    // Simple heuristic: if one is a concern and one is not, check if related
    if (pattern1.is_concern !== pattern2.is_concern) {
      return true;
    }
    return false;
  }
}

export const perspectiveAnalyzer = PerspectiveAnalyzer.getInstance();
