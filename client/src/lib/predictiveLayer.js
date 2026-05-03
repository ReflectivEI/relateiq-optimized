/**
 * PREDICTIVE LAYER — Rule-based scenario prediction engine.
 * ─────────────────────────────────────────────────────────────────────────────
 * Predicts: likely reaction, emotional state, breakdown risk, best intervention.
 * Uses pattern scores + weighted behavioral rules — NOT purely AI.
 * Same inputs → same core predictions (deterministic base + optional AI enrichment).
 *
 * Output schema:
 * {
 *   predicted_behavior: string,
 *   risk_level: "low" | "medium" | "high",
 *   likely_misinterpretation: string,
 *   recommended_preemptive_action: string,
 *   emotional_state: string,
 *   contributing_patterns: string[],
 *   confidence: number
 * }
 */

import { computePatternProfile } from "./patternEngine";

// ─── SCENARIO CLASSIFIERS ──────────────────────────────────────────────────────
// Maps scenario signals to relevant trait axes and prediction logic.

const SCENARIO_PATTERNS = [
  // ── Unexpected topic / surprise confrontation ──
  {
    id: "unexpected_topic",
    signals: ["unexpectedly", "out of nowhere", "suddenly brought up", "surprise", "without warning", "random"],
    affects: "target",
    trait_axes: ["conflict_avoidance", "stress_reactivity", "emotional_sensitivity"],
    risk_contribution: 0.7,
    description: "Unexpected confrontation bypasses the processing buffer this person needs.",
  },
  // ── Sensitive topic ──
  {
    id: "sensitive_topic",
    signals: ["sensitive", "difficult topic", "hard conversation", "serious talk", "we need to talk"],
    affects: "both",
    trait_axes: ["emotional_sensitivity", "withdrawal_tendency", "need_for_validation"],
    risk_contribution: 0.5,
    description: "Sensitive topics activate attachment fears and require careful framing.",
  },
  // ── Conflict / argument ──
  {
    id: "active_conflict",
    signals: ["argument", "fight", "argued", "conflict", "yelled", "got angry", "blew up"],
    affects: "both",
    trait_axes: ["conflict_avoidance", "stress_reactivity", "repair_orientation"],
    risk_contribution: 0.8,
    description: "Active conflict state activates shutdown or escalation patterns.",
  },
  // ── Withdrawal / silence ──
  {
    id: "withdrawal",
    signals: ["went quiet", "stopped talking", "silent", "withdrawn", "shut down", "checked out"],
    affects: "initiator",
    trait_axes: ["withdrawal_tendency", "conflict_avoidance", "communication_expressiveness"],
    risk_contribution: 0.6,
    description: "Withdrawal is often misread as rejection rather than self-regulation.",
  },
  // ── Feeling ignored / dismissed ──
  {
    id: "feeling_dismissed",
    signals: ["ignored", "dismissed", "not listening", "not heard", "doesn't care", "doesn't get it"],
    affects: "initiator",
    trait_axes: ["need_for_validation", "emotional_sensitivity", "need_for_depth"],
    risk_contribution: 0.75,
    description: "Feeling dismissed triggers the core wound of not being seen.",
  },
  // ── Affection / closeness request ──
  {
    id: "affection_bid",
    signals: ["affection", "physical", "touch", "hug", "close", "intimacy", "connect"],
    affects: "both",
    trait_axes: ["need_for_depth", "withdrawal_tendency", "repair_orientation"],
    risk_contribution: 0.3,
    description: "Bids for connection may land differently based on current emotional state.",
  },
  // ── Criticism / feedback ──
  {
    id: "criticism",
    signals: ["criticized", "feedback", "you always", "you never", "complained about", "pointed out"],
    affects: "target",
    trait_axes: ["emotional_sensitivity", "conflict_avoidance", "need_for_validation"],
    risk_contribution: 0.7,
    description: "Criticism — even mild — activates defensiveness based on learned patterns.",
  },
  // ── Stress spillover ──
  {
    id: "stress_spillover",
    signals: ["stressed", "work", "overwhelmed", "exhausted", "too much", "burned out"],
    affects: "both",
    trait_axes: ["stress_reactivity", "withdrawal_tendency", "communication_expressiveness"],
    risk_contribution: 0.5,
    description: "External stress reduces communication bandwidth significantly.",
  },
];

