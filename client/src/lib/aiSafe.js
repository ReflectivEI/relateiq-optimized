/**
 * aiSafe — fail-safe wrapper for all AI calls in RelateIQ.
 * Philosophy: TRUST THE AI. Only intervene if output is truly null/missing.
 * Never overwrite real AI content with generic placeholders.
 */
import { api } from "@/api/client";
import { computePatternProfile } from "./patternEngine";

// ─── OUTPUT NORMALIZERS ───────────────────────────────────────────────────────
// These ONLY fill in fields that are genuinely null, undefined, or empty arrays.
// They NEVER overwrite real AI-generated content, no matter how short.

export function normalizeProfileOutput(output = {}, personName = "This person") {
  const o = { ...output };
  if (!o.ai_behavioral_summary) o.ai_behavioral_summary = `${personName}'s behavioral profile is still generating.`;
  if (!o.communication_style) o.communication_style = "Not yet analyzed.";
  if (!o.conflict_tendencies) o.conflict_tendencies = "Not yet analyzed.";
  if (!Array.isArray(o.emotional_triggers) || o.emotional_triggers.length === 0)
    o.emotional_triggers = ["Feeling unheard", "Unpredictability", "Perceived criticism"];
  if (!o.needs_during_conflict) o.needs_during_conflict = "Not yet analyzed.";
  if (!o.processing_style) o.processing_style = "mixed";
  if (!Array.isArray(o.values_priorities) || o.values_priorities.length === 0)
    o.values_priorities = ["Authenticity", "Connection", "Trust"];
  if (!Array.isArray(o.personality_traits) || o.personality_traits.length === 0)
    o.personality_traits = ["Reflective", "Caring"];
  if (!Array.isArray(o.growth_areas) || o.growth_areas.length === 0)
    o.growth_areas = ["Expressing needs directly"];
  if (!o.past_patterns) o.past_patterns = "Not yet analyzed.";
  if (!o.partner_perception) o.partner_perception = "Not yet analyzed.";
  if (!o.love_language) o.love_language = "Quality Time";
  if (!o.trait_weights || typeof o.trait_weights !== "object") o.trait_weights = {};
  return o;
}

export function normalizeContextInsights(output = {}) {
  const o = { ...output };
  if (!o.what_system_sees) o.what_system_sees = "Generating insights based on available data.";
  if (!o.what_this_means) o.what_this_means = "Analysis in progress.";
  if (!Array.isArray(o.signals_tony)) o.signals_tony = [];
  if (!Array.isArray(o.signals_drew)) o.signals_drew = [];
  if (!Array.isArray(o.signals_together)) o.signals_together = [];
  if (!Array.isArray(o.what_seems_to_help)) o.what_seems_to_help = [];
  if (!Array.isArray(o.friction_sources)) o.friction_sources = [];
  if (!Array.isArray(o.what_to_try_next)) o.what_to_try_next = [];
  if (!Array.isArray(o.emerging_patterns)) o.emerging_patterns = [];
  if (!o.confidence_level) o.confidence_level = "early_signal";
  if (!o.confidence_explanation) o.confidence_explanation = "Based on available data.";
  if (!Array.isArray(o.how_to_strengthen)) o.how_to_strengthen = [];
  return o;
}

export function normalizeDeepInsights(output = {}) {
  const o = { ...output };
  if (!o.compatibility_score || typeof o.compatibility_score !== "number") o.compatibility_score = 70;
  if (!o.compatibility_label) o.compatibility_label = "Strong Foundation with Room to Grow";
  if (!o.growth_summary) o.growth_summary = "Analysis in progress.";
  if (!Array.isArray(o.strengths)) o.strengths = [];
  if (!Array.isArray(o.risk_areas)) o.risk_areas = [];
  if (!Array.isArray(o.conflict_loops)) o.conflict_loops = [];
  if (!Array.isArray(o.comparison_table)) o.comparison_table = [];
  if (!Array.isArray(o.predictions)) o.predictions = [];
  if (!Array.isArray(o.recommendations)) o.recommendations = [];
  return o;
}

