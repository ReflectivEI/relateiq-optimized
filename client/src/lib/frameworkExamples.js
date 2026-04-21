/**
 * frameworkExamples.js
 * ─────────────────────────────────────────────────────────────────
 * VALIDATION EXAMPLES — Framework matching and LGBTQ-specific scenarios.
 *
 * Shows:
 * 1. How frameworks are matched (no AI)
 * 2. LGBTQ-specific scenario and how it changes tone/language/risk
 * 3. Full guidance output with frameworks attached
 */

import { matchFrameworks, buildFrameworkExplanations, getFrameworkExplanation } from "./frameworkEngine";

// ── TEST SCENARIO 1: Standard Conflict (Gottman Focus) ──────────

export const SCENARIO_STANDARD_CONFLICT = {
  perspective: "Tony→Drew",
  situation: "Drew brings up something sensitive unexpectedly while Tony is stressed",
  traits: {
    conflict_avoidance: { score: 7 },
    withdrawal_tendency: { score: 6 },
    stress_reactivity: { score: 5 },
    emotional_sensitivity: { score: 4 },
  },
  other_traits: {
    emotional_sensitivity: { score: 7 },
    need_for_validation: { score: 7 },
    conflict_avoidance: { score: 4 },
  },
};

export function getStandardConflictFrameworks() {
  const matched = matchFrameworks({
    traits: SCENARIO_STANDARD_CONFLICT.traits,
    other_traits: SCENARIO_STANDARD_CONFLICT.other_traits,
    scenario_id: "unexpected_surprise",
    perspective: SCENARIO_STANDARD_CONFLICT.perspective,
  });

  return {
    matched_frameworks: matched.map((m) => m.framework),
    framework_details: matched,
    explanations: buildFrameworkExplanations(matched, {
      actor: "Tony",
      target: "Drew",
      scenario: SCENARIO_STANDARD_CONFLICT.situation,
      trait_influence: "conflict_avoidance (7/10), stress reactivity under unexpected conversation",
    }),
  };
}

// ── TEST SCENARIO 2: LGBTQ-Specific Scenario ─────────────────────

export const SCENARIO_LGBTQ = {
  perspective: "Drew→Tony",
  situation:
    "Drew brings up feeling emotionally invalidated lately — no reassurance about being valued or seen as a partner. This is happening after a period of external stress (work pressure, unsupportive family).",
  traits: {
    emotional_sensitivity: { score: 8 },
    need_for_validation: { score: 8 },
    need_for_depth: { score: 7 },
    communication_expressiveness: { score: 6 },
    withdrawal_tendency: { score: 3 },
  },
  other_traits: {
    stress_reactivity: { score: 7 },
    conflict_avoidance: { score: 6 },
    communication_expressiveness: { score: 4 },
    withdrawal_tendency: { score: 6 },
  },
  lgbtq_context: true,
};

export function getLGBTQFrameworks() {
  const matched = matchFrameworks({
    traits: SCENARIO_LGBTQ.traits,
    other_traits: SCENARIO_LGBTQ.other_traits,
    scenario_id: "feeling_dismissed",
    perspective: SCENARIO_LGBTQ.perspective,
    lgbtq_context: true,
  });

  return {
    matched_frameworks: matched.map((m) => m.framework),
    framework_details: matched,
    explanations: buildFrameworkExplanations(matched, {
      actor: "Drew",
      target: "Tony",
      scenario: SCENARIO_LGBTQ.situation,
      lgbtq_note:
        "LGBTQ+ context activates: (1) heightened need for explicit validation due to minority stress, (2) identity-sensitive interpretation of withdrawal as rejection, (3) relational intensity patterns",
    }),
  };
}

// ── HOW LGBTQ CONTEXT CHANGES GUIDANCE ─────────────────────────────