// ─── PREDICTION LOGIC ─────────────────────────────────────────────────────────

/**
 * Classify a scenario text by matching signal keywords.
 */
function classifyScenario(scenarioText) {
  const lower = (scenarioText || "").toLowerCase();
  const matches = [];

  for (const pattern of SCENARIO_PATTERNS) {
    const hit = pattern.signals.some((s) => lower.includes(s));
    if (hit) matches.push(pattern);
  }

  return matches;
}

/**
 * Compute aggregate risk from matched patterns + trait scores.
 */
function computeRiskScore(patterns, initiatorProfile, targetProfile) {
  if (patterns.length === 0) return 0.3; // baseline

  let riskSum = 0;
  let count = 0;

  for (const pattern of patterns) {
    const relevantTraits = pattern.trait_axes;
    let traitRisk = 0;
    let traitCount = 0;

    for (const axis of relevantTraits) {
      const initiatorScore = initiatorProfile?.traits?.[axis]?.score;
      const targetScore = targetProfile?.traits?.[axis]?.score;

      // Different traits amplify risk differently
      if (axis === "withdrawal_tendency" || axis === "conflict_avoidance") {
        // High scores = more avoidance = higher breakdown risk
        if (initiatorScore) { traitRisk += initiatorScore / 10; traitCount++; }
        if (targetScore) { traitRisk += targetScore / 10; traitCount++; }
      } else if (axis === "stress_reactivity" || axis === "emotional_sensitivity") {
        // High = more reactive = higher risk
        if (initiatorScore) { traitRisk += initiatorScore / 10; traitCount++; }
        if (targetScore) { traitRisk += targetScore / 10; traitCount++; }
      } else if (axis === "repair_orientation" || axis === "communication_expressiveness") {
        // High = LESS risk (mitigates)
        if (initiatorScore) { traitRisk -= (initiatorScore - 5) / 20; }
        if (targetScore) { traitRisk -= (targetScore - 5) / 20; }
      }
    }

    const avgTraitRisk = traitCount > 0 ? traitRisk / traitCount : 0.5;
    riskSum += pattern.risk_contribution * (0.5 + avgTraitRisk * 0.5);
    count++;
  }

  return Math.max(0.1, Math.min(0.95, riskSum / count));
}

function riskLevel(score) {
  if (score >= 0.65) return "high";
  if (score >= 0.4) return "medium";
  return "low";
}

/**
 * Determine predicted behavior based on dominant trait scores.
 */
function predictBehavior(person, patterns, profile) {
  const traits = profile?.traits || {};
  const withdrawal = traits.withdrawal_tendency?.score ?? 5;
  const sensitivity = traits.emotional_sensitivity?.score ?? 5;
  const avoidance = traits.conflict_avoidance?.score ?? 5;
  const reactivity = traits.stress_reactivity?.score ?? 5;
  const repair = traits.repair_orientation?.score ?? 5;
  const expressiveness = traits.communication_expressiveness?.score ?? 5;

  const hasUnexpected = patterns.some((p) => p.id === "unexpected_topic");
  const hasConflict = patterns.some((p) => p.id === "active_conflict");
  const hasWithdrawal = patterns.some((p) => p.id === "withdrawal");
  const hasDismissed = patterns.some((p) => p.id === "feeling_dismissed");
  const hasCriticism = patterns.some((p) => p.id === "criticism");

  // Predict primary behavior using rule-based branching
  if (withdrawal >= 7 && (hasConflict || hasUnexpected || hasCriticism)) {
    return `${person} will likely go quiet and disengage internally — this is a protective shutdown pattern, not indifference. They need space before they can re-engage meaningfully.`;
  }
  if (sensitivity >= 7 && hasDismissed) {
    return `${person} will likely feel deeply hurt and struggle to stay present. They may internalize the experience as confirmation of their core fear of not being truly seen.`;
  }
  if (avoidance >= 7 && hasConflict) {
    return `${person} will likely defer, deflect, or try to smooth things over without addressing the core issue — a pattern that delays but doesn't resolve tension.`;
  }
  if (reactivity >= 7 && hasConflict) {
    return `${person} may escalate verbally before being able to regulate — their stress response is highly coupled with their communication patterns.`;
  }
  if (repair >= 7 && !hasConflict) {
    return `${person} is likely to initiate reconnection relatively quickly. Their strong repair orientation means they'll make a bid for closeness once activated.`;
  }
  if (expressiveness <= 4 && (hasDismissed || hasWithdrawal)) {
    return `${person} is likely to show distress through behavior rather than words — going flat, giving shorter responses, reducing warmth. This may read as "fine" from the outside while significant processing is happening internally.`;
  }

  return `${person} will likely respond based on their current emotional bandwidth. With ${patterns.length} active scenario signals, the situation warrants a thoughtful, low-pressure approach.`;
}

