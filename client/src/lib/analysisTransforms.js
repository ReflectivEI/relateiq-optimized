/**
 * ANALYSIS TRANSFORM LAYER
 * ─────────────────────────────────────────────────────────────────────────────
 * Pure functions. NO AI calls. NO randomness. NO side effects.
 * Every function takes the BASE structured output from generateAnalysis()
 * and returns a display-ready transformed version.
 *
 * Source of truth: the base object from generateAnalysis().
 * All 5 modes are DERIVED from it — never regenerated.
 *
 * Guard: if (mode !== 'deep') { assert(baseOutputExists === true) }
 */

const IS_DIRECTIONAL = (p) => typeof p === "string" && p.includes("→");

// ─── GUARD ────────────────────────────────────────────────────────────────────

/**
 * Throws if a non-deep mode is requested without a base output.
 * Call this before applying any transform on the page layer.
 */
export function assertBaseExists(base, mode) {
  if (mode !== "deep" && (!base || !base.core_insight)) {
    throw new Error(
      `[analysisTransforms] Cannot apply mode "${mode}" — base output does not exist. Generate analysis first.`
    );
  }
  return true;
}

// ─── toDeep() ─────────────────────────────────────────────────────────────────
/**
 * Full structured output. All fields displayed.
 * Every array shown in full. Directional fields appended when present.
 */
export function toDeep(base) {
  if (!base) return null;
  const isDir = IS_DIRECTIONAL(base.perspective);

  const sections = [
    {
      title: "Behavioral Patterns",
      items: base.behavioral_patterns,
      description: "Observed behavioral tendencies from questionnaire data",
    },
    {
      title: "Relationship Dynamics",
      items: base.relationship_dynamics,
      description: "Interaction patterns between the two people",
    },
    {
      title: "Risk Flags",
      items: base.risk_flags,
      description: "Specific conditions likely to cause breakdown",
    },
    {
      title: "Strengths",
      items: base.strengths,
      description: "Genuine assets from actual data",
    },
    {
      title: "Recommended Actions",
      items: base.recommended_actions,
      description: "Specific, immediately actionable steps",
    },
  ];

  if (isDir) {
    if (base.directional_impact)
      sections.push({ title: "What This Means for Them", items: [base.directional_impact] });
    if (base.misalignment_areas?.length)
      sections.push({ title: "Misalignment Areas", items: base.misalignment_areas });
    if (base.perception_gap)
      sections.push({ title: "Perception Gap", items: [base.perception_gap] });
    if (base.communication_risk_points?.length)
      sections.push({ title: "Communication Risk Points", items: base.communication_risk_points });
  }

  sections.push({ title: "Source Signals", items: base.source_signals });
  sections.push({ title: "Frameworks Applied", items: base.frameworks_used });

  return {
    ...base,
    _mode: "deep",
    _label: "In-Depth Analysis",
    _derived_from: base.generated_at,
    _no_ai_call: true,
    display: {
      headline: base.core_insight,
      sections,
      confidence: base.confidence_score,
    },
  };
}

// ─── toExplain() ──────────────────────────────────────────────────────────────
/**
 * Simplified reasoning. Uses "This suggests…" / "This likely means…" framing.
 * No jargon. Structured for plain-English comprehension.
 * Items are prefixed with interpretive language — structurally different from toDeep.
 */
