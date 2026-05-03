/**
 * REPAIR SUGGESTION ENGINE
 * ─────────────────────────────────────────────────────────────────────────────
 * Detects ongoing relationship friction from check-ins, repair entries,
 * and session history → identifies which partner is less likely to initiate
 * resolution (based on repair_orientation scores + history) → generates
 * 3 Gottman-style evidence-based repair bids for that partner.
 *
 * Output schema:
 * {
 *   friction_detected: boolean,
 *   friction_summary: string,
 *   friction_signals: string[],
 *   suggested_initiator: "Tony" | "Drew",
 *   initiator_reasoning: string,
 *   repair_bids: [
 *     { id, type, bid, why, gottman_category, effort: "low"|"medium", delivery: "verbal"|"text"|"action" }
 *   ],
 *   urgency: "low" | "medium" | "high",
 *   generated_at: string
 * }
 */

import { api } from "@/api/client";
import { RELATIONSHIP_COACH_SYSTEM, serializeProfile, aggregateTags } from "./prompts";
import { computePatternProfile } from "./patternEngine";
import { safeInvokeLLM } from "./aiSafe";

// ─── GOTTMAN BID CATEGORIES ───────────────────────────────────────────────────
export const GOTTMAN_BID_TYPES = {
  de_escalation: {
    label: "De-escalation",
    description: "Bids that lower physiological arousal and create safety",
    color: "bg-blue-50 border-blue-200 text-blue-800",
  },
  reconnection: {
    label: "Reconnection",
    description: "Bids that rebuild warmth and closeness",
    color: "bg-green-50 border-green-200 text-green-800",
  },
  repair_attempt: {
    label: "Repair Attempt",
    description: "Direct bids to acknowledge hurt and restore trust",
    color: "bg-purple-50 border-purple-200 text-purple-800",
  },
  validation: {
    label: "Validation",
    description: "Bids that show you understand their perspective",
    color: "bg-amber-50 border-amber-200 text-amber-800",
  },
};

// ─── FRICTION DETECTOR (deterministic pre-check) ────────────────────────────

/**
 * Scans recent check-ins, repair entries, and session history for friction signals.
 * Returns a friction score (0–1) and specific signals found.
 * This is deterministic — no AI call.
 */
export function detectFriction({ checkIns = [], repairEntries = [], sessions = [] }) {
  const signals = [];
  let score = 0;

  // Check-in mood signals
  const recentCheckIns = checkIns.slice(0, 6);
  const negativeMoods = recentCheckIns.filter((c) => ["tough", "difficult"].includes(c.mood));
  const okayMoods = recentCheckIns.filter((c) => c.mood === "okay");

  if (negativeMoods.length >= 2) {
    score += 0.4;
    signals.push(`${negativeMoods.length} recent check-ins rated "tough" or "difficult"`);
  } else if (negativeMoods.length === 1) {
    score += 0.2;
    signals.push(`Recent check-in rated "${negativeMoods[0].mood}" by ${negativeMoods[0].person_name}`);
  }
  if (okayMoods.length >= 2) {
    score += 0.15;
    signals.push(`${okayMoods.length} recent check-ins rated "okay" — below baseline`);
  }

  // Check what_could_improve for conflict language
  const conflictKeywords = ["fight", "argument", "conflict", "distant", "disconnected", "tension", "frustrated", "shut", "silent", "not talking", "ignored"];
  recentCheckIns.forEach((c) => {
    const text = `${c.what_could_improve || ""} ${c.what_worked || ""}`.toLowerCase();
    const hits = conflictKeywords.filter((k) => text.includes(k));
    if (hits.length >= 2) {
      score += 0.2;
      signals.push(`${c.person_name}'s check-in mentions: ${hits.slice(0, 3).join(", ")}`);
    }
  });

  // Recent unresolved repair entries
  const unresolvedRepairs = repairEntries.filter(
    (r) => r.outcome_rating === "not_tried_yet" || !r.outcome_logged
  );
  if (unresolvedRepairs.length >= 2) {
    score += 0.35;
    signals.push(`${unresolvedRepairs.length} unresolved repair entries pending`);
  } else if (unresolvedRepairs.length === 1) {
    score += 0.2;
    signals.push(`1 unresolved repair entry: "${unresolvedRepairs[0].what_happened?.slice(0, 60)}"`);
  }

  // Worsened outcomes
  const worsenedOutcomes = repairEntries.filter((r) => r.outcome_rating === "worsened");
  if (worsenedOutcomes.length >= 1) {
    score += 0.25;
    signals.push(`${worsenedOutcomes.length} recent repair attempt(s) made things worse`);
  }

  // Recent coach sessions suggesting stress
  const stressSessions = sessions.slice(0, 10).filter((s) => {
    const text = (s.situation || "").toLowerCase();
    return conflictKeywords.some((k) => text.includes(k));
  });
  if (stressSessions.length >= 2) {
    score += 0.2;
    signals.push(`${stressSessions.length} recent coach sessions involving conflict or tension`);
  }

  return {
    score: Math.min(1, parseFloat(score.toFixed(2))),
    signals,
    friction_detected: score >= 0.25,
    urgency: score >= 0.65 ? "high" : score >= 0.35 ? "medium" : "low",
  };
}

