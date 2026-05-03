/**
 * DecisionEngine: System-level prioritization and orchestration
 * 
 * Input: Full context snapshot + all intelligence outputs
 * Output: Ranked, executable recommendations with reasoning
 * 
 * Responsibilities:
 * - Assess risks (immediate, emerging, chronic)
 * - Identify opportunities
 * - Prioritize interventions
 * - Generate executable next steps
 * - Track metrics for improvement
 */

import type { ContextSnapshot } from "./ContextManager";
import type { RiskSignal } from "@/types";

export interface Risk {
  severity: "immediate" | "emerging" | "chronic";
  id: string;
  description: string;
  confidence: number; // 0-1
  indicators: string[];
  potentialImpact: string;
}

export interface Opportunity {
  id: string;
  description: string;
  strength: string;
  momentum: "high" | "medium" | "low";
  how_to_leverage: string;
}

export interface Recommendation {
  id: string;
  priority: number; // 1 = highest
  title: string;
  description: string;
  reasoning: string;
  feature: string; // which system feature implements this
  expectedOutcome: string;
  successMetric: string;
  estimatedImpact: "high" | "medium" | "low";
  difficulty: "easy" | "moderate" | "challenging";
}

export interface DecisionOutput {
  pairId: string;
  generatedAt: number;
  
  // Analysis phase
  riskAssessment: {
    immediate: Risk[];
    emerging: Risk[];
    chronic: Risk[];
  };
  
  opportunityAssessment: {
    strengths_to_leverage: Opportunity[];
    recent_wins: string[];
    momentum_indicators: string[];
  };
  
  // Decision phase: What matters most?
  prioritization: {
    highImpact: Recommendation[]; // "Fix this, it compounds"
    highProbability: Recommendation[]; // "You're ready for this"
    highMomentum: Recommendation[]; // "You just succeeded here"
  };
  
  // Action phase: What to do first?
  immediateNextSteps: ExecutableAction[];
  
  // Tracking phase
  metricsToTrack: Metric[];
  successCriteria: string[];
}

export interface ExecutableAction {
  rank: number;
  feature: string;
  actionTitle: string;
  guidance: string;
  estimatedDuration: string;
  beforeYouStart: string[];
}

export interface Metric {
  id: string;
  name: string;
  description: string;
  dataSource: string;
  successThreshold: string;
  trackingFrequency: "daily" | "weekly" | "session";
}

export class DecisionEngine {
  private static instance: DecisionEngine;

  private constructor() {}

  static getInstance(): DecisionEngine {
    if (!DecisionEngine.instance) {
      DecisionEngine.instance = new DecisionEngine();
    }
    return DecisionEngine.instance;
  }

  /**
   * Analyze full context and generate ranked recommendations
   */
  analyze(context: ContextSnapshot): DecisionOutput {
    // PHASE 1: ASSESSMENT
    const riskAssessment = this.assessRisks(context);
    const opportunityAssessment = this.assessOpportunities(context);

    // PHASE 2: PRIORITIZATION
    const prioritization = this.prioritizeRecommendations(
      riskAssessment,
      opportunityAssessment,
      context
    );

    // PHASE 3: ACTION
    const immediateNextSteps = this.generateExecutableActions(prioritization);

    // PHASE 4: TRACKING
    const { metricsToTrack, successCriteria } = this.defineSuccessMetrics(
      immediateNextSteps
    );

    return {
      pairId: context.pairId,
      generatedAt: Date.now(),
      riskAssessment,
      opportunityAssessment,
      prioritization,
      immediateNextSteps,
      metricsToTrack,
      successCriteria,
    };
  }

  /**
   * Assess risks from various sources
   */
  private assessRisks(context: ContextSnapshot): DecisionOutput["riskAssessment"] {
    const risks: DecisionOutput["riskAssessment"] = {
      immediate: [],
      emerging: [],
      chronic: [],
    };

    // Map risk signals to severity levels
    context.riskSignals.forEach((signal) => {
      const risk: Risk = {
        severity: signal.severity as any || "chronic",
        id: signal.id || `risk-${Date.now()}`,
        description: signal.description,
        confidence: signal.confidence || 0.7,
        indicators: signal.indicators || [],
        potentialImpact: this.assessImpact(signal),
      };

      if (signal.severity === "immediate") {
        risks.immediate.push(risk);
      } else if (signal.severity === "emerging") {
        risks.emerging.push(risk);
      } else {
        risks.chronic.push(risk);
      }
    });

    return risks;
  }

  /**
   * Assess opportunities from strengths and recent successes
   */
  private assessOpportunities(context: ContextSnapshot): DecisionOutput["opportunityAssessment"] {
    const strengths = this.extractStrengths(context);
    const recentWins = context.recentOutcomes
      .filter((o) => o.success)
      .map((o) => o.description)
      .slice(0, 3);

    const opportunities: Opportunity[] = strengths.map((strength, idx) => ({
      id: `opp-${idx}`,
      description: strength,
      strength: strength,
      momentum: idx === 0 ? "high" : idx === 1 ? "medium" : "low",
      how_to_leverage: `Build on this strength by applying it to current challenges`,
    }));

    return {
      strengths_to_leverage: opportunities.slice(0, 3),
      recent_wins: recentWins,
      momentum_indicators: recentWins.length > 0 ? ["Recent success", "Positive outcomes"] : [],
    };
  }