export function toExplain(base) {
  if (!base) return null;
  const isDir = IS_DIRECTIONAL(base.perspective);

  // Transform each array item with interpretive framing
  const explainedPatterns = base.behavioral_patterns.slice(0, 3).map(
    (p) => `This suggests: ${p}`
  );
  const explainedDynamics = base.relationship_dynamics.slice(0, 3).map(
    (d) => `This likely means: ${d}`
  );
  const explainedRisks = base.risk_flags.slice(0, 2).map(
    (r) => `Watch for this: ${r}`
  );
  const explainedStrengths = base.strengths.slice(0, 3).map(
    (s) => `This is working: ${s}`
  );

  const sections = [
    { title: "What's Actually Happening", items: explainedPatterns },
    { title: "What This Likely Means", items: explainedDynamics },
    { title: "What to Watch For", items: explainedRisks },
    { title: "What's Working", items: explainedStrengths },
  ];

  if (isDir && base.directional_impact) {
    sections.push({
      title: "What This Means for Them",
      items: [`This likely means: ${base.directional_impact}`],
    });
  }

  if (isDir && base.perception_gap) {
    sections.push({
      title: "Why It Gets Misread",
      items: [`This suggests a gap: ${base.perception_gap}`],
    });
  }

  return {
    ...base,
    _mode: "explain",
    _label: "Explain This",
    _derived_from: base.generated_at,
    _no_ai_call: true,
    display: {
      headline: `In plain terms: ${base.core_insight}`,
      sections,
      confidence: base.confidence_score,
    },
  };
}

// ─── toRecap() ────────────────────────────────────────────────────────────────
/**
 * Max 4 bullets. Strict priority order:
 *   1. core_insight (as headline)
 *   2. top 2 risk_flags
 *   3. 1 recommended_action
 * No other fields. 60-second read time enforced by structure.
 */
export function toRecap(base) {
  if (!base) return null;
  const isDir = IS_DIRECTIONAL(base.perspective);

  // Exactly 4 bullets max — priority order
  const bullets = [];

  // Bullet 1: Top behavioral pattern (context setter)
  if (base.behavioral_patterns[0]) {
    bullets.push(`⬤ Pattern: ${base.behavioral_patterns[0]}`);
  }

  // Bullets 2–3: Top 2 risks (most actionable)
  base.risk_flags.slice(0, 2).forEach((r) => {
    bullets.push(`⚠ Risk: ${r}`);
  });

  // Bullet 4: Single best action
  if (base.recommended_actions[0]) {
    bullets.push(`→ Do this: ${base.recommended_actions[0]}`);
  }

  // Directional bonus: perception gap if present (replaces bullet 1 if more relevant)
  const directionalNote =
    isDir && base.perception_gap ? `Gap: ${base.perception_gap}` : null;

  return {
    ...base,
    _mode: "recap",
    _label: "60-Second Recap",
    _derived_from: base.generated_at,
    _no_ai_call: true,
    display: {
      headline: base.core_insight,
      sections: [
        {
          title: "The 4 Things to Know Right Now",
          items: bullets.slice(0, 4),
        },
        ...(directionalNote
          ? [{ title: "Core Interaction Gap", items: [directionalNote] }]
          : []),
      ],
      confidence: base.confidence_score,
    },
  };
}

// ─── toSummary() ──────────────────────────────────────────────────────────────
/**
 * 2–3 sentence prose summary. Structurally a paragraph, not a list.
 * Must include: core_insight + dominant tone/pattern signal.
 * Synthesizes rather than lists — structurally distinct from all other modes.
 */
export function toSummary(base) {
  if (!base) return null;
  const isDir = IS_DIRECTIONAL(base.perspective);

  // Synthesize 2-3 sentences from base fields
  const sentence1 = base.core_insight;

  const topPattern = base.behavioral_patterns[0] || "";
  const topDynamic = base.relationship_dynamics[0] || "";
  const sentence2 = topPattern && topDynamic
    ? `The dominant pattern is: ${topPattern}. This plays out as: ${topDynamic}`
    : topPattern
    ? `The dominant pattern observed is: ${topPattern}`
    : topDynamic
    ? `The key dynamic at play: ${topDynamic}`
    : "";

  const topRisk = base.risk_flags[0] || "";
  const topStrength = base.strengths[0] || "";
  const sentence3 = topRisk && topStrength
    ? `The primary risk is "${topRisk}", while the key strength to leverage is "${topStrength}".`
    : topRisk
    ? `The primary risk to monitor: "${topRisk}".`
    : topStrength
    ? `A key strength to build on: "${topStrength}".`
    : "";

  const directionalNote = isDir && base.directional_impact
    ? `Impact on partner: ${base.directional_impact}`
    : null;

  const summaryParagraph = [sentence1, sentence2, sentence3]
    .filter(Boolean)
    .join(" ");

  return {
    ...base,
    _mode: "summary",
    _label: "Summary",
    _derived_from: base.generated_at,
    _no_ai_call: true,
    display: {
      headline: summaryParagraph,
      sections: [
        ...(directionalNote
          ? [{ title: "Directional Impact", items: [directionalNote] }]
          : []),
        ...(base.recommended_actions.length > 0
          ? [{ title: "Key Actions", items: base.recommended_actions.slice(0, 2) }]
          : []),
      ],
      confidence: base.confidence_score,
      is_prose: true, // tells AnalysisOutputCard to render headline as paragraph
    },
  };
}

