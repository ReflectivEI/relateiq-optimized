/**
 * RelateIQ — Repair Opportunity Service
 * Detects high-stress / trigger-activated situations and generates
 * 3 proactive, low-pressure repair scripts tailored to the emotional tone.
 */

import { api } from "@/api/client";
import { RELATIONSHIP_COACH_SYSTEM, serializeProfile } from "./prompts";
import { serializeTriggers } from "./triggerService";

// Stress/trigger signal phrases used for a cheap pre-check before calling AI
const HIGH_STRESS_SIGNALS = [
  "shut down", "shutting down", "shut off",
  "walked away", "walked out", "stormed out",
  "blew up", "exploded", "lost it",
  "screamed", "yelled", "raised voice",
  "silent treatment", "not talking",
  "ignored me", "dismissive",
  "i feel hurt", "really hurt",
  "i feel attacked", "attacked me",
  "i feel criticized", "picked on",
  "defensive", "got defensive",
  "overwhelmed", "too much",
  "can't do this", "done with",
  "frustrated", "exhausted by",
  "argument", "fight", "conflict",
  "same fight", "again", "always does",
  "never listens", "doesn't care",
  "feel alone", "feel lonely",
  "disconnected", "distant",
  "repair", "apologize", "sorry",
  "said something i regret", "crossed a line",
];

/**
 * Returns true if the situation text contains enough stress signal to warrant repair check.
 */
export function hasStressSignal(text) {
  if (!text || text.length < 15) return false;
  const lower = text.toLowerCase();
  return HIGH_STRESS_SIGNALS.some((s) => lower.includes(s));
}

/**
 * Main function: analyzes a Coach session and returns repair scripts if warranted.
 * Returns null if no repair opportunity detected.
 */
export async function detectRepairOpportunity({
  situation,
  aiResponse,
  speaker,
  speakingTo,
  speakerProfile,
  targetProfile,
  triggers = [],
}) {
  // Quick heuristic gate — only call AI if signals are present
  const combinedText = `${situation} ${aiResponse || ""}`.toLowerCase();
  const signalCount = HIGH_STRESS_SIGNALS.filter((s) => combinedText.includes(s)).length;
  if (signalCount < 2) return null;

  const speakerCtx = serializeProfile(speaker, speakerProfile);
  const targetCtx = serializeProfile(speakingTo, targetProfile);
  const triggerCtx = [
    serializeTriggers(triggers, speaker),
    serializeTriggers(triggers, speakingTo),
  ].filter(Boolean).join("\n\n");

  const triggerBlock = triggerCtx ? `\nKNOWN TRIGGERS:\n${triggerCtx}` : "";
  const prompt = RELATIONSHIP_COACH_SYSTEM + `

Analyze the following Coach session and determine if a proactive repair opportunity exists.

SPEAKER: ${speaker}
SPEAKING TO: ${speakingTo}

SITUATION DESCRIBED:
"${situation}"

${speakerCtx}
${targetCtx}
${triggerBlock}

TASK: Determine if this situation shows signs of:
- A high-stress pattern (flooding, shutdown, escalation, repeated conflict loop)
- A known trigger being activated
- A moment where repair would be valuable RIGHT NOW

If YES, generate exactly 3 repair scripts tailored to the current emotional tone and both people's profiles.
Each script must:
- Be something ${speaker} could actually say or text to ${speakingTo} right now
- Sound completely natural — no therapy-speak
- Be low-pressure (no demands, no defensiveness, no "you always/never")
- Match the emotional register of the moment (e.g. if tense — softer; if distant — warmer)
- Reference something specific about how ${speakingTo} tends to receive repair

Also provide:
- A brief read of the emotional tone of the current moment
- Which trigger or pattern this repair is addressing
- One "do not say" — a phrase to avoid in this exact moment

Return JSON with repair_needed, emotional_tone, pattern_detected, scripts (array of label/script/why), and avoid.
If NO repair is needed, return: { "repair_needed": false }`;

  const result = await api.integrations.Core.InvokeLLM({
    prompt,
    model: "gpt_5_mini",
    response_json_schema: {
      type: "object",
      properties: {
        repair_needed: { type: "boolean" },
        emotional_tone: { type: "string" },
        pattern_detected: { type: "string" },
        scripts: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              script: { type: "string" },
              why: { type: "string" },
            },
          },
        },
        avoid: { type: "string" },
      },
    },
  });

  if (!result?.repair_needed) return null;
  return result;
}