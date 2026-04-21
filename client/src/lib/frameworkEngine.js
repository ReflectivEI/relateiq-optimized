/**
 * frameworkEngine.js
 * ─────────────────────────────────────────────────────────────────
 * Therapeutic framework matching engine.
 * Deterministic, rule-based, ZERO AI.
 * Matches frameworks to patterns, traits, and scenarios.
 *
 * Public API:
 *   matchFrameworks({ patterns, traits, scenario, perspective })
 *   getFrameworkExplanation(framework, context)
 */

// ── FRAMEWORK DEFINITIONS ────────────────────────────────────────

export const FRAMEWORKS = {
  GOTTMAN: {
    id: "GOTTMAN",
    name: "Gottman Method",
    color: "blue",
    description: "Conflict repair, turning towards connection, managing stonewalling",
    triggers: [
      "conflict_avoidance >= 6",
      "withdrawal_tendency >= 6",
      "stress_reactivity >= 6",
      "criticism_pattern",
      "defensive_pattern",
      "active_conflict_scenario",
      "repair_opportunity",
    ],
    category: "conflict_resolution",
  },

  EFT: {
    id: "EFT",
    name: "Emotionally Focused Therapy",
    color: "purple",
    description: "Emotional needs, attachment security, validation, safe bonding",
    triggers: [
      "emotional_sensitivity >= 6",
      "need_for_validation >= 6",
      "need_for_depth >= 6",
      "attachment_anxiety",
      "feeling_dismissed_scenario",
      "affection_bid_rejected_scenario",
      "emotional_shutdown_scenario",
    ],
    category: "attachment_bonding",
  },

  CBT: {
    id: "CBT",
    name: "Cognitive Behavioral Therapy",
    color: "green",
    description: "Thought patterns, cognitive distortions, misinterpretation, reframing",
    triggers: [
      "misinterpretation_risk >= 0.6",
      "catastrophizing_pattern",
      "black_and_white_thinking",
      "mind_reading_pattern",
      "withdrawal_misread_as_rejection",
      "avoidance_misread_as_dismissal",
    ],
    category: "thought_emotion_pattern",
  },

  IMAGO: {
    id: "IMAGO",
    name: "Imago Relationship Therapy",
    color: "orange",
    description: "Perception gaps, unmet needs, mirror work, childhood wound patterns",
    triggers: [
      "past_patterns_present",
      "perception_mismatch >= 0.5",
      "unmet_needs_pattern",
      "partner_perception_gap",
      "repeated_conflict_loop",
    ],
    category: "perception_history",
  },

  LGBTQ_RELATIONAL: {
    id: "LGBTQ_RELATIONAL",
    name: "LGBTQ+ Relational Dynamics",
    color: "pink",
    description: "Identity sensitivity, validation gaps, minority stress impact, communication nuance",
    triggers: [
      "emotional_invalidation_sensitivity",
      "safety_driven_withdrawal",
      "relational_intensity",
      "identity_based_interpretation",
      "minority_stress_impact",
      "emotional_validation_gap >= 6",
    ],
    category: "identity_context",
  },
};

// ── FRAMEWORK MATCHING RULES ────────────────────────────────────