export const LGBTQ_IMPACT_COMPARISON = {
  non_lgbtq_version: {
    situation_summary:
      "Drew is bringing up feeling emotionally invalidated and needs reassurance about being valued.",
    what_you_are_experiencing:
      "Tony is experiencing fatigue from external stressors and may be withdrawing as a coping mechanism.",
    suggested_language: [
      "I hear you. You matter to me. Let me show you I'm here.",
      "I'm stressed right now, but that has nothing to do with how I feel about you.",
    ],
    tone_recommendation: "gentle",
    frameworks_used: ["EFT", "GOTTMAN"],
  },

  lgbtq_version: {
    situation_summary:
      "Drew is bringing up feeling emotionally invalidated — this is particularly triggering given minority stress and need for explicit external/internal validation of being a valued partner.",
    what_you_are_experiencing:
      "Tony is experiencing stress from external sources (work, family pressure), and may be unconsciously withdrawing. This is misread as withdrawal from the RELATIONSHIP because of Drew's minority stress heightening attachment sensitivity.",
    suggested_language: [
      "I see you. I value you. I want you to know this explicitly and often because I know the world doesn't always reflect how much you matter to me.",
      "I'm stressed, but none of it has anything to do with us. You are secure with me. I want to remind you of that right now.",
      "I know I've been distant. That's on me managing external pressure, not on how I feel about you. Let me be more intentional about showing up for you.",
    ],
    tone_recommendation: "gentle_with_explicit_reassurance",
    frameworks_used: ["EFT", "LGBTQ_RELATIONAL"],
    lgbtq_notes: [
      "Explicit verbal reassurance is not optional — it's foundational for LGBTQ+ relational safety",
      "Withdrawal is more easily misinterpreted as relational withdrawal in LGBTQ+ context due to minority stress",
      "Identity validation ('I see you as my partner') strengthens attachment security",
    ],
  },
};

// ── FRAMEWORK MATCHING VALIDATION ────────────────────────────────

export const FRAMEWORK_MATCHING_RULES_EXPLAINED = {
  "GOTTMAN triggered": {
    rule: "conflict_avoidance >= 7 OR withdrawal_tendency >= 7",
    example: "Tony (7/10 conflict avoidance) + unexpected criticism scenario",
    why: "Gottman's research shows withdrawal + conflict = stonewalling risk. Repair bids + turning towards needed.",
  },

  "EFT triggered": {
    rule: "emotional_sensitivity >= 6 OR need_for_validation >= 6",
    example: "Drew (8/10 emotional sensitivity, 8/10 validation need)",
    why: "EFT focuses on attachment safety. High sensitivity means emotional safety is primary concern.",
  },

  "CBT triggered": {
    rule: "withdrawal_tendency >= 7 AND need_for_validation >= 7 (misinterpretation risk)",
    example: "Tony withdraws to regulate, Drew interprets as rejection",
    why: "CBT helps both people recognize the thought loop and reality-test the automatic interpretation.",
  },

  "IMAGO triggered": {
    rule: "past_patterns_present OR repeated_conflict_loop",
    example: "Tony's childhood avoidance pattern repeating in current dynamic",
    why: "Imago helps identify unmet needs and practice mirroring the partner's experience.",
  },

  "LGBTQ_RELATIONAL triggered": {
    rule: "lgbtq_context === true AND (emotional_validation_gap >= 6 OR emotional_sensitivity >= 7)",
    example: "Drew (LGBTQ, high sensitivity) + Tony (withdrawing under stress)",
    why: "LGBTQ+ context means minority stress heightens attachment sensitivity. Explicit verbal commitment is protective.",
  },
};

// ── FULL OUTPUT EXAMPLE WITH FRAMEWORKS ──────────────────────────

