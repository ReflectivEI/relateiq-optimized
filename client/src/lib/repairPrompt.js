/**
 * RelateIQ — Proactive Repair Prompt Builder
 * Generates a comprehensive repair analysis prompt injecting full memory context.
 */
import { RELATIONSHIP_COACH_SYSTEM, serializeProfile, aggregateTags } from "./prompts";
import { serializeTriggers } from "./triggerService";

/**
 * Serialize past outcome logs into a concise memory block for AI injection.
 */
export function serializeOutcomeMemory(outcomeLogs = [], scope) {
  const relevant = outcomeLogs.filter(
    (o) => o.scope === scope
  ).slice(0, 10);

  if (relevant.length === 0) return "";

  const lines = relevant.map((o) => {
    const tried = o.action_attempted ? "tried" : "not tried";
    const result = o.outcome_rating || "unknown";
    const tension = o.tension_change || "unknown";
    return `  [${o.source_type}] ${tried} → ${result} | tension: ${tension} | notes: "${(o.user_notes || "none").slice(0, 80)}"`;
  });

  return `PAST OUTCOME HISTORY (${relevant.length} logged outcomes):\n${lines.join("\n")}`;
}

/**
 * Serialize past repair entries for memory injection.
 */
export function serializeRepairMemory(repairEntries = [], scope) {
  const relevant = repairEntries
    .filter((r) => r.owner === scope)
    .filter((r) => r.outcome_logged)
    .slice(0, 6);

  if (relevant.length === 0) return "";

  const lines = relevant.map((r) =>
    `  Situation: "${(r.what_happened || "").slice(0, 80)}" → tried: "${(r.what_was_tried || "none").slice(0, 60)}" → outcome: ${r.outcome_rating || "unknown"}${r.did_it_reduce_tension ? " ✓ reduced tension" : ""}${r.did_it_increase_connection ? " ✓ improved connection" : ""}`
  );

  return `PAST REPAIR HISTORY:\n${lines.join("\n")}`;
}

export function buildRepairPrompt({
  person,
  partnerName,
  whatHappened,
  howFeelingNow,
  whatFeelsUnfinished,
  desiredOutcome,
  alreadyTried,
  situationTags = [],
  speakerProfile,
  targetProfile,
  triggers = [],
  outcomeLogs = [],
  repairEntries = [],
}) {
  const speakerCtx = serializeProfile(person, speakerProfile);
  const targetCtx = serializeProfile(partnerName, targetProfile);
  const triggerCtx = [
    serializeTriggers(triggers, person),
    serializeTriggers(triggers, partnerName),
  ].filter(Boolean).join("\n\n");

  const outcomeMemory = serializeOutcomeMemory(outcomeLogs, person);
  const repairMemory = serializeRepairMemory(repairEntries, person);

  const tagsLine = situationTags.length > 0 ? `Situation tags: ${situationTags.join(", ")}` : "";

  return `${RELATIONSHIP_COACH_SYSTEM}

${person} is asking for proactive repair guidance inside a ${partnerName} connection. This is not a coaching session — this is a REPAIR intervention. Focus entirely on what will most effectively help ${person} and ${partnerName} reconnect and move forward.

═══════════════════════════════════════════════════════
REPAIR REQUEST
═══════════════════════════════════════════════════════
From: ${person}
With: ${partnerName}
${tagsLine}

What happened:
"${whatHappened}"

How things are feeling now:
"${howFeelingNow || "not specified"}"

What feels unfinished:
"${whatFeelsUnfinished || "not specified"}"

What ${person} wants right now:
"${desiredOutcome || "not specified"}"

What has already been tried:
"${alreadyTried || "nothing yet"}"

${speakerCtx}
${targetCtx}

${triggerCtx ? `KNOWN TRIGGERS:\n${triggerCtx}` : ""}
${outcomeMemory ? `\n${outcomeMemory}` : ""}
${repairMemory ? `\n${repairMemory}` : ""}

═══════════════════════════════════════════════════════
REPAIR ANALYSIS INSTRUCTIONS
═══════════════════════════════════════════════════════

Use ALL stored profile data, trigger memory, and past outcome history to generate the most tailored repair guidance possible for this exact pairing.

Past outcomes that "helped" should be weighted as more likely to work.
Past outcomes that "worsened" should be noted as to avoid.

Generate a complete repair analysis as JSON with these exact fields:

- what_likely_happened: string — 3–4 sentences interpreting the underlying dynamic; what was really happening beneath the surface
- what_primary_needs_now: string — what ${person} likely needs right now (1–2 specific sentences grounded in profile)
- what_counterpart_needs_now: string — what ${partnerName} likely needs right now (1–2 specific sentences grounded in profile)
- best_repair_move: string — the single most effective immediate repair move for this specific moment; be concrete and specific
- repair_options: array of 3–4 objects each with {action: string, why: string, effort_level: "low"|"medium"|"high"} — realistic repair options tailored to this connection
- what_to_avoid: array of 3–4 strings — specific phrases, tones, or actions likely to worsen this situation given both profiles
- repair_scripts: array of 2–3 objects each with {label: string, script: string, notes: string} — ready-to-use scripts ${person} can say or text right now; each must sound natural, not therapeutic
- why_this_fits: string — 2–3 sentences explaining why these repair moves fit this specific couple's dynamic and history
- timing_guidance: string — when and how to initiate; account for both people's processing styles and energy patterns
- next_checkin: string — when to revisit this and what to pay attention to
- learned_from_history: string — 1–2 sentences noting anything specific from past outcomes that shaped these recommendations (or "No prior outcome data yet")`;
}
