/**
 * ANALYSIS ENGINE — Central AI intelligence layer for Context: Us
 * ─────────────────────────────────────────────────────────────────────────
 * ALL AI outputs flow through generateAnalysis().
 * Strict schema output. No free-form text outside schema.
 * Multi-perspective: person A | person B | person A→person B | person B→person A
 * 5 output modes: deep | explain | recap | summary | action
 *
 * PERSPECTIVE DIFFERENTIATION (v2):
 * - Each perspective receives DISTINCT inputs — not the same data reordered.
 * - Individual perspectives only receive their own person's data.
 * - Directional perspectives compute perceived_impact, misalignment_areas,
 *   perception_gap, communication_risk_points.
 * - Perspective switch ALWAYS recomputes — reuse_allowed=false unless same perspective.
 */

import { api } from "@/api/client";
import {
  RELATIONSHIP_COACH_SYSTEM,
  aggregateTags,
  serializeProfile,
  buildFullResponseContext,
} from "./prompts";
import { safeInvokeLLM, personalizePartnerLanguage, CreditLimitError } from "./aiSafe";
import { computePatternProfile, detectMisalignments } from "./patternEngine";

// Re-export transform layer so consumers only need one import
export { applyMode, assertBaseExists, TRANSFORMERS, toDeep, toExplain, toRecap, toSummary, toActionPlan } from "./analysisTransforms";

// ─── OUTPUT SCHEMA ────────────────────────────────────────────────────────────

export const ANALYSIS_SCHEMA = {
  core_insight: "",
  behavioral_patterns: [],
  relationship_dynamics: [],
  risk_flags: [],
  strengths: [],
  recommended_actions: [],
  confidence_score: 0,
  source_signals: [],
  frameworks_used: [],
  // Directional-only fields (null for individual perspectives)
  directional_impact: null,
  misalignment_areas: null,
  perception_gap: null,
  communication_risk_points: null,
  // Metadata
  perspective: "",
  analysis_type: "",
  generated_at: "",
  inputs_used: {},   // logged — proves what data was fed in
};

const IS_DIRECTIONAL = (p) => typeof p === "string" && p.includes("→");

// ─── ANALYSIS CONFIG ─────────────────────────────────────────────────────────
// generateAnalysis() ALWAYS uses this single config.
// Modes (explain, recap, summary, action) are DISPLAY transforms only — see analysisTransforms.js.
// No mode-specific prompt variations exist here.

const ANALYSIS_CONFIG = {
  label: "In-Depth Analysis",
  instruction:
    "Provide a comprehensive, multi-layered analysis citing specific questionnaire answers and behavioral patterns. Go deep into emotional dynamics, attachment patterns, and specific triggers. All fields must be fully populated — behavioral_patterns, relationship_dynamics, risk_flags, strengths, recommended_actions. These will be transformed into multiple display modes, so richness and completeness are critical.",
};

// ─── PERSPECTIVE INPUT BUILDER (DISTINCT PER PERSPECTIVE) ────────────────────
/**
 * Returns the SPECIFIC inputs each perspective gets.
 * Individual perspectives: ONLY that person's data.
 * Directional perspectives: actor's BEHAVIOR + target's TRIGGERS/NEEDS.
 * This is the enforcement layer — different inputs guarantee different outputs.
 */