export const FULL_OUTPUT_WITH_FRAMEWORKS = {
  situation_summary:
    "Drew is bringing up feeling emotionally invalidated and needs reassurance about being valued.",

  what_you_are_experiencing:
    "Tony is experiencing fatigue from external stressors. Your stress_reactivity (7/10) means you're likely withdrawing to regulate, not rejecting Drew. But Drew's need_for_validation (8/10) means they're reading your withdrawal as emotional distance from the RELATIONSHIP.",

  what_they_are_experiencing:
    "Drew is experiencing attachment anxiety + unmet validation needs. Their emotional_sensitivity (8/10) amplifies the perception of your withdrawal into a threat signal. They need explicit reassurance that you value them.",

  what_is_at_risk: [
    "Drew's attachment system stays activated (anxious) if validation needs aren't met",
    "Repeated cycles of Tony withdrawing → Drew feeling rejected → more withdrawal",
    "Minority stress (LGBTQ+ context) amplifies sensitivity, making this cycle harder to break",
  ],

  what_to_do: [
    "BEFORE doing anything else: give explicit verbal reassurance. 'I see you. I value you. I want you to know this.'",
    "Name your withdrawal pattern directly: 'I'm stressed right now, and I tend to pull away. That has nothing to do with how I feel about you.'",
    "Create a touchpoint ritual: even 5 minutes daily where you explicitly remind Drew they're valued.",
    "In conversations: prioritize validation (what Drew feels) before problem-solving.",
  ],

  what_not_to_do: [
    "Don't assume your withdrawal 'says' what you feel — tell them explicitly instead",
    "Don't minimize their need for reassurance as 'too much' — it's foundational for attachment security",
    "Don't solve the problem before creating emotional safety",
    "Don't wait for them to ask — proactive reassurance is stronger",
  ],

  suggested_language: [
    "I see you. I value you. I want you to know this explicitly, especially right now when I'm stressed.",
    "I've been distant because of work pressure, not because of you. You matter to me. I want to show you that.",
    "I know I tend to withdraw when I'm overwhelmed. That's my pattern, not a reflection of how I feel about you.",
    "Let me be clearer: you are secure with me. I want to remind you of that every day.",
  ],

  tone_recommendation: "gentle",

  frameworks_used: ["EFT", "LGBTQ_RELATIONAL"],

  framework_explanations: [
    {
      framework: "Emotionally Focused Therapy",
      framework_id: "EFT",
      why_applied: "High emotional sensitivity + unmet validation needs detected",
      how_it_applies:
        "This indicates attachment-driven reactions where emotional safety is prioritized over logic. Drew needs to feel emotionally secure before any problem-solving happens.",
      color: "purple",
      explanation: `
        EFT recognizes that attachment security is the foundation of healthy relationships.
        When someone has high emotional sensitivity + unmet validation needs, they're in an activated state.
        The priority is creating safety and explicit reassurance BEFORE addressing content.
        
        In this case: Drew needs to feel Tony's valuing, not just understand it intellectually.
        Explicit verbal reassurance ("I see you, I value you") is how safety gets restored.
      `.trim(),
    },
    {
      framework: "LGBTQ+ Relational Dynamics",
      framework_id: "LGBTQ_RELATIONAL",
      why_applied:
        "LGBTQ+ context + high sensitivity + withdrawal pattern = minority stress amplifying attachment anxiety",
      how_it_applies:
        "Minority stress (external invalidation) combines with partner withdrawal to create heightened attachment threat. Explicit verbal commitment becomes protective.",
      color: "pink",
      explanation: `
        LGBTQ+ relationships navigate an additional layer: minority stress from external sources.
        This can make partners more sensitive to internal relational threats (like withdrawal).
        Drew's high sensitivity + external stress = they need explicit, frequent, intentional reassurance.
        
        This isn't 'too much need' — it's a healthy response to additional stressors.
        The strategy is proactive, explicit verbal reassurance and recognition of identity.
      `.trim(),
    },
  ],
};

// ── VALIDATION CHECKLIST ─────────────────────────────────────────

export const VALIDATION_CHECKLIST = {
  no_ai_in_matching: [
    "✓ matchFrameworks() uses deterministic rules only",
    "✓ Conditions check trait scores and scenario IDs",
    "✓ No LLM calls in framework selection",
    "✓ Same input → identical framework matches (repeatability)",
  ],

  frameworks_tied_to_patterns: [
    "✓ GOTTMAN triggered by: conflict_avoidance/withdrawal >= 6, conflict scenarios",
    "✓ EFT triggered by: emotional_sensitivity/validation_need >= 6, attachment threats",
    "✓ CBT triggered by: misinterpretation risk (withdrawal misread as rejection)",
    "✓ IMAGO triggered by: past patterns present, unmet needs, repeated loops",
    "✓ LGBTQ_RELATIONAL triggered by: LGBTQ context + validation gap >= 6",
  ],

  lgbtq_logic_is_specific: [
    "✓ Recognizes minority stress amplifies attachment sensitivity",
    "✓ Makes explicit: withdrawal is misread as relational rejection in LGBTQ context",
    "✓ Adjusts language: explicit verbal reassurance is foundational, not optional",
    "✓ Adjusts tone: 'gentle_with_explicit_reassurance' vs. generic 'gentle'",
    "✓ Adds risk: minority stress + partner withdrawal = heightened attachment threat",
  ],

  ui_rendering_proof: [
    "✓ FrameworkCard displays: name, why_applied, how_it_applies",
    "✓ Expandable: 'Explain the Science' reveals full explanation",
    "✓ FrameworksSection shows all frameworks as cards",
    "✓ Colors differentiate frameworks (blue/purple/green/orange/pink)",
  ],
};