/**
 * predictiveEngine.js
 * ─────────────────────────────────────────────────────────────────
 * FULLY DETERMINISTIC rule-based prediction engine.
 * ZERO AI, ZERO randomness. Same inputs → identical outputs always.
 *
 * Public API:
 *   predictOutcome({ actor, target, scenario, actorScores, targetScores })
 *
 * Where actorScores / targetScores are the .traits object from computePatternProfile().
 */

import { matchScenario } from "./predictiveScenarios";

const METHODOLOGY_LIBRARY = {
  gottman: {
    id: "gottman",
    label: "Gottman Method",
    source: "Gottman Lab longitudinal conflict and repair research",
    focus: "repair bids, de-escalation, conflict stability",
  },
  eft: {
    id: "eft",
    label: "Emotionally Focused Therapy",
    source: "Sue Johnson attachment-focused EFT model",
    focus: "attachment safety, protest-withdraw cycles",
  },
  cbt: {
    id: "cbt",
    label: "Cognitive Behavioral Techniques",
    source: "CBT misinterpretation and cognitive reappraisal work",
    focus: "thought-emotion-behavior loops",
  },
  dbt: {
    id: "dbt",
    label: "DBT Distress Tolerance",
    source: "Linehan DBT emotion regulation framework",
    focus: "de-escalation under high affect",
  },
  nvc: {
    id: "nvc",
    label: "Nonviolent Communication",
    source: "Marshall Rosenberg observation-feeling-need-request protocol",
    focus: "needs clarity and low-blame requests",
  },
  polyvagal: {
    id: "polyvagal",
    label: "Polyvagal Lens",
    source: "Polyvagal state regulation and social engagement theory",
    focus: "nervous system state and co-regulation readiness",
  },
  motivational_interviewing: {
    id: "motivational_interviewing",
    label: "Motivational Interviewing",
    source: "Miller and Rollnick change talk and resistance-reduction",
    focus: "autonomy-supportive behavior change",
  },
};

// ── Trait key helpers ────────────────────────────────────────────

function score(traits, key) {
  return traits?.[key]?.score ?? 5;
}

// ── Rule Registry ────────────────────────────────────────────────
// Each rule: { id, condition(actorT, targetT, scenarioId) → bool, output field, value, influence }