function buildPerspectiveInputs({
  perspective,
  participants = ["Person A", "Other Person"],
  tonyResponses,
  drewResponses,
  tonyProfile,
  drewProfile,
  triggers,
  sessions,
}) {
  const [primaryPerson = "Person A", secondaryPerson = "Other Person"] = participants;
  const primaryPatterns = computePatternProfile(primaryPerson, tonyResponses);
  const secondaryPatterns = computePatternProfile(secondaryPerson, drewResponses);

  // Filter sessions by relevance to each perspective
  const primarySessions = sessions.filter((s) => s.speaker === primaryPerson);
  const secondarySessions = sessions.filter((s) => s.speaker === secondaryPerson);

  // Filter triggers by owner
  const primaryTriggers = triggers.filter((t) => t.owner === primaryPerson);
  const secondaryTriggers = triggers.filter((t) => t.owner === secondaryPerson);

  switch (perspective) {
    case primaryPerson: {
      const inputs = {
        subject: primaryPerson,
        target: null,
        actor_profile: serializeProfile(primaryPerson, tonyProfile),
        actor_tags: aggregateTags(tonyResponses),
        actor_patterns: primaryPatterns.traits,
        actor_responses: buildFullResponseContext(primaryPerson, tonyResponses),
        actor_sessions: primarySessions
          .slice(0, 8)
          .map((s) => `[${s.tool_type}] "${s.situation?.slice(0, 100)}"`)
          .join("\n"),
        actor_triggers: primaryTriggers.map((t) => `${t.title}: ${t.description?.slice(0, 60)}`).join("\n"),
        target_profile: null,
        target_tags: null,
        target_triggers: null,
        is_directional: false,
        response_count: tonyResponses.length,
      };
      return {
        inputs,
        label: `${primaryPerson} (Individual)`,
        context: buildIndividualContext(primaryPerson, inputs),
        instruction:
          `Analyze ONLY ${primaryPerson} as an individual — their internal world, behavioral patterns, emotional triggers, needs, and growth edges. Do NOT reference the relationship dynamic or ${secondaryPerson}. This is ${primaryPerson}'s individual portrait.`,
        schema_note:
          'directional_impact, misalignment_areas, perception_gap, communication_risk_points MUST be null strings ("null") — they do not apply to individual analysis.',
      };
    }

    case secondaryPerson: {
      const inputs = {
        subject: secondaryPerson,
        target: null,
        actor_profile: serializeProfile(secondaryPerson, drewProfile),
        actor_tags: aggregateTags(drewResponses),
        actor_patterns: secondaryPatterns.traits,
        actor_responses: buildFullResponseContext(secondaryPerson, drewResponses),
        actor_sessions: secondarySessions
          .slice(0, 8)
          .map((s) => `[${s.tool_type}] "${s.situation?.slice(0, 100)}"`)
          .join("\n"),
        actor_triggers: secondaryTriggers.map((t) => `${t.title}: ${t.description?.slice(0, 60)}`).join("\n"),
        target_profile: null,
        target_tags: null,
        target_triggers: null,
        is_directional: false,
        response_count: drewResponses.length,
      };
      return {
        inputs,
        label: `${secondaryPerson} (Individual)`,
        context: buildIndividualContext(secondaryPerson, inputs),
        instruction:
          `Analyze ONLY ${secondaryPerson} as an individual — their internal world, behavioral patterns, emotional triggers, needs, and growth edges. Do NOT reference the relationship dynamic or ${primaryPerson}. This is ${secondaryPerson}'s individual portrait.`,
        schema_note:
          'directional_impact, misalignment_areas, perception_gap, communication_risk_points MUST be null strings ("null") — they do not apply to individual analysis.',
      };
    }

    case `${primaryPerson}→${secondaryPerson}`: {
      const mismatch = detectMisalignments(primaryPatterns, primaryPerson, secondaryPatterns, secondaryPerson);
      const inputs = {
        subject: primaryPerson,
        target: secondaryPerson,
        actor_profile: serializeProfile(primaryPerson, tonyProfile),
        actor_tags: aggregateTags(tonyResponses),
        actor_patterns: primaryPatterns.traits,
        actor_behavior_responses: buildCategoryContext(tonyResponses, [
          "behavioral",
          "communication",
          "conflict_style",
          "energy_social",
        ]),
        target_profile: serializeProfile(secondaryPerson, drewProfile),
        target_triggers: secondaryTriggers.map((t) => `${t.title}: ${t.description?.slice(0, 80)}`).join("\n"),
        target_needs_responses: buildCategoryContext(drewResponses, [
          "emotional_triggers",
          "needs_vulnerability",
          "communication",
          "deep_reflection",
        ]),
        target_tags: aggregateTags(drewResponses),
        misalignment_data: mismatch.misalignments
          .map((m) => `${m.label}: ${primaryPerson}=${m[primaryPerson]}/10, ${secondaryPerson}=${m[secondaryPerson]}/10, gap=${m.gap} (${m.severity})`)
          .join("\n"),
        is_directional: true,
        response_count: tonyResponses.length + drewResponses.length,
      };
      return {
        inputs,
        label: `${primaryPerson} → ${secondaryPerson} (Interaction Impact)`,
        context: buildDirectionalContext(primaryPerson, secondaryPerson, inputs),
        instruction:
          `Analyze HOW ${primaryPerson}'s specific behavioral patterns, communication style, and emotional tendencies are EXPERIENCED by ${secondaryPerson}. The unit of analysis is impact: how does ${primaryPerson}'s behavior land for ${secondaryPerson}? Compute misalignment zones and perception gaps. behavioral_patterns = ${primaryPerson}'s patterns. relationship_dynamics = how those patterns affect ${secondaryPerson}. risk_flags = moments where ${primaryPerson}'s behavior most likely triggers ${secondaryPerson}'s vulnerabilities. strengths = places where ${primaryPerson}'s tendencies align with ${secondaryPerson}'s needs.`,
        schema_note:
          `directional_impact MUST describe what ${secondaryPerson} actually experiences when ${primaryPerson} behaves this way. misalignment_areas MUST list specific trait-pairs where they diverge. perception_gap MUST describe the gap between ${primaryPerson}'s intent and ${secondaryPerson}'s interpretation. communication_risk_points MUST list specific interaction types most likely to break down.`,
      };
    }

    case `${secondaryPerson}→${primaryPerson}`: {
      const mismatch = detectMisalignments(secondaryPatterns, secondaryPerson, primaryPatterns, primaryPerson);
      const inputs = {
        subject: secondaryPerson,
        target: primaryPerson,
        actor_profile: serializeProfile(secondaryPerson, drewProfile),
        actor_tags: aggregateTags(drewResponses),
        actor_patterns: secondaryPatterns.traits,
        actor_behavior_responses: buildCategoryContext(drewResponses, [
          "behavioral",
          "communication",
          "conflict_style",
          "energy_social",
        ]),
        target_profile: serializeProfile(primaryPerson, tonyProfile),
        target_triggers: primaryTriggers.map((t) => `${t.title}: ${t.description?.slice(0, 80)}`).join("\n"),
        target_needs_responses: buildCategoryContext(tonyResponses, [
          "emotional_triggers",
          "needs_vulnerability",
          "communication",
          "deep_reflection",
        ]),
        target_tags: aggregateTags(tonyResponses),
        misalignment_data: mismatch.misalignments
          .map((m) => `${m.label}: ${secondaryPerson}=${m[secondaryPerson]}/10, ${primaryPerson}=${m[primaryPerson]}/10, gap=${m.gap} (${m.severity})`)
          .join("\n"),
        is_directional: true,
        response_count: tonyResponses.length + drewResponses.length,
      };
      return {
        inputs,
        label: `${secondaryPerson} → ${primaryPerson} (Interaction Impact)`,
        context: buildDirectionalContext(secondaryPerson, primaryPerson, inputs),
        instruction:
          `Analyze HOW ${secondaryPerson}'s specific behavioral patterns, communication style, and emotional tendencies are EXPERIENCED by ${primaryPerson}. The unit of analysis is impact: how does ${secondaryPerson}'s behavior land for ${primaryPerson}? Compute misalignment zones and perception gaps. behavioral_patterns = ${secondaryPerson}'s patterns. relationship_dynamics = how those patterns affect ${primaryPerson}. risk_flags = moments where ${secondaryPerson}'s behavior most likely triggers ${primaryPerson}'s vulnerabilities. strengths = places where ${secondaryPerson}'s tendencies align with ${primaryPerson}'s needs.`,
        schema_note:
          `directional_impact MUST describe what ${primaryPerson} actually experiences when ${secondaryPerson} behaves this way. misalignment_areas MUST list specific trait-pairs where they diverge. perception_gap MUST describe the gap between ${secondaryPerson}'s intent and ${primaryPerson}'s interpretation. communication_risk_points MUST list specific interaction types most likely to break down.`,
      };
    }

    default:
      return buildPerspectiveInputs({
        perspective: `${primaryPerson}→${secondaryPerson}`,
        participants,
        tonyResponses, drewResponses, tonyProfile, drewProfile, triggers, sessions,
      });
  }
}

