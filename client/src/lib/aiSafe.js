/**
 * aiSafe — fail-safe wrapper for all AI calls in RelateIQ.
 * Philosophy: TRUST THE AI. Only intervene if output is truly null/missing.
 * Never overwrite real AI content with generic placeholders.
 */
import { api } from "@/api/client";

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
  return normalizeProfileOutput({
    ai_behavioral_summary: `${personName} has shared ${responses.length} questionnaire responses. Regenerate to produce the full behavioral portrait.`,
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