const BEHAVIOR_RULES = [
  {
    id: "R-B01",
    description: "High conflict_avoidance + conflict scenario → deflect/defer",
    condition: (a, t, sid) =>
      score(a, "conflict_avoidance") >= 7 &&
      ["active_conflict", "tone_escalation", "criticism_about_habits", "unexpected_criticism"].includes(sid),
    output: "predicted_behavior",
    value: (actor) => `${actor} will likely deflect, defer, or try to smooth things over without addressing the core issue — a learned avoidance pattern that delays but does not resolve tension.`,
    influence: "conflict_avoidance ≥ 7 + conflict scenario → deflect/defer",
  },
  {
    id: "R-B02",
    description: "High withdrawal_tendency + conflict/unexpected → protective shutdown",
    condition: (a, t, sid) =>
      score(a, "withdrawal_tendency") >= 7 &&
      ["unexpected_surprise", "unexpected_criticism", "tone_escalation", "active_conflict", "withdrawal_during_conflict"].includes(sid),
    output: "predicted_behavior",
    value: (actor) => `${actor} will likely go internally quiet and disengage — a protective shutdown response, not indifference. They need unstructured space before re-engagement is possible.`,
    influence: "withdrawal_tendency ≥ 7 + conflict/surprise scenario → protective shutdown",
  },
  {
    id: "R-B03",
    description: "High emotional_sensitivity + feeling_dismissed → internalization",
    condition: (a, t, sid) =>
      score(a, "emotional_sensitivity") >= 7 &&
      ["feeling_dismissed", "affection_bid_rejected"].includes(sid),
    output: "predicted_behavior",
    value: (actor) => `${actor} will likely feel deeply hurt and struggle to stay present. They may internalize the experience as confirmation of their fear of not being truly seen or valued.`,
    influence: "emotional_sensitivity ≥ 7 + dismissal/rejection scenario → internalization",
  },
  {
    id: "R-B04",
    description: "High stress_reactivity + stress/conflict → verbal escalation",
    condition: (a, t, sid) =>
      score(a, "stress_reactivity") >= 7 &&
      ["stress_spillover", "tone_escalation", "unexpected_criticism", "last_minute_change"].includes(sid),
    output: "predicted_behavior",
    value: (actor) => `${actor} may escalate verbally before being able to regulate — their stress response is tightly coupled to communication, making measured language difficult in the moment.`,
    influence: "stress_reactivity ≥ 7 + stress/escalation scenario → verbal escalation",
  },
  {
    id: "R-B05",
    description: "Low communication_expressiveness + dismissal/withdrawal → behavioral signaling",
    condition: (a, t, sid) =>
      score(a, "communication_expressiveness") <= 4 &&
      ["feeling_dismissed", "withdrawal_during_conflict", "emotional_shutdown"].includes(sid),
    output: "predicted_behavior",
    value: (actor) => `${actor} is likely to show distress behaviorally rather than verbally — shorter responses, reduced warmth, going flat. This may read as "fine" externally while significant processing happens internally.`,
    influence: "communication_expressiveness ≤ 4 + withdrawal/dismissal → behavioral signaling",
  },
  {
    id: "R-B06",
    description: "High repair_orientation + low-conflict scenario → reconnection bid",
    condition: (a, t, sid) =>
      score(a, "repair_orientation") >= 7 &&
      ["affection_bid_rejected", "sensitive_topic_raised", "feeling_dismissed"].includes(sid),
    output: "predicted_behavior",
    value: (actor) => `${actor} is likely to initiate a reconnection bid relatively quickly. Their strong repair orientation activates them to bridge distance once the immediate intensity settles.`,
    influence: "repair_orientation ≥ 7 + low-conflict scenario → reconnection bid",
  },
];

const EMOTIONAL_STATE_RULES = [
  {
    id: "R-E01",
    description: "withdrawal_tendency ≥ 7 + conflict → dorsal shutdown risk",
    condition: (a, t, sid) =>
      score(t, "withdrawal_tendency") >= 7 &&
      ["unexpected_surprise", "unexpected_criticism", "tone_escalation", "withdrawal_during_conflict"].includes(sid),
    value: "High shutdown risk — likely entering a dorsal withdrawal state where verbal engagement feels impossible. This is a nervous system response, not a choice.",
    influence: "withdrawal_tendency ≥ 7 → dorsal shutdown state",
  },
  {
    id: "R-E02",
    description: "emotional_sensitivity ≥ 7 + conflict → sympathetic activation",
    condition: (a, t, sid) =>
      score(t, "emotional_sensitivity") >= 7 &&
      ["tone_escalation", "unexpected_criticism", "criticism_about_habits", "feeling_dismissed"].includes(sid),
    value: "Activated — likely in sympathetic arousal (fight/flight), where logical reasoning is compromised. Emotional tone is being registered more than content.",
    influence: "emotional_sensitivity ≥ 7 + criticism/escalation → sympathetic arousal",
  },
  {
    id: "R-E03",
    description: "stress_reactivity ≥ 7 + stress scenario → flooded state",
    condition: (a, t, sid) =>
      score(t, "stress_reactivity") >= 7 &&
      ["stress_spillover", "last_minute_change", "unexpected_surprise"].includes(sid),
    value: "Flooded — stress response has reduced emotional bandwidth. Rational discussion is unlikely to land; stabilization comes first.",
    influence: "stress_reactivity ≥ 7 + stress scenario → cognitive flooding",
  },
  {
    id: "R-E04",
    description: "need_for_validation ≥ 7 + dismissal → attachment threat activated",
    condition: (a, t, sid) =>
      score(t, "need_for_validation") >= 7 &&
      ["feeling_dismissed", "affection_bid_rejected", "avoidance_after_disagreement"].includes(sid),
    value: "Attachment threat activated — feelings of rejection, abandonment, or unworthiness are likely to surface. This person needs explicit reassurance before content resolution.",
    influence: "need_for_validation ≥ 7 + dismissal/avoidance → attachment threat",
  },
];