// ─── CONTEXT SERIALIZERS ──────────────────────────────────────────────────────

function buildIndividualContext(person, inputs) {
  return `
═══ ${person.toUpperCase()}'S INDIVIDUAL PROFILE ═══
${inputs.actor_profile}

BEHAVIORAL SIGNAL TAGS (weighted frequency):
${inputs.actor_tags || "None yet"}

COMPUTED PATTERN SCORES (deterministic, rule-based):
${JSON.stringify(inputs.actor_patterns, null, 2)}

FULL QUESTIONNAIRE RESPONSES:
${inputs.actor_responses}

${inputs.actor_sessions ? `RELEVANT COACH SESSIONS:\n${inputs.actor_sessions}` : ""}
${inputs.actor_triggers ? `KNOWN TRIGGERS:\n${inputs.actor_triggers}` : ""}
`.trim();
}

function buildDirectionalContext(actor, target, inputs) {
  return `
═══ ACTOR: ${actor.toUpperCase()}'S BEHAVIORAL PATTERNS ═══
(These are the patterns being analyzed for their impact on ${target})

${inputs.actor_profile}

BEHAVIORAL SIGNAL TAGS:
${inputs.actor_tags || "None yet"}

COMPUTED PATTERN SCORES:
${JSON.stringify(inputs.actor_patterns, null, 2)}

${actor.toUpperCase()}'S BEHAVIOR-RELEVANT QUESTIONNAIRE RESPONSES:
${inputs.actor_behavior_responses}

═══ TARGET: ${target.toUpperCase()}'S EMOTIONAL NEEDS & TRIGGERS ═══
(These are the vulnerabilities being impacted by ${actor}'s behavior)

${inputs.target_profile}

${target.toUpperCase()}'S TRIGGERS:
${inputs.target_triggers || "None recorded"}

${target.toUpperCase()}'S NEEDS & VULNERABILITY RESPONSES:
${inputs.target_needs_responses}

TARGET BEHAVIORAL TAGS:
${inputs.target_tags || "None yet"}

═══ PRE-COMPUTED MISALIGNMENT DATA ═══
${inputs.misalignment_data || "Insufficient data"}
`.trim();
}