// ─── toActionPlan() ───────────────────────────────────────────────────────────
/**
 * Step-by-step 3-part plan. Structured as:
 *   Step 1: Immediate action (from recommended_actions[0])
 *   Step 2: Short-term behavior shift (from recommended_actions[1] or risk_flags[0] reframed)
 *   Step 3: Long-term adjustment (from recommended_actions[2] or risk_flags[1] reframed)
 * Sources ONLY from recommended_actions and risk_flags — never behavioral_patterns or dynamics.
 */
export function toActionPlan(base) {
  if (!base) return null;
  const isDir = IS_DIRECTIONAL(base.perspective);

  const actions = base.recommended_actions;
  const risks = base.risk_flags;

  // Step 1: Immediate — first action
  const step1 = actions[0]
    ? `Immediate: ${actions[0]}`
    : `Immediate: Address the core tension directly — don't wait.`;

  // Step 2: Short-term — second action, or risk reframed as behavior shift
  const step2 = actions[1]
    ? `Short-term shift: ${actions[1]}`
    : risks[0]
    ? `Short-term shift: Actively prevent this risk — ${risks[0]}`
    : null;

  // Step 3: Long-term — third action, or second risk reframed
  const step3 = actions[2]
    ? `Long-term adjustment: ${actions[2]}`
    : risks[1]
    ? `Long-term adjustment: Build resilience against — ${risks[1]}`
    : null;

  const steps = [step1, step2, step3].filter(Boolean);

  // Remaining actions (4+) as supplementary
  const additionalActions = actions.slice(3);
  const warningItems = risks.map((r) => `⚠ ${r}`);

  return {
    ...base,
    _mode: "action",
    _label: "What Should I Do?",
    _derived_from: base.generated_at,
    _no_ai_call: true,
    display: {
      headline: `Your action plan: ${actions[0] || base.core_insight}`,
      sections: [
        {
          title: "3-Step Plan",
          items: steps,
        },
        ...(additionalActions.length > 0
          ? [{ title: "Additional Steps", items: additionalActions }]
          : []),
        {
          title: "Risks to Actively Avoid",
          items: warningItems,
        },
        ...(isDir && base.communication_risk_points?.length
          ? [{ title: "Communication Risk Points", items: base.communication_risk_points }]
          : []),
      ],
      confidence: base.confidence_score,
    },
  };
}

// ─── REGISTRY ─────────────────────────────────────────────────────────────────

export const TRANSFORMERS = {
  deep: toDeep,
  explain: toExplain,
  recap: toRecap,
  summary: toSummary,
  action: toActionPlan,
};

/**
 * Apply a named mode to a base analysis object.
 * This is the ONLY entry point for the UI — never call transformers directly.
 * Includes the base guard for non-deep modes.
 */
export function applyMode(base, mode) {
  assertBaseExists(base, mode);
  const fn = TRANSFORMERS[mode] || toDeep;
  const result = fn(base);
  console.log("[analysisTransforms] applyMode() called", {
    mode,
    _no_ai_call: result._no_ai_call,
    _derived_from: result._derived_from,
    headline_preview: result.display?.headline?.slice(0, 80),
    sections_count: result.display?.sections?.length,
  });
  return result;
}