const MISINTERPRETATION_RULES = [
  {
    id: "R-M01",
    description: "actor withdrawal_tendency ≥ 7 + target need_for_validation ≥ 7 → silence = rejection",
    condition: (a, t) =>
      score(a, "withdrawal_tendency") >= 7 && score(t, "need_for_validation") >= 7,
    value: (actor, target) =>
      `${target} is likely to interpret ${actor}'s silence or withdrawal as rejection or "not caring," when ${actor} is in a protective regulation state — trying to manage overwhelm before being able to re-engage.`,
    influence: "actor withdrawal ≥ 7 × target validation need ≥ 7 → silence misread as rejection",
  },
  {
    id: "R-M02",
    description: "actor conflict_avoidance ≥ 7 + target emotional_sensitivity ≥ 7 → avoidance = dismissal",
    condition: (a, t) =>
      score(a, "conflict_avoidance") >= 7 && score(t, "emotional_sensitivity") >= 7,
    value: (actor, target) =>
      `${target} may read ${actor}'s conflict-avoidant behavior as dismissal of the issue's importance, when it reflects learned avoidance patterns — not a judgment about what matters.`,
    influence: "actor avoidance ≥ 7 × target sensitivity ≥ 7 → avoidance misread as dismissal",
  },
  {
    id: "R-M03",
    description: "target emotional_sensitivity ≥ 7 → tone misread as relationship signal",
    condition: (a, t) => score(t, "emotional_sensitivity") >= 7,
    value: (actor, target) =>
      `${target} is highly attuned to tone and energy — they may pick up on ${actor}'s stress or hesitation and interpret it as something being wrong in the relationship, even if unrelated.`,
    influence: "target emotional_sensitivity ≥ 7 → environmental stress misread as relationship signal",
  },
  {
    id: "R-M04",
    description: "actor communication_expressiveness ≤ 4 + target need_for_validation ≥ 6 → silence = anger",
    condition: (a, t) =>
      score(a, "communication_expressiveness") <= 4 && score(t, "need_for_validation") >= 6,
    value: (actor, target) =>
      `${target} may interpret ${actor}'s minimal verbal expression as anger or resentment, when ${actor} simply processes internally before speaking — they are not withholding, they are still formulating.`,
    influence: "actor expressiveness ≤ 4 × target validation need ≥ 6 → silence misread as anger",
  },
];

const PREEMPTIVE_ACTION_RULES = [
  {
    id: "R-P01",
    description: "target conflict_avoidance ≥ 6 + unexpected scenario → give processing window",
    condition: (a, t, sid) =>
      score(t, "conflict_avoidance") >= 6 &&
      ["unexpected_surprise", "unexpected_criticism", "sensitive_topic_raised"].includes(sid),
    value: (actor, target) =>
      `Signal your intention before engaging: "Hey, I'd like to talk about something — is now a good time?" This gives ${target} the processing window needed to show up fully rather than reactively.`,
    influence: "target avoidance ≥ 6 + unexpected scenario → pre-signal intent",
  },
  {
    id: "R-P02",
    description: "target need_for_validation ≥ 7 + sensitive scenario → validate first",
    condition: (a, t, sid) =>
      score(t, "need_for_validation") >= 7 &&
      ["sensitive_topic_raised", "feeling_dismissed", "criticism_about_habits"].includes(sid),
    value: (actor, target) =>
      `Open with validation before introducing your perspective: "I want to understand how you're feeling about this before I share what's on my mind." This activates ${target}'s receptivity by meeting their need to feel seen first.`,
    influence: "target validation need ≥ 7 + sensitive scenario → lead with validation",
  },
  {
    id: "R-P03",
    description: "target emotional_sensitivity ≥ 7 + escalation scenario → lower physiological intensity",
    condition: (a, t, sid) =>
      score(t, "emotional_sensitivity") >= 7 &&
      ["tone_escalation", "unexpected_criticism", "unexpected_surprise"].includes(sid),
    value: (actor, target) =>
      `Lower physiological intensity before engaging: choose a calm setting, soften your voice, make deliberate eye contact. ${target}'s high tone-sensitivity means HOW you say things registers before WHAT you say.`,
    influence: "target sensitivity ≥ 7 + escalation → tone management is primary",
  },
  {
    id: "R-P04",
    description: "actor repair_orientation ≥ 7 → use natural repair asset early",
    condition: (a, t, sid) => score(a, "repair_orientation") >= 7,
    value: (actor, target) =>
      `Your natural repair orientation is an asset — use it proactively. A small connection bid before the serious conversation (a touch, a brief "we're okay") will lower both people's defenses before harder content.`,
    influence: "actor repair_orientation ≥ 7 → proactive repair bid",
  },
  {
    id: "R-P05",
    description: "target withdrawal_tendency ≥ 7 + conflict → don't pursue, create space",
    condition: (a, t, sid) =>
      score(t, "withdrawal_tendency") >= 7 &&
      ["withdrawal_during_conflict", "emotional_shutdown", "avoidance_after_disagreement"].includes(sid),
    value: (actor, target) =>
      `Resist the urge to pursue ${target} during shutdown — it will deepen the retreat. Instead, communicate: "I'm here when you're ready. No pressure." Create space while keeping the door open.`,
    influence: "target withdrawal ≥ 7 + conflict/shutdown scenario → create space, don't pursue",
  },
];