const MATCHING_RULES = [
  // ── GOTTMAN RULES ────────────────────────────────────────
  {
    framework: "GOTTMAN",
    condition: (ctx) =>
      ctx.traits?.conflict_avoidance?.score >= 7 ||
      ctx.traits?.withdrawal_tendency?.score >= 7 ||
      (ctx.scenario_id && ["active_conflict", "withdrawal_during_conflict"].includes(ctx.scenario_id)),
    reason: "High conflict avoidance or withdrawal pattern → Gottman repair & turning-towards strategies needed",
    application: "Focus on repair bids, creating safety signals, and managing stonewalling",
  },
  {
    framework: "GOTTMAN",
    condition: (ctx) =>
      ctx.traits?.stress_reactivity?.score >= 7 &&
      (ctx.scenario_id?.includes("conflict") || ctx.scenario_id?.includes("escalation")),
    reason: "Stress reactivity + conflict scenario → Gottman de-escalation & physiological soothing",
    application: "Lower intensity before engagement, use calming language, regulate nervous system first",
  },

  // ── EFT RULES ────────────────────────────────────────
  {
    framework: "EFT",
    condition: (ctx) =>
      ctx.traits?.emotional_sensitivity?.score >= 7 ||
      ctx.traits?.need_for_validation?.score >= 7,
    reason: "High emotional sensitivity + validation needs → EFT attachment & emotional safety focus",
    application: "Prioritize emotional validation before problem-solving, create safe connection window",
  },
  {
    framework: "EFT",
    condition: (ctx) =>
      ctx.scenario_id && ["feeling_dismissed", "affection_bid_rejected", "emotional_shutdown"].includes(ctx.scenario_id),
    reason: "Attachment threat detected (dismissal, rejection, shutdown) → EFT bonding & reassurance",
    application: "Reconnect at emotional level, demonstrate valuing & attunement, rebuild safety",
  },

  // ── CBT RULES ────────────────────────────────────────
  {
    framework: "CBT",
    condition: (ctx) =>
      (ctx.traits?.withdrawal_tendency?.score >= 7 &&
        ctx.other_traits?.need_for_validation?.score >= 7) ||
      (ctx.traits?.conflict_avoidance?.score >= 7 &&
        ctx.other_traits?.emotional_sensitivity?.score >= 7),
    reason:
      "Misinterpretation risk high (withdrawal perceived as rejection, avoidance as dismissal) → CBT reframing",
    application:
      "Identify the thought loop, name what's actually happening, practice new interpretation",
  },
  {
    framework: "CBT",
    condition: (ctx) =>
      ctx.scenario_id?.includes("unexpected") ||
      ctx.scenario_id?.includes("criticism"),
    reason: "Sudden stress → catastrophizing or black-and-white thinking likely → CBT thought examination",
    application: "Slow down, examine assumptions, reality-test the thought, generate alternative interpretations",
  },

  // ── IMAGO RULES ────────────────────────────────────────
  {
    framework: "IMAGO",
    condition: (ctx) => ctx.patterns?.includes("past_patterns_present") || ctx.perception_gap >= 0.5,
    reason: "Childhood/past patterns showing up in current dynamic → Imago lens on unmet needs",
    application:
      "Identify where this pattern came from, what need is unmet, practice mirroring the partner's experience",
  },
  {
    framework: "IMAGO",
    condition: (ctx) =>
      ctx.repeated_conflict_loop ||
      (ctx.traits?.conflict_avoidance?.score >= 6 &&
        ctx.other_traits?.need_for_validation?.score >= 6),
    reason: "Stuck in repetitive dynamic → Imago cycle of pursuit/withdrawal or blame/defend",
    application: "Name the cycle, take turns in the vulnerable role, practice safe vulnerability",
  },

  // ── LGBTQ_RELATIONAL RULES ────────────────────────────────────────
  {
    framework: "LGBTQ_RELATIONAL",
    condition: (ctx) =>
      ctx.lgbtq_context === true || ctx.emotional_validation_gap >= 6,
    reason:
      "LGBTQ+ context + emotional validation gap → Minority stress impact on relational safety & communication",
    application:
      "Acknowledge external stressors, validate identity-related sensitivity, prioritize explicit verbal reassurance",
  },
  {
    framework: "LGBTQ_RELATIONAL",
    condition: (ctx) =>
      ctx.traits?.emotional_sensitivity?.score >= 7 &&
      ctx.withdrawal_tendency?.score >= 6 &&
      ctx.lgbtq_context === true,
    reason:
        "High sensitivity + withdrawal + LGBTQ context → Safety-driven communication withdrawal under stress",
    application:
      "Recognize withdrawal as protective, not rejecting; use explicit 'you matter to me' language; slow conversations",
  },
];

// ── PUBLIC API ────────────────────────────────────────────────

/**
 * Match frameworks to a situation based on patterns, traits, and scenario.
 * Fully deterministic — NO AI.
 *
 * @param {object} params
 * @param {array} params.patterns — behavioral patterns detected
 * @param {object} params.traits — trait scores (conflict_avoidance, etc.)
 * @param {object} params.other_traits — partner's trait scores (for misinterpretation detection)
 * @param {string} params.scenario_id — scenario ID from predictiveScenarios
 * @param {string} params.perspective — "Tony", "Drew", "Tony→Drew", "Drew→Tony"
 * @param {boolean} params.lgbtq_context — whether LGBTQ context applies
 * @returns {array} Matched frameworks with reasons
 */