/**
 * Determine likely misinterpretation between partners.
 */
function predictMisinterpretation(scenario, initiatorProfile, targetProfile, initiator, target) {
  const iWithdrawal = initiatorProfile?.traits?.withdrawal_tendency?.score ?? 5;
  const tSensitivity = targetProfile?.traits?.emotional_sensitivity?.score ?? 5;
  const iAvoidance = initiatorProfile?.traits?.conflict_avoidance?.score ?? 5;
  const tValidation = targetProfile?.traits?.need_for_validation?.score ?? 5;

  if (iWithdrawal >= 7 && tValidation >= 7) {
    return `${target} is likely to interpret ${initiator}'s silence or withdrawal as rejection or "not caring," when ${initiator} is actually in a protective regulation state — trying to manage overwhelm before re-engaging.`;
  }
  if (iAvoidance >= 7 && tSensitivity >= 7) {
    return `${target} may read ${initiator}'s conflict-avoidant behavior as dismissal of the issue, when it actually reflects learned avoidance patterns from their upbringing — not a judgment of what matters.`;
  }
  if (tSensitivity >= 7) {
    return `${target} is highly attuned to tone and energy — they may pick up on ${initiator}'s stress or hesitation and interpret it as something being wrong in the relationship, even if it's about something unrelated.`;
  }

  return `There's potential for ${target} to over- or under-read ${initiator}'s behavior. Given both their patterns, communication about intent (not just content) will be important here.`;
}

/**
 * Recommend a preemptive action based on risk and patterns.
 */