// ── Risk Level Computation ────────────────────────────────────────

function computeRiskLevel(actorTraits, targetTraits, scenarioId) {
  let riskScore = 0;

  // High-risk trait combinations
  if (score(actorTraits, "withdrawal_tendency") >= 7 &&
    ["unexpected_surprise", "tone_escalation", "unexpected_criticism"].includes(scenarioId)) riskScore += 2;

  if (score(targetTraits, "emotional_sensitivity") >= 7 &&
    ["tone_escalation", "unexpected_criticism", "feeling_dismissed"].includes(scenarioId)) riskScore += 2;

  if (score(actorTraits, "conflict_avoidance") >= 7 &&
    ["avoidance_after_disagreement", "withdrawal_during_conflict"].includes(scenarioId)) riskScore += 1.5;

  if (score(targetTraits, "need_for_validation") >= 7 &&
    ["feeling_dismissed", "affection_bid_rejected", "avoidance_after_disagreement"].includes(scenarioId)) riskScore += 1.5;

  if (score(actorTraits, "stress_reactivity") >= 7 &&
    ["stress_spillover", "last_minute_change"].includes(scenarioId)) riskScore += 1;

  // Mitigating factors
  if (score(actorTraits, "repair_orientation") >= 7) riskScore -= 1;
  if (score(actorTraits, "communication_expressiveness") >= 7) riskScore -= 0.5;
  if (score(targetTraits, "repair_orientation") >= 7) riskScore -= 0.5;

  // Generic scenario is always lower risk
  if (scenarioId === "generic_scenario") riskScore = Math.min(riskScore, 1);

  if (riskScore >= 3) return "high";
  if (riskScore >= 1.5) return "medium";
  return "low";
}

// ── Apply Rule Sets ──────────────────────────────────────────────

function applyRules(rules, actorTraits, targetTraits, scenarioId, actor, target) {
  const matched = [];
  let chosenValue = null;

  for (const rule of rules) {
    if (rule.condition(actorTraits, targetTraits, scenarioId)) {
      matched.push(rule);
      if (!chosenValue) {
        chosenValue = typeof rule.value === "function"
          ? rule.value(actor, target)
          : rule.value;
      }
    }
  }

  return { value: chosenValue, matchedRules: matched };
}

// ── Drivers Builder ──────────────────────────────────────────────