function buildCategoryContext(responses, categories) {
  const filtered = responses.filter(
    (r) => categories.includes(r.category) && r.answer?.length > 2
  );
  const byCategory = {};
  filtered.forEach((r) => {
    if (!byCategory[r.category]) byCategory[r.category] = [];
    byCategory[r.category].push(r);
  });
  return Object.entries(byCategory)
    .map(([cat, items]) => {
      const answers = items
        .slice(0, 5)
        .map((r) => `  Q: ${r.question_text}\n  A: "${r.answer}"`)
        .join("\n");
      return `[${cat.toUpperCase()}]\n${answers}`;
    })
    .join("\n\n");
}

// ─── SCHEMA VALIDATOR ─────────────────────────────────────────────────────────

function validateAnalysisSchema(output) {
  if (!output || typeof output !== "object") return false;
  return (
    typeof output.core_insight === "string" &&
    Array.isArray(output.behavioral_patterns) &&
    Array.isArray(output.risk_flags) &&
    typeof output.confidence_score === "number"
  );
}

function normalizeAnalysisOutput(output, perspective, analysis_type, inputs_used) {
  const isDir = IS_DIRECTIONAL(perspective);
  const o = { ...ANALYSIS_SCHEMA, ...(output || {}) };

  if (!o.core_insight) o.core_insight = "Analysis could not be generated. Please regenerate.";
  if (!Array.isArray(o.behavioral_patterns)) o.behavioral_patterns = [];
  if (!Array.isArray(o.relationship_dynamics)) o.relationship_dynamics = [];
  if (!Array.isArray(o.risk_flags)) o.risk_flags = [];
  if (!Array.isArray(o.strengths)) o.strengths = [];
  if (!Array.isArray(o.recommended_actions)) o.recommended_actions = [];
  if (!Array.isArray(o.frameworks_used)) o.frameworks_used = [];
  if (!Array.isArray(o.source_signals)) o.source_signals = [];
  if (typeof o.confidence_score !== "number") o.confidence_score = 0.5;

  // Directional fields: only valid for directional perspectives
  if (!isDir) {
    o.directional_impact = null;
    o.misalignment_areas = null;
    o.perception_gap = null;
    o.communication_risk_points = null;
  } else {
    if (!o.directional_impact) o.directional_impact = "";
    if (!Array.isArray(o.misalignment_areas)) o.misalignment_areas = [];
    if (!o.perception_gap) o.perception_gap = "";
    if (!Array.isArray(o.communication_risk_points)) o.communication_risk_points = [];
  }

  o.perspective = perspective;
  o.analysis_type = analysis_type;
  o.generated_at = new Date().toISOString();
  o.inputs_used = inputs_used;
  return o;
}