// ─── VALIDATORS (structural check only — never block real content) ─────────────

export function validateProfileOutput(result) {
  if (!result || typeof result !== "object") return false;
  return !!(result.ai_behavioral_summary && result.communication_style);
}

export function validateContextInsightsOutput(result) {
  if (!result || typeof result !== "object") return false;
  return !!(result.what_system_sees && Array.isArray(result.signals_tony));
}

export function validateDeepInsightsOutput(result) {
  if (!result || typeof result !== "object") return false;
  return typeof result.compatibility_score === "number" && Array.isArray(result.strengths);
}

export function validateCoachOutput(result) {
  if (!result || typeof result !== "string") return false;
  return result.trim().length >= 100;
}

function escapeRegExp(value = "") {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function personalizeString(text, options = {}) {
  if (typeof text !== "string" || !text.trim()) return text;

  const {
    personName,
    partnerName,
    replacePronouns = true,
  } = options;

  if (!personName || !partnerName) return text;

  let next = text;
  const personPattern = escapeRegExp(personName);
  const partnerPattern = escapeRegExp(partnerName);

  // Replace explicit name-based partner phrasing first.
  next = next.replace(new RegExp(`\\b${personPattern}'s partner\\b`, "gi"), partnerName);
  next = next.replace(new RegExp(`\\b${partnerPattern}'s partner\\b`, "gi"), personName);

  if (replacePronouns) {
    next = next.replace(/\b(his|their|your|my)\s+partner\b/gi, partnerName);
    next = next.replace(/\bpartner's\b/gi, `${partnerName}'s`);
  }

  return next;
}

export function personalizePartnerLanguage(value, options = {}) {
  if (typeof value === "string") return personalizeString(value, options);
  if (Array.isArray(value)) return value.map((item) => personalizePartnerLanguage(item, options));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, personalizePartnerLanguage(item, options)])
    );
  }
  return value;
}

// ─── CORE SAFE INVOCATION ─────────────────────────────────────────────────────

/**
 * Calls the LLM with a timeout. One retry only if the result is completely null/empty.
 * If the AI returns anything at all, we use it — no second-guessing content quality.
 */
// Sentinel error type for credit exhaustion — caught by all pages to show a UI message
export class CreditLimitError extends Error {
  constructor() {
    super("CREDIT_LIMIT_REACHED");
    this.isCreditLimit = true;
  }
}

function isCreditLimitError(err) {
  const msg = err?.message || "";
  return msg.includes("402") || msg.includes("integration_credits_limit") || msg.includes("limit of integrations");
}

export async function safeInvokeLLM(params, timeoutMs = 35000, fallback = null, validator = null) {
  const attempt = async () => {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("AI_TIMEOUT")), timeoutMs)
    );
    return Promise.race([api.integrations.Core.InvokeLLM(params), timeoutPromise]);
  };

  // Attempt 1
  let result = null;
  try {
    result = await attempt();
  } catch (err) {
    if (isCreditLimitError(err)) throw new CreditLimitError();
    console.warn("[aiSafe] Attempt 1 failed:", err?.message);
  }

  if (!params?.response_json_schema && result && typeof result === "object" && typeof result.response === "string") {
    result = result.response;
  }

  if (params?.response_json_schema && result && typeof result === "object" && result.response && typeof result.response === "object") {
    result = { ...result.response, fallback: true, detail: result.detail || null };
  }

  if (params?.partnerLanguage) {
    result = personalizePartnerLanguage(result, params.partnerLanguage);
  }

  // Use result if it's non-null (string or object with any content)
  if (result !== null && result !== undefined) {
    const isUsable = typeof result === "string"
      ? result.trim().length > 0
      : typeof result === "object" && Object.keys(result).length > 0;
    if (isUsable) {
      if (validator && !validator(result)) {
        console.warn("[aiSafe] Attempt 1 returned invalid shape — using fallback.");
        return fallback;
      }
      return result;
    }
  }

  console.warn("[aiSafe] Attempt 1 empty — using fallback.");
  return fallback;
}

// ─── FALLBACK BUILDERS ────────────────────────────────────────────────────────

export function buildFallbackProfile(personName, responses = []) {
  const partnerName = personName === "Tony" ? "Drew" : "Tony";
  const responseMap = Object.fromEntries(
    responses
      .filter((response) => response?.question_id)
      .map((response) => [response.question_id, response])
  );
  const patternProfile = computePatternProfile(personName, responses);
  const traits = patternProfile.traits || {};

  const getResponse = (questionId) => responseMap[questionId] || {};
  const getAnswer = (questionId) => {
    const value = getResponse(questionId)?.answer;
    return typeof value === "string" ? value.trim() : "";
  };
  const getSelected = (questionId) => {
    const value = getResponse(questionId)?.selected_options;
    return Array.isArray(value) ? value.filter(Boolean).map(String) : [];
  };
  const compact = (items = []) => items.map((item) => String(item || "").trim()).filter(Boolean);
  const unique = (items = []) => [...new Set(compact(items))];
  const humanJoin = (items = []) => {
    if (items.length <= 1) return items[0] || "";
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
  };
  const splitListAnswer = (value = "") =>
    value
      .split(/,\s+/)
      .map((item) => item.trim())
      .filter((item) => item.length > 2);
  const scoreToWeight = (traitKey) =>
    Number((((traits[traitKey]?.score || 5) - 1) / 9).toFixed(2));

  const communicationInputs = compact([
    getAnswer("c1"),
    getAnswer("c2"),
    getAnswer("c3"),
    getAnswer("c4"),
    getAnswer("c7"),
    getAnswer("c8"),
  ]);
  const conflictInputs = compact([
    getAnswer("cf1"),
    getAnswer("cf2"),
    getAnswer("cf7"),
    getAnswer("cf9"),
    getAnswer("b1"),
    getAnswer("b2"),
    getAnswer("b4"),
  ]);
  const triggerInputs = unique([
    ...getSelected("e1"),
    ...splitListAnswer(getAnswer("e2")),
    ...getSelected("e3"),
    ...getSelected("e4"),
    getAnswer("e5"),
    getAnswer("e8"),
  ]).slice(0, 8);
  const needInputs = compact([
    getAnswer("cf2"),
    getAnswer("cf7"),
    getAnswer("cf9"),
    getAnswer("nv5"),
    getAnswer("nv9"),
  ]);
  const valuesPriorities = unique([
    /quality time|date night|presence|close/i.test(getAnswer("s2")) ? "Quality time" : "",
    /follow through|consisten|reliable|show up/i.test(getAnswer("nv5")) ? "Reliability" : "",
    /reassurance|wanted|priority/i.test(`${getAnswer("d2")} ${getAnswer("nv4")} ${getAnswer("nv9")}`) ? "Reassurance" : "",
    /curiosity|listen|understood|heard/i.test(`${getAnswer("c3")} ${getAnswer("nv1")} ${getAnswer("nv8")}`) ? "Emotional understanding" : "",
    /soft|calm|gentle/i.test(`${getAnswer("c1")} ${getAnswer("c2")} ${getAnswer("cf2")}`) ? "Emotional safety" : "",
    /space|alone|quiet/i.test(`${getAnswer("s3")} ${getAnswer("en2")} ${getAnswer("cf7")}`) ? "Space to process" : "",
    /affection|physical|closeness/i.test(`${getAnswer("s5")} ${getAnswer("t4")} ${getAnswer("nv10")}`) ? "Affection" : "",
  ]).slice(0, 6);

  const personalityTraits = unique([
    traits.withdrawal_tendency?.score >= 7 ? "Internally processing under stress" : "",
    traits.emotional_sensitivity?.score >= 7 ? "Highly sensitive to tone and emotional shifts" : "",
    traits.need_for_validation?.score >= 7 ? "Deeply affected by feeling heard and understood" : "",
    traits.communication_expressiveness?.score <= 4 ? "Tends to communicate indirectly or selectively" : "Capable of direct emotional expression when safe",
    traits.conflict_avoidance?.score >= 7 ? "Avoids escalation until things feel calm enough to re-engage" : "",
    traits.openness_to_feedback?.score <= 4 ? "Can become defensive when feeling criticized" : "Open to feedback when it feels respectful",
    traits.emotional_regulation?.score <= 4 ? "Gets flooded quickly in tense moments" : "Able to settle once there is enough safety and clarity",
    traits.relational_dependency?.score >= 7 ? "Feels the relationship deeply and notices disconnection quickly" : "",
  ]).slice(0, 8);

  const growthAreas = unique([
    /hint|hope they notice/i.test(getAnswer("c7")) ? "Making emotional needs explicit instead of hinting" : "",
    /shut down|go quiet|withdraw/i.test(`${getAnswer("b1")} ${getAnswer("b2")} ${getAnswer("d4")}`) ? "Staying emotionally present longer before withdrawing" : "",
    /defensive/i.test(getAnswer("b4")) ? "Receiving feedback without immediately bracing or shutting down" : "",
    /one-sided|emotional weight|carry/i.test(`${getAnswer("nv6")} ${getAnswer("t3")}`) ? "Naming resentment and unmet needs before they harden" : "",
    /follow through|accountability/i.test(`${getAnswer("t4")} ${getAnswer("e3")}`) ? "Turning important agreements into visible follow-through" : "",
  ]).slice(0, 5);

  const processingStyle =
    /needs_time|time to process|space|quiet|later that day|cooling-off/i.test(
      `${getAnswer("c1")} ${getAnswer("c5")} ${getAnswer("c8")} ${getAnswer("d4")} ${getAnswer("cf10")}`
    )
      ? "needs_time"
      : /immediately|right away|address it immediately/i.test(`${getAnswer("cf1")} ${getAnswer("cf10")}`)
      ? "immediate"
      : traits.conflict_avoidance?.score >= 7
      ? "avoidant"
      : "mixed";

  const communicationStyle = communicationInputs.length
    ? `${personName} communicates best when the tone feels ${/soft|calm|gentle|empathetic/i.test(communicationInputs.join(" ")) ? "soft, calm, and emotionally safe" : "clear and non-defensive"}. ${personName} feels most understood when ${getAnswer("c3") || `${partnerName} slows down, listens, and responds to the feeling underneath the words`}.`
    : `${personName} tends to communicate selectively and opens up more fully when the emotional landing feels safe.`;

  const conflictTendencies = conflictInputs.length
    ? `${personName} tends to handle conflict by ${getAnswer("cf1") || getAnswer("b1") || "protecting themselves first"} and usually needs ${getAnswer("cf2") || "a calm tone and room to feel understood"} to stay engaged. When tension spikes, ${personName} is most likely to ${getAnswer("d4") || getAnswer("b2") || "withdraw until there is enough safety to re-enter the conversation"}.`
    : `${personName} tends to become more guarded under conflict and needs a calmer pace to stay connected.`;

  const needsDuringConflict = needInputs.length
    ? `${personName} needs ${humanJoin(needInputs.slice(0, 3))}. The best de-escalation cue is usually ${getAnswer("cf7") || "slowing the pace, validating what is happening emotionally, and reducing pressure"}.`
    : `${personName} does best with a calmer tone, room to process, and reassurance that the conversation is still safe.`;

  const pastPatterns = compact([
    getAnswer("d1"),
    getAnswer("f1"),
    getAnswer("f3"),
    getAnswer("f4"),
    getAnswer("f7"),
  ]).slice(0, 2).join(" ");

  const partnerPerception = compact([
    getAnswer("p1"),
    getAnswer("p2"),
    getAnswer("p3"),
    getAnswer("p4"),
  ]).slice(0, 2).join(" ");

  const loveLanguage = /affection|physical|touch/i.test(`${getAnswer("s5")} ${getAnswer("t4")} ${getAnswer("nv10")}`)
    ? "Physical Affection"
    : /quality time|date night|presence|together/i.test(`${getAnswer("s2")} ${getAnswer("nv8")} ${getAnswer("t5")}`)
    ? "Quality Time"
    : /follow through|consisten|show up|reliable/i.test(getAnswer("nv5"))
    ? "Acts of Reliability"
    : /listen|understood|heard|reassurance/i.test(`${getAnswer("c3")} ${getAnswer("nv9")}`)
    ? "Emotional Reassurance"
    : "Quality Time";

  const summary = [
    `${personName}'s questionnaire answers show someone who ${traits.emotional_sensitivity?.score >= 7 ? "tracks emotional tone closely" : "pays close attention to relational safety"} and whose nervous system reacts strongly to feeling dismissed, unseen, or misread.`,
    communicationStyle,
    conflictTendencies,
    `${personName} most reliably feels connected when ${getAnswer("nv8") || `${partnerName} shows real presence, follow-through, and emotional understanding`}.`,
    growthAreas[0]
      ? `The clearest growth edge right now is ${growthAreas[0].charAt(0).toLowerCase()}${growthAreas[0].slice(1)}.`
      : "",
  ].filter(Boolean).join(" ");

  return normalizeProfileOutput({
    communication_style: communicationStyle,
    conflict_tendencies: conflictTendencies,
    emotional_triggers: triggerInputs.length ? triggerInputs : ["Feeling unheard", "Unpredictability", "Perceived criticism"],
    needs_during_conflict: needsDuringConflict,
    processing_style: processingStyle,
    values_priorities: valuesPriorities.length ? valuesPriorities : ["Trust", "Connection", "Emotional safety"],
    personality_traits: personalityTraits.length ? personalityTraits : ["Reflective", "Emotionally invested"],
    growth_areas: growthAreas.length ? growthAreas : ["Making needs more direct in the moment"],
    past_patterns: pastPatterns || `${personName}'s family history suggests they learned to manage a lot internally and to stay useful or composed rather than immediately naming needs.`,
    partner_perception: partnerPerception || `${personName} expects ${partnerName} may sometimes misread silence or guardedness as distance when it is more often overwhelm or self-protection.`,
    love_language: loveLanguage,
    ai_behavioral_summary: summary,
    trait_weights: {
      sensitivity_to_tone: scoreToWeight("emotional_sensitivity"),
      need_for_space: scoreToWeight("withdrawal_tendency"),
      directness: scoreToWeight("communication_expressiveness"),
      emotional_expressiveness: scoreToWeight("communication_expressiveness"),
      conflict_avoidance: scoreToWeight("conflict_avoidance"),
      empathy: scoreToWeight("emotional_sensitivity"),
      need_for_validation: scoreToWeight("need_for_validation"),
      vulnerability_comfort: scoreToWeight("openness_to_feedback"),
      rumination_tendency: scoreToWeight("need_for_validation"),
      stress_withdrawal: scoreToWeight("withdrawal_tendency"),
    },
  }, personName);
}

export function buildFallbackContextInsights(tonyResponses = [], drewResponses = [], sessions = [], checkIns = []) {
  const totalData = tonyResponses.length + drewResponses.length + sessions.length + checkIns.length;
  return normalizeContextInsights({
    what_system_sees: `Working with ${totalData} data points. Click Refresh to regenerate insights.`,
    confidence_level: "early_signal",
    confidence_explanation: "Fallback — please regenerate.",
  });
}

export function buildFallbackCoachResponse(speaker, speakingTo, situation) {
  return `**Guidance for your situation with ${speakingTo}:**

You described: *"${situation?.slice(0, 120)}..."*

**Recommended approach:**
- Lead with curiosity: *"Help me understand what's going on for you"* is almost always a safe opener.
- Name what you're feeling before stating what you want.
- Choose timing deliberately — approach when both of you are calm.

Try the conversation, then log an outcome in the Repair section to track what works.`;
}