function buildDrivers(actorTraits, targetTraits, scenarioId, actor, target) {
  const DRIVER_TRAITS = [
    { key: "conflict_avoidance",         label: "Conflict Avoidance",         source: "actor" },
    { key: "withdrawal_tendency",        label: "Withdrawal Tendency",        source: "actor" },
    { key: "emotional_sensitivity",      label: "Emotional Sensitivity",      source: "target" },
    { key: "stress_reactivity",          label: "Stress Reactivity",          source: "actor" },
    { key: "need_for_validation",        label: "Need for Validation",        source: "target" },
    { key: "repair_orientation",         label: "Repair Orientation",         source: "actor" },
    { key: "communication_expressiveness", label: "Communication Expressiveness", source: "actor" },
    { key: "need_for_depth",             label: "Need for Depth",             source: "target" },
  ];

  const SCENARIO_RELEVANT_TRAITS = {
    unexpected_criticism:        ["conflict_avoidance", "emotional_sensitivity", "stress_reactivity"],
    withdrawal_during_conflict:  ["withdrawal_tendency", "communication_expressiveness", "need_for_validation"],
    tone_escalation:             ["stress_reactivity", "emotional_sensitivity", "conflict_avoidance"],
    emotional_shutdown:          ["withdrawal_tendency", "emotional_sensitivity", "communication_expressiveness"],
    avoidance_after_disagreement:["conflict_avoidance", "withdrawal_tendency", "need_for_validation"],
    sensitive_topic_raised:      ["emotional_sensitivity", "need_for_validation", "need_for_depth"],
    unexpected_surprise:         ["conflict_avoidance", "stress_reactivity", "withdrawal_tendency"],
    feeling_dismissed:           ["need_for_validation", "emotional_sensitivity", "repair_orientation"],
    stress_spillover:            ["stress_reactivity", "withdrawal_tendency", "communication_expressiveness"],
    affection_bid_rejected:      ["need_for_depth", "need_for_validation", "emotional_sensitivity"],
    criticism_about_habits:      ["emotional_sensitivity", "conflict_avoidance", "need_for_validation"],
    last_minute_change:          ["stress_reactivity", "conflict_avoidance", "withdrawal_tendency"],
    generic_scenario:            ["conflict_avoidance", "emotional_sensitivity", "stress_reactivity"],
  };

  const relevantKeys = SCENARIO_RELEVANT_TRAITS[scenarioId] || SCENARIO_RELEVANT_TRAITS.generic_scenario;

  return DRIVER_TRAITS
    .filter((dt) => relevantKeys.includes(dt.key))
    .map((dt) => {
      const traits = dt.source === "actor" ? actorTraits : targetTraits;
      const person = dt.source === "actor" ? actor : target;
      const s = score(traits, dt.key);

      let influence = "Neutral influence";
      if (s >= 8) influence = `Very high — strongly drives ${dt.source === "actor" ? "behavior" : "reception"} in this scenario`;
      else if (s >= 6) influence = `Elevated — increases risk in this scenario`;
      else if (s <= 3) influence = `Low — mitigates risk in this scenario`;
      else influence = `Moderate — baseline influence`;

      return {
        trait: `${person}: ${dt.label}`,
        score: s,
        influence,
      };
    })
    .sort((a, b) => b.score - a.score);
}

function clamp(num, min, max) {
  return Math.min(max, Math.max(min, num));
}

function computeRiskScore(actorTraits, targetTraits, scenarioId) {
  let scoreValue = 34;

  if (["unexpected_criticism", "tone_escalation", "withdrawal_during_conflict", "emotional_shutdown"].includes(scenarioId)) scoreValue += 16;
  if (["feeling_dismissed", "affection_bid_rejected", "criticism_about_habits"].includes(scenarioId)) scoreValue += 12;

  scoreValue += Math.max(0, score(actorTraits, "stress_reactivity") - 5) * 4;
  scoreValue += Math.max(0, score(targetTraits, "emotional_sensitivity") - 5) * 3.5;
  scoreValue += Math.max(0, score(actorTraits, "withdrawal_tendency") - 5) * 3;
  scoreValue += Math.max(0, score(targetTraits, "need_for_validation") - 5) * 2.5;

  scoreValue -= Math.max(0, score(actorTraits, "repair_orientation") - 5) * 3;
  scoreValue -= Math.max(0, score(targetTraits, "repair_orientation") - 5) * 2;
  scoreValue -= Math.max(0, score(actorTraits, "communication_expressiveness") - 6) * 1.5;

  return Math.round(clamp(scoreValue, 8, 96));
}