// ─── INITIATOR IDENTIFIER ────────────────────────────────────────────────────

/**
 * Determines which partner is LESS likely to initiate repair.
 * Uses repair_orientation pattern scores + historical repair entry data.
 * Deterministic — no AI call.
 */
export function identifyLessLikelyInitiator({
  tonyResponses = [],
  drewResponses = [],
  repairEntries = [],
  participantA = "Tony",
  participantB = "Drew",
}) {
  // Support both legacy and generic param names
  const responsesA = tonyResponses;
  const responsesB = drewResponses;

  const patternsA = computePatternProfile(participantA, responsesA);
  const patternsB = computePatternProfile(participantB, responsesB);

  const repairScoreA = patternsA.traits?.repair_orientation?.score ?? 5;
  const repairScoreB = patternsB.traits?.repair_orientation?.score ?? 5;
  const withdrawalA = patternsA.traits?.withdrawal_tendency?.score ?? 5;
  const withdrawalB = patternsB.traits?.withdrawal_tendency?.score ?? 5;

  // Historical: how many repairs was each person the owner of?
  const initiationsA = repairEntries.filter((r) => r.owner === participantA).length;
  const initiationsB = repairEntries.filter((r) => r.owner === participantB).length;
  const totalInitiations = initiationsA + initiationsB;

  // Composite score: lower = less likely to initiate
  const historicalRateA = totalInitiations > 0 ? initiationsA / totalInitiations : 0.5;
  const historicalRateB = totalInitiations > 0 ? initiationsB / totalInitiations : 0.5;

  const likelihoodA = repairScoreA / 10 * 0.4 + (1 - withdrawalA / 10) * 0.3 + historicalRateA * 0.3;
  const likelihoodB = repairScoreB / 10 * 0.4 + (1 - withdrawalB / 10) * 0.3 + historicalRateB * 0.3;

  const lessLikely = likelihoodA <= likelihoodB ? participantA : participantB;
  const moreActive = lessLikely === participantA ? participantB : participantA;

  const reasons = [];
  if (lessLikely === participantA) {
    if (withdrawalA > withdrawalB) reasons.push(`${participantA}'s withdrawal tendency (${withdrawalA}/10) is higher than ${participantB}'s (${withdrawalB}/10)`);
    if (repairScoreA < repairScoreB) reasons.push(`${participantA}'s repair orientation score (${repairScoreA}/10) is lower than ${participantB}'s (${repairScoreB}/10)`);
    if (initiationsA < initiationsB && totalInitiations > 0) reasons.push(`${participantB} has initiated ${initiationsB} past repairs vs ${participantA}'s ${initiationsA}`);
  } else {
    if (withdrawalB > withdrawalA) reasons.push(`${participantB}'s withdrawal tendency (${withdrawalB}/10) is higher than ${participantA}'s (${withdrawalA}/10)`);
    if (repairScoreB < repairScoreA) reasons.push(`${participantB}'s repair orientation score (${repairScoreB}/10) is lower than ${participantA}'s (${repairScoreA}/10)`);
    if (initiationsB < initiationsA && totalInitiations > 0) reasons.push(`${participantA} has initiated ${initiationsA} past repairs vs ${participantB}'s ${initiationsB}`);
  }

  if (reasons.length === 0) reasons.push(`Pattern scores are similar — defaulting to ${lessLikely} as less likely initiator this cycle`);

  return {
    suggested_initiator: lessLikely,
    more_active_repairer: moreActive,
    initiator_reasoning: reasons.join(". "),
    likelihood_scores: { [participantA]: parseFloat(likelihoodA.toFixed(2)), [participantB]: parseFloat(likelihoodB.toFixed(2)) },
  };
}