// ─── DELTA COMPUTATION ────────────────────────────────────────────────────────
/**
 * Compute structural differences between two analysis outputs.
 * Used when user switches perspectives — proves outputs are not reused.
 */
export function computeAnalysisDelta(prevAnalysis, nextAnalysis) {
  if (!prevAnalysis || !nextAnalysis) return null;

  const prevInsightWords = new Set(prevAnalysis.core_insight?.toLowerCase().split(/\s+/) || []);
  const nextInsightWords = new Set(nextAnalysis.core_insight?.toLowerCase().split(/\s+/) || []);
  const sharedInsightWords = [...prevInsightWords].filter((w) => nextInsightWords.has(w) && w.length > 4).length;
  const insightOverlap = Math.round((sharedInsightWords / Math.max(prevInsightWords.size, 1)) * 100);

  const prevRisks = new Set(prevAnalysis.risk_flags || []);
  const nextRisks = new Set(nextAnalysis.risk_flags || []);
  const newRisks = [...nextRisks].filter((r) => ![...prevRisks].some((p) => p.slice(0, 30) === r.slice(0, 30)));
  const droppedRisks = [...prevRisks].filter((r) => ![...nextRisks].some((n) => n.slice(0, 30) === r.slice(0, 30)));

  const prevConf = prevAnalysis.confidence_score || 0;
  const nextConf = nextAnalysis.confidence_score || 0;
  const confDelta = parseFloat((nextConf - prevConf).toFixed(2));

  const key_differences = [];
  if (insightOverlap < 40) key_differences.push(`Core insight has changed significantly (${insightOverlap}% word overlap)`);
  if (newRisks.length > 0) key_differences.push(`${newRisks.length} new risk flag(s) identified: "${newRisks[0]?.slice(0, 60)}..."`);
  if (droppedRisks.length > 0) key_differences.push(`${droppedRisks.length} risk(s) no longer apply from previous perspective`);
  if (prevAnalysis.perspective !== nextAnalysis.perspective) key_differences.push(`Perspective changed: ${prevAnalysis.perspective} → ${nextAnalysis.perspective}`);
  if (Math.abs(confDelta) > 0.05) key_differences.push(`Confidence ${confDelta > 0 ? "increased" : "decreased"} by ${Math.abs(confDelta * 100).toFixed(0)}%`);

  return {
    key_differences,
    risk_shift: newRisks.length > droppedRisks.length
      ? "Risk profile increased"
      : newRisks.length < droppedRisks.length
      ? "Risk profile decreased"
      : "Risk profile shifted",
    alignment_score_change: confDelta,
    perspectives_compared: `${prevAnalysis.perspective} → ${nextAnalysis.perspective}`,
    insight_word_overlap_pct: insightOverlap,
    new_risks: newRisks.slice(0, 3),
    dropped_risks: droppedRisks.slice(0, 3),
  };
}

// ─── CORE: generateAnalysis() ─────────────────────────────────────────────────
/**
 * Central analysis function. Each perspective receives DISTINCT inputs.
 * Perspective switching ALWAYS recomputes — reuse_allowed = (prev === current).
 */