function recommendPreemptiveAction(patterns, initiator, target, initiatorProfile, targetProfile) {
  const tValidation = targetProfile?.traits?.need_for_validation?.score ?? 5;
  const tAvoidance = targetProfile?.traits?.conflict_avoidance?.score ?? 5;
  const tSensitivity = targetProfile?.traits?.emotional_sensitivity?.score ?? 5;
  const iRepair = initiatorProfile?.traits?.repair_orientation?.score ?? 5;

  const hasUnexpected = patterns.some((p) => p.id === "unexpected_topic");
  const hasConflict = patterns.some((p) => p.id === "active_conflict");
  const hasSensitive = patterns.some((p) => p.id === "sensitive_topic");

  if (hasUnexpected && tAvoidance >= 6) {
    return `Signal your intention before engaging: "Hey, I want to talk about something — is now a good time?" This gives ${target} the processing window they need to show up fully rather than reactively.`;
  }
  if (hasSensitive && tValidation >= 7) {
    return `Open with validation before introducing your perspective: "I want to understand how you're feeling about this before I share what's going on for me." This activates ${target}'s receptivity by meeting their need to feel seen first.`;
  }
  if (hasConflict && tSensitivity >= 7) {
    return `Lower the physiological intensity before engaging: choose a calm, neutral setting, keep your voice soft, and make deliberate eye contact. ${target}'s high tone-sensitivity means HOW you say things matters as much as what you say.`;
  }
  if (iRepair >= 7) {
    return `Your natural repair orientation is an asset here — use it early. A small bid for connection before the serious conversation (a touch, a "we're okay" check-in) will lower both people's defenses before the harder content.`;
  }

  return `Before engaging, ensure both of you are regulated. Ask: "Are we both in a place to have this conversation right now?" The quality of the connection window matters more than the timing you planned.`;
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

/**
 * Predict outcomes for a given scenario.
 * Fully deterministic — no AI calls. Same inputs → same outputs.
 *
 * @param {Object} params
 * @param {string} params.scenario - Text description of the situation
 * @param {string} params.initiator - acting person name
 * @param {string} params.target - receiving person name
 * @param {Array}  params.tonyResponses - legacy Person A responses
 * @param {Array}  params.drewResponses - legacy Person B responses
 * @param {Array}  params.responsesA - generic Person A responses
 * @param {Array}  params.responsesB - generic Person B responses
 * @param {string} params.participantA - generic Person A name
 * @param {string} params.participantB - generic Person B name
 * @returns {Object} Prediction schema
 */
export function predictScenario({
  scenario,
  initiator,
  target,
  tonyResponses = [],
  drewResponses = [],
  responsesA,
  responsesB,
  participantA,
  participantB,
}) {
  const bucketA = Array.isArray(responsesA) ? responsesA : tonyResponses;
  const bucketB = Array.isArray(responsesB) ? responsesB : drewResponses;

  const resolvedParticipantA = participantA || bucketA[0]?.person_name || "Person A";
  const resolvedParticipantB = participantB || bucketB[0]?.person_name || "Other Person";

  const resolveResponsesForPerson = (personName) => {
    if (!personName) return [];
    if (personName === resolvedParticipantA) return bucketA;
    if (personName === resolvedParticipantB) return bucketB;
    if (personName === "Tony") return bucketA;
    if (personName === "Drew") return bucketB;
    return personName === initiator ? bucketA : bucketB;
  };

  const initiatorResponses = resolveResponsesForPerson(initiator);
  const targetResponses = resolveResponsesForPerson(target);

  const initiatorProfile = computePatternProfile(initiator, initiatorResponses);
  const targetProfile = computePatternProfile(target, targetResponses);

  const matchedPatterns = classifyScenario(scenario);
  const riskScore = computeRiskScore(matchedPatterns, initiatorProfile, targetProfile);
  const level = riskLevel(riskScore);

  const predicted_behavior = predictBehavior(target, matchedPatterns, targetProfile);
  const likely_misinterpretation = predictMisinterpretation(
    scenario, initiatorProfile, targetProfile, initiator, target
  );
  const recommended_preemptive_action = recommendPreemptiveAction(
    matchedPatterns, initiator, target, initiatorProfile, targetProfile
  );

  // Emotional state inference
  const tWithdrawal = targetProfile.traits?.withdrawal_tendency?.score ?? 5;
  const tSensitivity = targetProfile.traits?.emotional_sensitivity?.score ?? 5;
  let emotional_state = "Regulated — likely able to engage constructively.";
  if (level === "high" && tWithdrawal >= 7) {
    emotional_state = "High risk of shutdown — may be in dorsal vagal (dorsal withdrawal) state, where engagement feels impossible.";
  } else if (level === "high" && tSensitivity >= 7) {
    emotional_state = "Activated — likely in sympathetic arousal (fight/flight), where logical conversation is difficult.";
  } else if (level === "medium") {
    emotional_state = "Moderately activated — may need brief grounding before productive conversation.";
  }

  const contributing_patterns = matchedPatterns.map((p) => p.description);

  // Which specific inputs influenced this prediction
  const influencing_inputs = [];
  for (const pattern of matchedPatterns) {
    for (const axis of pattern.trait_axes) {
      const ts = targetProfile.traits?.[axis];
      const is = initiatorProfile.traits?.[axis];
      if (ts) influencing_inputs.push(`${target}.${axis}: ${ts.score}/10 (confidence: ${ts.confidence})`);
      if (is) influencing_inputs.push(`${initiator}.${axis}: ${is.score}/10 (confidence: ${is.confidence})`);
    }
  }

  return {
    predicted_behavior,
    risk_level: level,
    risk_score: parseFloat(riskScore.toFixed(2)),
    emotional_state,
    likely_misinterpretation,
    recommended_preemptive_action,
    contributing_patterns,
    matched_scenario_types: matchedPatterns.map((p) => p.id),
    influencing_inputs: [...new Set(influencing_inputs)],
    confidence: parseFloat(Math.min(0.95, 0.4 + matchedPatterns.length * 0.1 + initiatorResponses.length * 0.003).toFixed(2)),
    computed_at: new Date().toISOString(),
  };
}