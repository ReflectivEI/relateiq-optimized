/**
 * pipelineEngine.js — Deterministic Pipeline Enforcement
 * Enforces: input → contextBuilder → patternEngine → predictiveEngine → frameworkEngine → output
 * No skipping steps. No AI before context is built.
 */

import { buildContext } from "./contextBuilder";
import { computePatternProfile, detectMisalignments } from "./patternEngine";
import { predictOutcome } from "./predictiveEngine";
import { globalState } from "./globalState";

export class DeterministicPipeline {
  constructor() {
    this.trace = [];
    this.currentPipelineId = null;
  }

  /**
   * Execute full pipeline: input → output
   * @param {object} input — raw user input (situation, speaker, etc.)
   * @returns {object} — { output, trace, metadata }
   */
  async executePipeline(input) {
    const pipelineId = `pipeline_${Date.now()}`;
    this.currentPipelineId = pipelineId;
    this.trace = [];

    try {
      // Step 1: Validate input
      this.recordStep("input_validation", "Validating input...", input);
      if (!input.speaker || !input.speakingTo || !input.situation) {
        throw new Error("INVALID_INPUT: missing speaker, speakingTo, or situation");
      }

      // Step 2: Build context
      this.recordStep("context_building", "Building contextual framework...", null);
      const state = globalState.getState();
      const context = buildContext({
        section: "Coach",
        perspective: `${input.speaker}→${input.speakingTo}`,
        profiles: [state.tony, state.drew].filter(Boolean),
        checkIns: state.checkIns,
        triggers: state.triggers,
        sessions: state.coachSessions,
      });
      this.recordStep("context_built", "Context framework ready", context);

      // Step 3: Compute patterns
      this.recordStep("pattern_analysis", "Analyzing behavioral patterns...", null);
      const primaryName = state.tony?.person_name || input.speaker || "Person A";
      const secondaryName =
        state.drew?.person_name ||
        (input.speakingTo === input.speaker ? "Person B" : input.speakingTo) ||
        "Person B";
      const tonyPatterns = computePatternProfile(primaryName, state.tonyResponses);
      const drewPatterns = computePatternProfile(secondaryName, state.drewResponses);
      const misalignments = detectMisalignments(tonyPatterns, primaryName, drewPatterns, secondaryName);
      this.recordStep("patterns_computed", "Patterns analyzed", {
        tonyTraits: tonyPatterns.traits,
        drewTraits: drewPatterns.traits,
        misalignmentCount: misalignments.misalignments.length,
      });

      // Step 4: Run predictive engine
      this.recordStep("predictive_analysis", "Computing outcome predictions...", null);
      const predictions = {
        avoidance: predictOutcome({
          actor: input.speaker,
          target: input.speakingTo,
          scenarioText: "avoidance: " + input.situation,
          actorTraits: tonyPatterns.traits,
          targetTraits: drewPatterns.traits,
        }),
        reactive: predictOutcome({
          actor: input.speaker,
          target: input.speakingTo,
          scenarioText: "reactive: " + input.situation,
          actorTraits: tonyPatterns.traits,
          targetTraits: drewPatterns.traits,
        }),
        intentional: predictOutcome({
          actor: input.speaker,
          target: input.speakingTo,
          scenarioText: "intentional: " + input.situation,
          actorTraits: tonyPatterns.traits,
          targetTraits: drewPatterns.traits,
        }),
      };
      this.recordStep("predictions_ready", "Predictions computed", {
        avoidanceRisk: predictions.avoidance.risk_level,
        reactiveRisk: predictions.reactive.risk_level,
        intentionalRisk: predictions.intentional.risk_level,
      });

      // Step 5: Framework selection
      this.recordStep("framework_selection", "Selecting therapeutic frameworks...", null);
      const frameworks = this.selectFrameworks(tonyPatterns, drewPatterns, misalignments);
      this.recordStep("frameworks_selected", "Frameworks ready", frameworks);

      // Step 6: Ready for AI call (if needed)
      this.recordStep("ai_ready", "Pipeline complete; ready for AI Coach call", {
        contextAttached: true,
        patternsReady: true,
        predictionsReady: true,
        frameworksSelected: true,
      });

      return {
        pipelineId,
        context,
        patterns: { tony: tonyPatterns, drew: drewPatterns },
        predictions,
        frameworks,
        trace: this.trace,
        metadata: {
          completedAt: new Date().toISOString(),
          stepCount: this.trace.length,
        },
      };
    } catch (err) {
      this.recordStep("error", err.message, { type: err.name });
      return {
        pipelineId,
        error: err.message,
        trace: this.trace,
        metadata: { failedAt: new Date().toISOString() },
      };
    }
  }

  /**
   * Select frameworks based on patterns
   */
  selectFrameworks(tonyPatterns, drewPatterns, misalignments) {
    const frameworks = [];

    if (tonyPatterns.traits.emotional_sensitivity > 0.7) frameworks.push("EFT");
    if (tonyPatterns.traits.conflict_avoidance > 0.7) frameworks.push("CBT");
    if (misalignments.misalignments.length > 0) frameworks.push("GOTTMAN");

    return Array.from(new Set(frameworks));
  }

  /**
   * Record step in trace
   */
  recordStep(stepId, message, data = null) {
    this.trace.push({
      step: stepId,
      timestamp: new Date().toISOString(),
      message,
      data: data ? JSON.stringify(data, null, 2) : null,
    });
  }

  /**
   * Get trace for display
   */
  getTrace() {
    return this.trace;
  }

  /**
   * Get trace as formatted string
   */
  getTraceFormatted() {
    return this.trace
      .map((t) => `[${t.step}] ${t.message}${t.data ? "\n" + t.data : ""}`)
      .join("\n\n");
  }
}

export const pipelineEngine = new DeterministicPipeline();
export default pipelineEngine;