// ─── MAIN: generateRepairSuggestion() ────────────────────────────────────────

/**
 * Full pipeline:
 * 1. Detect friction deterministically
 * 2. Identify less-likely initiator deterministically
 * 3. Generate 3 Gottman-style repair bids via AI (only if friction detected)
 *
 * Returns null if no friction detected.
 */
export async function generateRepairSuggestion({
  tonyResponses = [],
  drewResponses = [],
  tonyProfile = null,
  drewProfile = null,
  participantA = "Tony",
  participantB = "Drew",
  checkIns = [],
  repairEntries = [],
  sessions = [],
  triggers = [],
}) {
  // Step 1: Detect friction
  const frictionResult = detectFriction({ checkIns, repairEntries, sessions });
  if (!frictionResult.friction_detected) return null;

  // Step 2: Identify less likely initiator (participant-agnostic)
  const initiatorResult = identifyLessLikelyInitiator({ tonyResponses, drewResponses, repairEntries, participantA, participantB });
  const { suggested_initiator } = initiatorResult;
  const partner = suggested_initiator === participantA ? participantB : participantA;

  const initiatorProfile = suggested_initiator === participantA ? tonyProfile : drewProfile;
  const partnerProfile = suggested_initiator === participantA ? drewProfile : tonyProfile;
  const initiatorResponses = suggested_initiator === participantA ? tonyResponses : drewResponses;
  const partnerResponses = suggested_initiator === participantA ? drewResponses : tonyResponses;

  const initiatorCtx = serializeProfile(suggested_initiator, initiatorProfile);
  const partnerCtx = serializeProfile(partner, partnerProfile);
  const initiatorTags = aggregateTags(initiatorResponses);
  const partnerTags = aggregateTags(partnerResponses);

  const initiatorTriggers = triggers.filter((t) => t.owner === suggested_initiator);
  const partnerTriggers = triggers.filter((t) => t.owner === partner);

  const recentCheckInCtx = checkIns.slice(0, 6)
    .map((c) => `${c.person_name} (${c.week_label || "recent"}): mood=${c.mood}, improve="${c.what_could_improve?.slice(0, 80)}"`)
    .join("\n");

  const repairHistoryCtx = repairEntries.slice(0, 5)
    .map((r) => `[${r.owner}] "${r.what_happened?.slice(0, 80)}" → outcome: ${r.outcome_rating || "pending"}`)
    .join("\n");

  // Step 3: AI generates 3 Gottman-style repair bids
  const prompt = `${RELATIONSHIP_COACH_SYSTEM}

═══════════════════════════════════════
REPAIR BID GENERATION REQUEST
═══════════════════════════════════════
This is NOT a coaching session. This is a push-style repair intervention.

FRICTION DETECTED:
${frictionResult.signals.map((s) => `• ${s}`).join("\n")}
Urgency: ${frictionResult.urgency}

SUGGESTED INITIATOR: ${suggested_initiator}
REASONING: ${initiatorResult.initiator_reasoning}

The system has determined ${suggested_initiator} is less likely to initiate repair right now.
Generate 3 Gottman-method repair bids specifically designed for ${suggested_initiator} to offer to ${partner}.

═══════════════════════════════════════
${suggested_initiator.toUpperCase()}'S PROFILE (the one making the bid)
═══════════════════════════════════════
${initiatorCtx}
Behavioral tags: ${initiatorTags || "none"}
${initiatorTriggers.length > 0 ? `Active triggers: ${initiatorTriggers.map((t) => t.title).join(", ")}` : ""}

═══════════════════════════════════════
${partner.toUpperCase()}'S PROFILE (the one receiving the bid)
═══════════════════════════════════════
${partnerCtx}
Behavioral tags: ${partnerTags || "none"}
${partnerTriggers.length > 0 ? `Known triggers to avoid activating: ${partnerTriggers.map((t) => t.title).join(", ")}` : ""}

RECENT CONTEXT:
${recentCheckInCtx || "No recent check-ins"}

REPAIR HISTORY:
${repairHistoryCtx || "No repair history"}

═══════════════════════════════════════
GOTTMAN BID REQUIREMENTS
═══════════════════════════════════════
Generate EXACTLY 3 repair bids. Each must:
1. Be a specific Gottman bid category: "de_escalation" | "reconnection" | "repair_attempt" | "validation"
2. Sound like something ${suggested_initiator} would ACTUALLY say — not therapy language
3. Be calibrated to ${partner}'s specific communication style and known triggers
4. Be low-pressure — no demands, no criticism, no "you always/never"
5. Account for the friction signals above (e.g., if shutdown detected → bid 1 should be de-escalation)
6. Vary in delivery: some verbal, some text/message, some action-based

The 3 bids should escalate gently:
- Bid 1: Lowest effort, safest entry point
- Bid 2: Medium effort, warmer reconnection  
- Bid 3: Direct repair attempt — most vulnerable but most powerful

Return JSON:
{
  "friction_summary": "string — 2-3 sentences describing what the data shows is happening",
  "repair_bids": [
    {
      "id": 1,
      "type": "de_escalation" | "reconnection" | "repair_attempt" | "validation",
      "bid": "exact word-for-word thing ${suggested_initiator} can say or do",
      "why": "1-2 sentences — why this specific bid works given both profiles",
      "gottman_principle": "the specific Gottman principle this uses",
      "effort": "low" | "medium",
      "delivery": "verbal" | "text" | "action"
    },
    ... (3 total)
  ],
  "what_to_avoid": "one specific phrase or action ${suggested_initiator} should NOT do right now"
}`;

  const result = await safeInvokeLLM(
    {
      prompt,
      model: "claude_sonnet_4_6",
      response_json_schema: {
        type: "object",
        properties: {
          friction_summary: { type: "string" },
          repair_bids: {
            type: "array",
            items: {
              type: "object",
              properties: {
                id: { type: "number" },
                type: { type: "string" },
                bid: { type: "string" },
                why: { type: "string" },
                gottman_principle: { type: "string" },
                effort: { type: "string" },
                delivery: { type: "string" },
              },
            },
          },
          what_to_avoid: { type: "string" },
        },
      },
    },
    35000,
    null
  );

  if (!result?.repair_bids?.length) return null;

  return {
    friction_detected: true,
    friction_summary: result.friction_summary || frictionResult.signals.join(". "),
    friction_signals: frictionResult.signals,
    suggested_initiator,
    initiator_reasoning: initiatorResult.initiator_reasoning,
    repair_bids: result.repair_bids.slice(0, 3),
    what_to_avoid: result.what_to_avoid || null,
    urgency: frictionResult.urgency,
    likelihood_scores: initiatorResult.likelihood_scores,
    generated_at: new Date().toISOString(),
  };
}