function buildConfidenceCalibration({ scenarioConfidence, actorTraits, targetTraits, riskScore }) {
  const traitCoverage = [
    "conflict_avoidance",
    "withdrawal_tendency",
    "emotional_sensitivity",
    "stress_reactivity",
    "need_for_validation",
    "repair_orientation",
    "communication_expressiveness",
  ].reduce((acc, key) => {
    const actorHas = Number.isFinite(actorTraits?.[key]?.score);
    const targetHas = Number.isFinite(targetTraits?.[key]?.score);
    return acc + (actorHas ? 1 : 0) + (targetHas ? 1 : 0);
  }, 0);

  const traitCompleteness = clamp(traitCoverage / 14, 0, 1);
  const riskSpecificity = riskScore >= 70 || riskScore <= 30 ? 0.1 : 0.05;
  const confidence = clamp(0.45 + scenarioConfidence * 0.25 + traitCompleteness * 0.2 + riskSpecificity, 0.42, 0.93);

  return {
    score: Number(confidence.toFixed(2)),
    factors: {
      scenario_confidence: scenarioConfidence,
      trait_completeness: Number(traitCompleteness.toFixed(2)),
      risk_specificity: Number(riskSpecificity.toFixed(2)),
    },
  };
}

function selectMethodologies({ scenarioId, actorTraits, targetTraits, riskLevel }) {
  const selected = [];
  const add = (id, reason) => {
    const method = METHODOLOGY_LIBRARY[id];
    if (!method) return;
    if (selected.some((item) => item.id === id)) return;
    selected.push({ ...method, why_selected: reason });
  };

  add("gottman", "Conflict repair sequencing and de-escalation structure are needed for this scenario.");
  add("eft", "Attachment safety and validation dynamics are central to this interaction.");

  if (
    ["feeling_dismissed", "criticism_about_habits", "unexpected_criticism", "sensitive_topic_raised"].includes(scenarioId) ||
    score(targetTraits, "need_for_validation") >= 7
  ) {
    add("nvc", "Conversation requires low-blame language with explicit needs and requests.");
  }

  if (score(actorTraits, "stress_reactivity") >= 7 || score(targetTraits, "emotional_sensitivity") >= 7 || riskLevel === "high") {
    add("dbt", "High arousal likelihood requires distress tolerance and regulation-first tactics.");
    add("polyvagal", "State shifts suggest sequencing for nervous system safety before content depth.");
  }

  if (
    ["avoidance_after_disagreement", "withdrawal_during_conflict", "stress_spillover"].includes(scenarioId) ||
    score(actorTraits, "conflict_avoidance") >= 7
  ) {
    add("motivational_interviewing", "Autonomy-supportive prompts reduce resistance and increase re-engagement.");
  }

  add("cbt", "Misinterpretation and cognitive reframing are needed to prevent escalation loops.");
  return selected.slice(0, 5);
}

// ── Public API ────────────────────────────────────────────────────

/**
 * Predict the outcome of a scenario between two people.
 *
 * @param {object} params
 * @param {string} params.actor         — who initiates / acts (e.g. "Drew")
 * @param {string} params.target        — who receives (e.g. "Tony")
 * @param {string} params.scenarioText  — free-text scenario description
 * @param {object} params.actorTraits   — .traits from computePatternProfile(actor, ...)
 * @param {object} params.targetTraits  — .traits from computePatternProfile(target, ...)
 *
 * @returns {object} Full prediction with trace
 */