export function matchFrameworks({
  patterns = [],
  traits = {},
  other_traits = {},
  scenario_id = null,
  perspective = null,
  lgbtq_context = false,
}) {
  const matched = [];
  const seen = new Set();

  const ctx = {
    patterns,
    traits,
    other_traits,
    scenario_id,
    perspective,
    lgbtq_context,
    perception_gap: calculatePerceptionGap(traits, other_traits),
  };

  for (const rule of MATCHING_RULES) {
    if (rule.condition(ctx) && !seen.has(rule.framework)) {
      matched.push({
        framework: rule.framework,
        reason: rule.reason,
        application: rule.application,
      });
      seen.add(rule.framework);
    }
  }

  // If no matches, apply generic fallback
  if (matched.length === 0) {
    matched.push({
      framework: "GOTTMAN",
      reason: "Default framework for all relationships",
      application: "Safe, research-backed approach to communication and conflict",
    });
  }

  return matched;
}

/**
 * Get a detailed explanation of how a framework applies.
 * Specific to the context, not generic.
 */
export function getFrameworkExplanation(framework, context) {
  const fw = FRAMEWORKS[framework];
  if (!fw) return null;

  const explanations = {
    GOTTMAN: `
      This relationship shows conflict patterns that benefit from Gottman's research-backed approach.
      Gottman identified that successful couples use "repair bids" (attempts to reconnect) even during conflict,
      and "turn towards" each other rather than away.
      
      In this situation: ${context.actor || "This person"}'s ${context.trait_influence || "communication pattern"} is being understood
      through Gottman's lens of managing stress responses rather than character flaws.
      
      The strategy focuses on signaling safety and connection before addressing content.
    `,

    EFT: `
      This relationship shows emotional connection needs that EFT (Emotionally Focused Therapy) directly addresses.
      EFT is built on the understanding that relationships are safest when both partners feel emotionally secure.
      
      In this situation: The emotional needs being expressed (or unexpressed) are the priority.
      Problem-solving comes AFTER emotional safety and validation are established.
      
      The strategy focuses on creating moments of emotional attunement and explicit reassurance.
    `,

    CBT: `
      This relationship shows thought patterns that are keeping both people stuck in misunderstandings.
      CBT helps identify how automatic thoughts (like "they don't care") get misinterpreted as facts.
      
      In this situation: ${context.actor || "This person"} is likely thinking "${context.thought || "something is wrong"}"
      when the actual situation is different.
      
      The strategy focuses on slowing down, examining the thought, and reality-testing it before reacting.
    `,

    IMAGO: `
      This relationship shows patterns from the past showing up in the present.
      Imago Therapy recognizes that we often choose partners who help us heal old wounds, but can also trigger them.
      
      In this situation: The pattern of ${context.pattern || "conflict"} may echo something from each person's history.
      Understanding the original need helps both people show up with more compassion.
      
      The strategy focuses on identifying the unmet need and learning to meet it for each other.
    `,

    LGBTQ_RELATIONAL: `
      This relationship is being understood through the lens of LGBTQ+ relational dynamics.
      LGBTQ+ couples often navigate additional layers: identity validation, external stressors (minority stress),
      and the need for explicit verbal reassurance that may not be required in different contexts.
      
      In this situation: ${context.lgbtq_note || "Communication and emotional safety are especially important"}
      because both external and internal stressors are at play.
      
      The strategy focuses on explicit validation, acknowledgment of identity, and direct verbal commitment.
    `,
  };

  return explanations[framework] || "Framework applied to this analysis.";
}

// ── HELPER FUNCTIONS ────────────────────────────────────────────

function calculatePerceptionGap(traits, otherTraits) {
  // Simple perception gap: difference in how two people see conflict/communication
  const trait1 = traits?.conflict_avoidance?.score ?? 5;
  const trait2 = otherTraits?.need_for_validation?.score ?? 5;
  return Math.abs(trait1 - trait2) / 10;
}

/**
 * Build framework explanations for output.
 */
export function buildFrameworkExplanations(matched, context) {
  return matched.map((m) => ({
    framework: FRAMEWORKS[m.framework]?.name || m.framework,
    framework_id: m.framework,
    why_applied: m.reason,
    how_it_applies: m.application,
    color: FRAMEWORKS[m.framework]?.color || "gray",
    explanation: getFrameworkExplanation(m.framework, context),
  }));
}