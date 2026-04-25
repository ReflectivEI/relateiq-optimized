/**
 * RelateIQ — Trigger Intelligence Service
 * Handles trigger inference, serialization, and memory injection for AI prompts.
 */

import { api } from "@/api/client";
import { RELATIONSHIP_COACH_SYSTEM } from "./prompts";
import { safeInvokeLLM } from "./aiSafe";

// ─── TRIGGER SERIALIZER ───────────────────────────────────────────────────────

/**
 * Serialize confirmed/high-confidence triggers for injection into AI prompts.
 */
export function serializeTriggers(triggers, person) {
  if (!triggers || triggers.length === 0) return "";
  const relevant = triggers.filter(
    (t) => t.owner === person && (t.confirmed || t.confidence === "high" || t.confidence === "medium")
  );
  if (relevant.length === 0) return "";

  const lines = relevant
    .slice(0, 8)
    .map((t) => {
      let line = `  • [${t.trigger_type || "trigger"}] "${t.title}"`;
      if (t.common_reaction) line += ` → typical reaction: ${t.common_reaction}`;
      if (t.what_helps) line += ` | what helps: ${t.what_helps}`;
      if (t.what_worsens) line += ` | worsens when: ${t.what_worsens}`;
      return line;
    })
    .join("\n");

  return `${person.toUpperCase()}'S KNOWN TRIGGERS (use these to calibrate advice):\n${lines}`;
}

/**
 * Serialize both participants' triggers for connection-level AI calls.
 */
export function serializeAllTriggers(triggers, participants = ["Person A", "Other Person"]) {
  const [primaryPerson = "Person A", secondaryPerson = "Other Person"] = participants;
  const primary = serializeTriggers(triggers, primaryPerson);
  const secondary = serializeTriggers(triggers, secondaryPerson);
  return [primary, secondary].filter(Boolean).join("\n\n");
}

// ─── TRIGGER INFERENCE ────────────────────────────────────────────────────────

/**
 * Analyze free text for likely triggers/patterns.
 * Returns null if nothing significant detected.
 */
export async function inferTriggersFromText(text, person) {
  if (!text || text.trim().length < 20) return null;

  // Quick heuristic check — only call AI if text contains signal phrases
  const signalPhrases = [
    "it really bothers me", "i hate when", "i shut down", "i feel hurt",
    "i feel pressured", "i need", "i feel alone", "i get defensive",
    "bothers me when", "triggers me", "upsets me when", "frustrates me",
    "i feel ignored", "i feel dismissed", "overwhelmed when", "when he ",
    "when they ", "it makes me feel", "i feel lonely", "shuts down",
    "doesn't listen", "too many questions", "i feel misunderstood"
  ];

  const lower = text.toLowerCase();
  const hasSignal = signalPhrases.some((p) => lower.includes(p));
  if (!hasSignal) return null;

  const result = await safeInvokeLLM({
    prompt: `${RELATIONSHIP_COACH_SYSTEM}

Analyze the following text written by ${person} and determine if it reveals any triggers, sensitivities, support preferences, or emotional patterns.

TEXT:
"${text}"

Return a JSON object. If NO meaningful trigger/pattern is present, return {"detected": false}.
If something is detected, return:
{
  "detected": true,
  "suggestions": [
    {
      "title": "short trigger name",
      "trigger_type": one of: "tone"|"timing"|"criticism"|"overwhelm"|"last_minute_plans"|"feeling_misunderstood"|"too_many_questions"|"feeling_ignored"|"affection_mismatch"|"work_stress"|"family"|"sensory_irritation"|"shutdown_risk"|"accountability"|"feeling_pressured"|"other",
      "description": "what this trigger is about",
      "emotional_meaning": "what it means emotionally to ${person}",
      "common_reaction": "how ${person} likely reacts",
      "what_helps": "what tends to help",
      "save_type": "trigger" | "support_preference" | "pattern",
      "confidence": "low" | "medium" | "high"
    }
  ]
}
Only return up to 2 suggestions. Only include genuinely meaningful patterns — not minor preferences.`,
    response_json_schema: {
      type: "object",
      properties: {
        detected: { type: "boolean" },
        suggestions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              trigger_type: { type: "string" },
              description: { type: "string" },
              emotional_meaning: { type: "string" },
              common_reaction: { type: "string" },
              what_helps: { type: "string" },
              save_type: { type: "string" },
              confidence: { type: "string" },
            },
          },
        },
      },
    },
  }, 15000, null);

  if (!result?.detected || !result?.suggestions?.length) return null;
  return result.suggestions;
}

// ─── CLARIFICATION ENGINE ─────────────────────────────────────────────────────

/**
 * Determine if a situation needs clarification before coaching.
 * Returns null if no clarification needed, or {needed: true, questions: [...]} if it does.
 */
export async function checkIfClarificationNeeded({ situation, speaker, speakingTo, speakerProfile, targetProfile, triggers = [] }) {
  const hasGoodProfile = speakerProfile?.ai_behavioral_summary && targetProfile?.ai_behavioral_summary;
  const hasTriggers = triggers.filter((t) => t.owner === speakingTo && t.confirmed).length > 2;

  // If we have rich profiles + confirmed triggers, skip clarification
  if (hasGoodProfile && hasTriggers) return null;

  const result = await safeInvokeLLM({
    prompt: `${RELATIONSHIP_COACH_SYSTEM}

${speaker} has submitted the following situation for AI coaching guidance:
"${situation}"

Speaking to/about: ${speakingTo}

Profile available for ${speaker}: ${speakerProfile?.ai_behavioral_summary ? "Yes — " + speakerProfile.ai_behavioral_summary.slice(0, 200) : "Partial or none"}
Profile available for ${speakingTo}: ${targetProfile?.ai_behavioral_summary ? "Yes — " + targetProfile.ai_behavioral_summary.slice(0, 200) : "Partial or none"}

Known confirmed triggers for ${speakingTo}: ${hasTriggers ? "Several confirmed" : "Few or none yet"}

Determine whether you need 2–4 clarifying questions to significantly improve the quality of coaching guidance.

Only ask for clarification if:
- The situation is emotionally loaded but vague about the goal
- The trigger or reaction pattern is unclear
- The desired outcome is unclear (understanding vs repair vs boundary vs action)
- There is an important unknown about how ${speakingTo} tends to react

Return JSON:
{
  "clarification_needed": true | false,
  "reason": "brief explanation of why clarification helps or isn't needed",
  "questions": [
    { "question": "...", "why": "short reason this matters" }
  ]
}
Maximum 4 questions. Return empty array if clarification_needed is false.`,
    response_json_schema: {
      type: "object",
      properties: {
        clarification_needed: { type: "boolean" },
        reason: { type: "string" },
        questions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              why: { type: "string" },
            },
          },
        },
      },
    },
  }, 15000, null);

  if (!result?.clarification_needed) return null;
  return result;
}

// ─── TRIGGER SAVE HELPER ──────────────────────────────────────────────────────

export async function saveTrigger({ owner, suggestion, relatedContext, source = "ai_inferred" }) {
  return api.entities.TriggerEntry.create({
    owner,
    title: suggestion.title,
    description: suggestion.description,
    trigger_type: suggestion.trigger_type || "other",
    emotional_meaning: suggestion.emotional_meaning,
    common_reaction: suggestion.common_reaction,
    what_helps: suggestion.what_helps,
    confidence: suggestion.confidence || "medium",
    source,
    confirmed: false,
    related_context: relatedContext?.slice(0, 500),
  });
}