export async function generateAnalysis({
  perspective = null,
  participants = ["Person A", "Other Person"],
  analysis_type = "deep",
  tonyResponses = [],
  drewResponses = [],
  tonyProfile = null,
  drewProfile = null,
  triggers = [],
  sessions = [],
  checkIns = [],
  scenario = null,
  previousPerspective = null,
}) {
  const [primaryPerson = "Person A", secondaryPerson = "Other Person"] = participants;
  const resolvedPerspective = perspective || `${primaryPerson}→${secondaryPerson}`;
  // ── REUSE GATE ────────────────────────────────────────────────────────────
  const reuse_allowed = previousPerspective !== null && previousPerspective === resolvedPerspective;

  // SINGLE CONFIG: generateAnalysis() always produces the full deep base object.
  // analysis_type is stored as metadata only — it does NOT change the prompt.
  const config = ANALYSIS_CONFIG;
  const perspDef = buildPerspectiveInputs({
    perspective: resolvedPerspective,
    participants,
    tonyResponses,
    drewResponses,
    tonyProfile,
    drewProfile,
    triggers,
    sessions,
  });

  // inputs_used: summary of EXACTLY what data was fed into this call
  const inputs_used = {
    perspective: resolvedPerspective,
    reuse_allowed,
    subject: perspDef.inputs.subject,
    target: perspDef.inputs.target,
    is_directional: perspDef.inputs.is_directional,
    actor_response_count: resolvedPerspective === secondaryPerson ? drewResponses.length : tonyResponses.length,
    target_response_count: IS_DIRECTIONAL(resolvedPerspective)
      ? (resolvedPerspective === `${primaryPerson}→${secondaryPerson}` ? drewResponses.length : tonyResponses.length)
      : null,
    trigger_count: triggers.filter((t) => t.owner === perspDef.inputs.subject).length,
    session_count: sessions.filter((s) => s.speaker === perspDef.inputs.subject).length,
    scenario: scenario?.slice(0, 80) || null,
    timestamp: new Date().toISOString(),
  };

  // ── VALIDATION LOG ───────────────────────────────────────────────────────
  console.log("[AnalysisEngine] generateAnalysis() called", {
    perspective,
    resolvedPerspective,
    inputs_used,
    recomputed: !reuse_allowed,
    timestamp: inputs_used.timestamp,
  });

  const checkInCtx = checkIns
    .slice(0, 6)
    .map((c) => `${c.person_name} (${c.week_label || "recent"}): mood=${c.mood}, worked="${c.what_worked?.slice(0, 80)}"`)
    .join("\n");

  const isDir = IS_DIRECTIONAL(resolvedPerspective);

  const prompt = `${RELATIONSHIP_COACH_SYSTEM}

═══════════════════════════════════════
ANALYSIS ENGINE REQUEST
═══════════════════════════════════════
Perspective: ${perspDef.label}
Output: Full base object (all fields populated — modes are applied as display transforms post-generation)
${scenario ? `Scenario: "${scenario}"` : ""}

═══════════════════════════════════════
DATA CONTEXT (perspective-specific inputs — not generic couple data)
═══════════════════════════════════════
${perspDef.context}

${checkInCtx ? `CHECK-IN HISTORY:\n${checkInCtx}` : ""}

═══════════════════════════════════════
ANALYSIS INSTRUCTIONS
═══════════════════════════════════════
${config.instruction}

${perspDef.instruction}

CRITICAL: Return ONLY valid JSON. No markdown. No preamble. No text outside the JSON.

${isDir ? `
This is a DIRECTIONAL analysis. You MUST populate all 4 directional fields with substantive content specific to this direction (${perspDef.inputs.subject} → ${perspDef.inputs.target}):
- directional_impact: string — what ${perspDef.inputs.target} actually experiences when ${perspDef.inputs.subject} behaves according to their patterns
- misalignment_areas: string[] — specific trait-pairs where the two diverge (e.g., "Tony's conflict_avoidance=8 vs Drew's need_for_validation=9 — avoidance reads as dismissal")
- misalignment_areas: string[] — specific trait-pairs where the two diverge using the active participants' names
- perception_gap: string — the gap between ${perspDef.inputs.subject}'s likely INTENT and ${perspDef.inputs.target}'s likely INTERPRETATION
- communication_risk_points: string[] — specific interaction scenarios most likely to break down given this directional dynamic
` : `
This is an INDIVIDUAL analysis of ${perspDef.inputs.subject} only.
directional_impact, misalignment_areas, perception_gap, communication_risk_points MUST be null.
`}

${perspDef.schema_note}

JSON SCHEMA (return exactly this structure):
{
  "core_insight": "string",
  "behavioral_patterns": ["string", ...],
  "relationship_dynamics": ["string", ...],
  "risk_flags": ["string", ...],
  "strengths": ["string", ...],
  "recommended_actions": ["string", ...],
  "confidence_score": 0.0-1.0,
  "source_signals": ["string", ...],
  "frameworks_used": ["string", ...],
  "directional_impact": ${isDir ? '"string"' : "null"},
  "misalignment_areas": ${isDir ? '["string", ...]' : "null"},
  "perception_gap": ${isDir ? '"string"' : "null"},
  "communication_risk_points": ${isDir ? '["string", ...]' : "null"}
}

FIELD REQUIREMENTS:
- behavioral_patterns: 4–6 patterns with evidence from questionnaire data
- risk_flags: 2–4 concrete risk signals with triggering conditions named
- recommended_actions: 4–6 specific, actionable steps (word-for-word scripts for "action" mode)
- confidence_score: based on ${perspDef.inputs.response_count} data points
- source_signals: cite specific question IDs or answer fragments`;

  let result;
  const [personName, partnerName] = isDir
    ? resolvedPerspective.split("→").map((value) => value.trim())
    : [resolvedPerspective, resolvedPerspective === primaryPerson ? secondaryPerson : primaryPerson];
  try {
    result = await safeInvokeLLM(
      {
        prompt,
        model: "claude_sonnet_4_6",
        partnerLanguage: { personName, partnerName },
        response_json_schema: {
          type: "object",
          properties: {
            core_insight: { type: "string" },
            behavioral_patterns: { type: "array", items: { type: "string" } },
            relationship_dynamics: { type: "array", items: { type: "string" } },
            risk_flags: { type: "array", items: { type: "string" } },
            strengths: { type: "array", items: { type: "string" } },
            recommended_actions: { type: "array", items: { type: "string" } },
            confidence_score: { type: "number" },
            source_signals: { type: "array", items: { type: "string" } },
            frameworks_used: { type: "array", items: { type: "string" } },
            directional_impact: { type: "string" },
            misalignment_areas: { type: "array", items: { type: "string" } },
            perception_gap: { type: "string" },
            communication_risk_points: { type: "array", items: { type: "string" } },
          },
        },
      },
      40000,
      null,
      validateAnalysisSchema
    );
  } catch (err) {
    if (err instanceof CreditLimitError) throw err;
    result = null;
  }

  const normalized = personalizePartnerLanguage(
    normalizeAnalysisOutput(result, resolvedPerspective, analysis_type, inputs_used),
    { personName, partnerName }
  );

  // ── POST-GENERATION LOG ───────────────────────────────────────────────────
  console.log("[AnalysisEngine] Output generated", {
    perspective: resolvedPerspective,
    core_insight_preview: normalized.core_insight?.slice(0, 80),
    risk_flags_count: normalized.risk_flags?.length,
    is_directional: isDir,
    has_directional_fields: isDir
      ? !!(normalized.directional_impact && normalized.misalignment_areas?.length)
      : "N/A",
    confidence_score: normalized.confidence_score,
    recomputed: !reuse_allowed,
    timestamp: normalized.generated_at,
  });

  return normalized;
}

// ─── TRANSFORMERS live in /lib/analysisTransforms.js ────────────────────────
// Imported and re-exported at the top of this file.
// generateAnalysis() returns the BASE object only — no mode logic here.

// ─── PERSIST ──────────────────────────────────────────────────────────────────

export async function persistAnalysis(analysis) {
  try {
    const key = analysis.analysis_type === "deep" ? "deep_insights_json" : "context_insights_json";
    const existing = await api.entities.RelationshipDynamic.list();
    const record = existing?.[0];
    if (record?.id) {
      await api.entities.RelationshipDynamic.update(record.id, {
        [key]: JSON.stringify(analysis),
        last_analyzed: new Date().toISOString(),
      });
    }
  } catch (_) {}
}
