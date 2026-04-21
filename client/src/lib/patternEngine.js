/**
 * PATTERN ENGINE — Deterministic scoring from questionnaire responses.
 * ─────────────────────────────────────────────────────────────────────────────
 * Locked to exactly 8 traits. Rule-based only. NO AI. NO randomness.
 * Same inputs → same outputs always.
 *
 * Traits:
 *   communication_expressiveness
 *   conflict_avoidance
 *   emotional_sensitivity
 *   need_for_validation
 *   withdrawal_tendency
 *   openness_to_feedback
 *   emotional_regulation
 *   relational_dependency
 */

import { PATTERN_RULES } from "./patternRules.js";

// ─── TRAIT DEFINITIONS ───────────────────────────────────────────────────────
// Locked — do not add, rename, or remove traits.

export const TRAIT_DEFINITIONS = {
  communication_expressiveness: {
    label: "Communication Expressiveness",
    description: "How openly and directly this person communicates feelings and needs",
    baseline: 5,
  },
  conflict_avoidance: {
    label: "Conflict Avoidance",
    description: "Tendency to avoid, delay, or sidestep conflict and difficult conversations",
    baseline: 5,
  },
  emotional_sensitivity: {
    label: "Emotional Sensitivity",
    description: "Sensitivity to tone, atmosphere, and partner's emotional state",
    baseline: 5,
  },
  need_for_validation: {
    label: "Need for Validation",
    description: "Importance of feeling heard, seen, and acknowledged by partner",
    baseline: 5,
  },
  withdrawal_tendency: {
    label: "Withdrawal Tendency",
    description: "Tendency to pull back emotionally or physically under stress or hurt",
    baseline: 5,
  },
  openness_to_feedback: {
    label: "Openness to Feedback",
    description: "Willingness to receive, sit with, and act on critical feedback",
    baseline: 5,
  },
  emotional_regulation: {
    label: "Emotional Regulation",
    description: "Ability to manage emotional reactions and recover from escalation",
    baseline: 5,
  },
  relational_dependency: {
    label: "Relational Dependency",
    description: "Degree to which this person's wellbeing is tied to the partner's presence and validation",
    baseline: 5,
  },
};

const TRAIT_KEYS = Object.keys(TRAIT_DEFINITIONS);

// ─── SCORING COMPUTATION ─────────────────────────────────────────────────────

/**
 * Compute deterministic trait scores from questionnaire responses.
 * Same inputs always produce same outputs — fully rule-based, no randomness.
 *
 * @param {string} person - "Tony" | "Drew"
 * @param {Array} responses - QuestionnaireResponse records
 * @returns {Object} Full scored profile
 */
export function computePatternProfile(person, responses = []) {
  if (!responses || responses.length === 0) {
    return {
      person,
      traits: Object.fromEntries(TRAIT_KEYS.map((k) => [k, {
        trait: k,
        label: TRAIT_DEFINITIONS[k].label,
        description: TRAIT_DEFINITIONS[k].description,
        score: TRAIT_DEFINITIONS[k].baseline,
        confidence: 0,
        evidence: [],
      }])),
      total_responses: 0,
      computed_at: new Date().toISOString(),
    };
  }

  // Index responses by question_id for O(1) lookup
  const responseMap = {};
  responses.forEach((r) => {
    if (r.question_id) responseMap[r.question_id] = r;
  });

  // Group rules by trait
  const rulesByTrait = {};
  TRAIT_KEYS.forEach((k) => { rulesByTrait[k] = []; });
  PATTERN_RULES.forEach((rule) => {
    if (rulesByTrait[rule.trait]) rulesByTrait[rule.trait].push(rule);
  });

  const traits = {};

  for (const traitKey of TRAIT_KEYS) {
    const def = TRAIT_DEFINITIONS[traitKey];
    const rules = rulesByTrait[traitKey];
    let score = def.baseline;
    const evidence = [];
    let rulesWithData = 0;

    for (const rule of rules) {
      const response = responseMap[rule.question_id];
      if (!response) continue;

      rulesWithData++; // This rule had data available
      const answer = response.answer || "";

      if (rule.condition(answer)) {
        score += rule.weight;
        evidence.push({
          question_id: rule.question_id,
          answer_snippet: answer.slice(0, 80),
          rule_triggered: rule.label,
          weight: rule.weight,
          question_text: response.question_text || "",
        });
      }
    }

    // Clamp score 1–10
    const finalScore = Math.max(1, Math.min(10, Math.round(score)));

    // Confidence = rules that had answer data / total rules for this trait
    const confidence = rules.length > 0
      ? parseFloat((rulesWithData / rules.length).toFixed(2))
      : 0;

    traits[traitKey] = {
      trait: traitKey,
      label: def.label,
      description: def.description,
      score: finalScore,
      confidence,
      evidence,
      // Scoring math — for "Why this score?" transparency
      _debug: {
        baseline: def.baseline,
        total_delta: score - def.baseline,
        rules_total: rules.length,
        rules_with_data: rulesWithData,
        rules_matched: evidence.length,
      },
    };
  }

  return {
    person,
    traits,
    total_responses: responses.length,
    computed_at: new Date().toISOString(),
  };
}

// ─── MISALIGNMENT DETECTOR ────────────────────────────────────────────────────

/**
 * Compare two pattern profiles and return misalignment signals.
 * Deterministic — based purely on score deltas.
 */
export function detectMisalignments(profileA, nameA, profileB, nameB) {
  const misalignments = [];
  const alignments = [];

  const traitsA = profileA?.traits || {};
  const traitsB = profileB?.traits || {};

  for (const key of TRAIT_KEYS) {
    const a = traitsA[key]?.score ?? 5;
    const b = traitsB[key]?.score ?? 5;
    const diff = Math.abs(a - b);
    const label = TRAIT_DEFINITIONS[key]?.label || key;

    if (diff >= 3) {
      const higher = a > b ? nameA : nameB;
      const lower = a > b ? nameB : nameA;
      misalignments.push({
        trait: key,
        label,
        [nameA]: a,
        [nameB]: b,
        gap: diff,
        severity: diff >= 5 ? "high" : "medium",
        description: `${higher} scores significantly higher on "${label}" than ${lower} (${a} vs ${b}) — a ${diff}-point gap that may create friction.`,
      });
    } else if (diff <= 1 && a >= 6) {
      alignments.push({
        trait: key,
        label,
        score: Math.round((a + b) / 2),
        description: `Both share high "${label}" (~${Math.round((a + b) / 2)}/10) — a point of natural alignment.`,
      });
    }
  }

  return {
    misalignments: misalignments.sort((a, b) => b.gap - a.gap),
    alignments,
    highest_risk_trait: misalignments[0]?.label || null,
  };
}

// ─── CATEGORY SIGNAL EXTRACTOR ────────────────────────────────────────────────

export function extractCategorySignals(responses, category) {
  return responses
    .filter((r) => r.category === category && r.answer?.length > 3)
    .map((r) => ({
      question_id: r.question_id,
      question: r.question_text,
      answer: r.answer,
      weight: r.weight,
      tags: r.tags || [],
    }));
}