  /**
   * Prioritize recommendations based on impact, probability, and momentum
   */
  private prioritizeRecommendations(
    riskAssessment: DecisionOutput["riskAssessment"],
    opportunityAssessment: DecisionOutput["opportunityAssessment"],
    context: ContextSnapshot
  ): DecisionOutput["prioritization"] {
    const recommendations: Recommendation[] = [];

    // HIGH IMPACT: Address immediate risks
    riskAssessment.immediate.forEach((risk) => {
      recommendations.push({
        id: `rec-immediate-${risk.id}`,
        priority: 1,
        title: `Address immediate risk: ${risk.description}`,
        description: `This risk requires attention now to prevent escalation`,
        reasoning: `Severity: ${risk.severity}, Confidence: ${(risk.confidence * 100).toFixed(0)}%`,
        feature: this.mapRiskToFeature(risk),
        expectedOutcome: `Reduce likelihood of ${risk.potentialImpact}`,
        successMetric: `Risk signal drops below threshold`,
        estimatedImpact: "high",
        difficulty: "moderate",
      });
    });

    // HIGH PROBABILITY: Leverage recent successes
    opportunityAssessment.recent_wins.forEach((win, idx) => {
      recommendations.push({
        id: `rec-momentum-${idx}`,
        priority: 2,
        title: `Continue this momentum: ${win}`,
        description: `You just succeeded here. Building on this creates positive spiral`,
        reasoning: `Recent success indicates readiness and capability`,
        feature: this.mapWinToFeature(win),
        expectedOutcome: `Reinforce successful pattern`,
        successMetric: `Repeated success in similar situations`,
        estimatedImpact: "high",
        difficulty: "easy",
      });
    });

    // HIGH IMPACT: Address emerging risks
    riskAssessment.emerging.forEach((risk) => {
      recommendations.push({
        id: `rec-emerging-${risk.id}`,
        priority: 3,
        title: `Prevent escalation: ${risk.description}`,
        description: `This is showing warning signs. Early intervention prevents crisis`,
        reasoning: `Proactive intervention is more effective than reactive repair`,
        feature: this.mapRiskToFeature(risk),
        expectedOutcome: `Stop pattern before it escalates`,
        successMetric: `Risk signal stabilizes`,
        estimatedImpact: "high",
        difficulty: "moderate",
      });
    });

    // Sort by priority and return
    const sortedRecs = recommendations.sort((a, b) => a.priority - b.priority);

    return {
      highImpact: sortedRecs.filter((r) => r.priority === 1),
      highProbability: sortedRecs.filter((r) => r.priority === 2),
      highMomentum: sortedRecs.filter((r) => r.priority === 3),
    };
  }

  /**
   * Convert recommendations into executable action steps
   */
  private generateExecutableActions(
    prioritization: DecisionOutput["prioritization"]
  ): ExecutableAction[] {
    const allRecs = [
      ...prioritization.highImpact,
      ...prioritization.highProbability,
      ...prioritization.highMomentum,
    ];

    return allRecs.slice(0, 5).map((rec, idx) => ({
      rank: idx + 1,
      feature: rec.feature,
      actionTitle: rec.title,
      guidance: rec.description,
      estimatedDuration: this.estimateDuration(rec),
      beforeYouStart: this.getPrerequisites(rec),
    }));
  }

  /**
   * Define what success looks like
   */
  private defineSuccessMetrics(
    actions: ExecutableAction[]
  ): { metricsToTrack: Metric[]; successCriteria: string[] } {
    const metricsToTrack: Metric[] = actions.map((action, idx) => ({
      id: `metric-${idx}`,
      name: `${action.actionTitle} - Success`,
      description: `Track outcomes from ${action.actionTitle}`,
      dataSource: action.feature,
      successThreshold: "Noticeable improvement in patterns",
      trackingFrequency: "session",
    }));

    const successCriteria = [
      "Completed recommended action",
      "Reported positive outcome",
      "Pattern shows improvement",
      "Risk signal decreases",
    ];

    return { metricsToTrack, successCriteria };
  }

  // ==================== PRIVATE HELPERS ====================

  private assessImpact(signal: RiskSignal): string {
    if (!signal.potential_impact) {
      return "Relationship quality may be affected";
    }
    return signal.potential_impact;
  }

  private extractStrengths(context: ContextSnapshot): string[] {
    const strengths: string[] = [];

    // From patterns
    context.patterns
      .filter((p) => !p.is_concern)
      .forEach((p) => {
        strengths.push(p.description);
      });

    // From profiles
    if (context.activeProfile.communication_style) {
      strengths.push(`${context.activeProfile.communication_style} communication`);
    }
    if (context.partnerProfile.communication_style) {
      strengths.push(`Both value ${context.partnerProfile.communication_style} style`);
    }

    return strengths.slice(0, 5);
  }

  private mapRiskToFeature(risk: Risk): string {
    // Heuristic: map risk types to system features
    if (risk.description.toLowerCase().includes("conflict")) {
      return "before-you-react";
    }
    if (risk.description.toLowerCase().includes("withdrawn")) {
      return "trigger-check";
    }
    if (risk.description.toLowerCase().includes("communication")) {
      return "translate";
    }
    if (risk.description.toLowerCase().includes("repair")) {
      return "repair";
    }
    return "coach"; // Default to coaching
  }

  private mapWinToFeature(win: string): string {
    // Heuristic: extend what's working
    if (win.toLowerCase().includes("communication")) {
      return "coach";
    }
    if (win.toLowerCase().includes("understanding")) {
      return "mirror";
    }
    return "coach";
  }

  private estimateDuration(rec: Recommendation): string {
    if (rec.difficulty === "easy") {
      return "5-10 minutes";
    }
    if (rec.difficulty === "moderate") {
      return "15-30 minutes";
    }
    return "30-60 minutes";
  }

  private getPrerequisites(rec: Recommendation): string[] {
    return [
      "Both people available and calm",
      "No interruptions or time pressure",
      "Open mindset to the process",
    ];
  }
}

export const decisionEngine = DecisionEngine.getInstance();