export function predictOutcome({ actor, target, scenarioText, actorTraits, targetTraits }) {
  // 1. Match scenario
  const { scenario, confidence: scenarioConfidence, triggerWords, allMatches } = matchScenario(scenarioText);
  const scenarioId = scenario.id;

  // 2. Behavior (driven by actor traits)
  const behaviorResult = applyRules(BEHAVIOR_RULES, actorTraits, targetTraits, scenarioId, actor, target);
  const predicted_behavior = behaviorResult.value ||
    `${actor} will respond based on their current emotional bandwidth. The matched scenario (${scenario.label}) activates their core behavioral patterns around communication and regulation.`;

  // 3. Emotional state (driven by target traits)
  const emotionalResult = applyRules(EMOTIONAL_STATE_RULES, actorTraits, targetTraits, scenarioId, actor, target);
  const emotional_state = emotionalResult.value || "Regulated — likely able to engage constructively with some care around tone.";

  // 4. Risk level (explicit rule-based computation)
  const risk_level = computeRiskLevel(actorTraits, targetTraits, scenarioId);
  const risk_score = computeRiskScore(actorTraits, targetTraits, scenarioId);

  // 5. Misinterpretation (actor × target trait interaction)
  const misinterpResult = applyRules(MISINTERPRETATION_RULES, actorTraits, targetTraits, scenarioId, actor, target);
  const likely_misinterpretation = misinterpResult.value ||
    `${target} may over- or under-read ${actor}'s behavior. Communication about intent (not just content) will reduce misread.`;

  // 6. Preemptive action
  const preemptResult = applyRules(PREEMPTIVE_ACTION_RULES, actorTraits, targetTraits, scenarioId, actor, target);
  const recommended_preemptive_action = preemptResult.value ||
    `Before engaging, ensure both people are regulated. Ask: "Are we both in a place to have this conversation right now?"`;

  // 7. Drivers
  const drivers = buildDrivers(actorTraits, targetTraits, scenarioId, actor, target);
  const methodologies = selectMethodologies({ scenarioId, actorTraits, targetTraits, riskLevel: risk_level });
  const confidenceCalibration = buildConfidenceCalibration({
    scenarioConfidence,
    actorTraits,
    targetTraits,
    riskScore: risk_score,
  });

  // 8. Trace (full rule path)
  const trace = {
    scenario_matched:    scenario.label,
    scenario_id:         scenarioId,
    scenario_category:   scenario.category,
    scenario_confidence: scenarioConfidence,
    trigger_words_found: triggerWords,
    all_scenario_matches: allMatches.map((m) => ({
      id:         m.scenario.id,
      label:      m.scenario.label,
      confidence: parseFloat((m.score * 100).toFixed(0)) + "%",
    })),
    behavior_rules_applied:    behaviorResult.matchedRules.map((r) => ({ id: r.id, description: r.description })),
    emotional_rules_applied:   emotionalResult.matchedRules.map((r) => ({ id: r.id, description: r.description })),
    misinterp_rules_applied:   misinterpResult.matchedRules.map((r) => ({ id: r.id, description: r.description })),
    preemptive_rules_applied:  preemptResult.matchedRules.map((r) => ({ id: r.id, description: r.description })),
    risk_computation: {
      factors_considered: [
        `actor.withdrawal_tendency: ${score(actorTraits, "withdrawal_tendency")}`,
        `actor.conflict_avoidance: ${score(actorTraits, "conflict_avoidance")}`,
        `actor.stress_reactivity: ${score(actorTraits, "stress_reactivity")}`,
        `target.emotional_sensitivity: ${score(targetTraits, "emotional_sensitivity")}`,
        `target.need_for_validation: ${score(targetTraits, "need_for_validation")}`,
        `actor.repair_orientation: ${score(actorTraits, "repair_orientation")} (mitigator)`,
      ],
      result: risk_level,
      risk_score: risk_score,
    },
    traits_used: drivers.map((d) => d.trait),
    methodologies: methodologies.map((m) => ({ id: m.id, label: m.label })),
    confidence_calibration: confidenceCalibration,
  };

  return {
    predicted_behavior,
    emotional_state,
    risk_level,
    risk_score,
    likely_misinterpretation,
    recommended_preemptive_action,
    drivers,
    methodologies,
    confidence: confidenceCalibration.score,
    evidence_rationale: `Scenario confidence ${scenarioConfidence}; trait completeness ${confidenceCalibration.factors.trait_completeness}; calibrated risk score ${risk_score}.`,
    trace,
    actor,
    target,
    scenario_label: scenario.label,
    computed_at: new Date().toISOString(),
  };
}