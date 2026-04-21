/**
 * RelateIQ — Shared AI Coach Service
 * Single intelligence layer for all AI-driven sections.
 * All calls go through this service to ensure:
 * - consistent context passing
 * - memory-aware responses
 * - correct person/couple scoping
 * - reusable context objects for Explain / Elaborate / Export
 */

import { api } from "@/api/client";
import { RELATIONSHIP_COACH_SYSTEM, aggregateTags, serializeProfile, buildFullResponseContext } from "./prompts";
import { safeInvokeLLM } from "./aiSafe";

function getPartnerLanguageForScope(scope = "") {
  if (scope === "Tony") return { personName: "Tony", partnerName: "Drew" };
  if (scope === "Drew") return { personName: "Drew", partnerName: "Tony" };
  if (scope.includes("Tony") && scope.includes("Drew")) {
    return { personName: "Tony", partnerName: "Drew", replacePronouns: false };
  }
  return null;
}

/**
 * Build a structured context object for any AI section.
 * This object is reused for initial response, Explain, Elaborate, and Export.
 */
export function buildContextObject({
  page,
  sectionTitle,
  scope, // "Tony" | "Drew" | "Tony+Drew"
  sourceInputs,
  originalOutput,
  profiles = [],
  tonyResponses = [],
  drewResponses = [],
  sessions = [],
  checkIns = [],
  relationshipDynamic = null,
}) {
  const tonyProfile = profiles.find((p) => p.person_name === "Tony");
  const drewProfile = profiles.find((p) => p.person_name === "Drew");

  return {
    page,
    sectionTitle,
    scope,
    sourceInputs,
    originalOutput: originalOutput || null,
    timestamp: new Date().toISOString(),
    sessionId: `${page}-${Date.now()}`,
    memory: {
      tonyProfile: tonyProfile || null,
      drewProfile: drewProfile || null,
      tonyTags: aggregateTags(tonyResponses),
      drewTags: aggregateTags(drewResponses),
      tonyResponseCount: tonyResponses.length,
      drewResponseCount: drewResponses.length,
      recentSessions: sessions.slice(0, 20),
      recentCheckIns: checkIns.slice(0, 20),
      relationshipDynamic,
    },
  };
}

function serializeMemoryForPrompt(ctx) {
  const { memory, scope } = ctx;
  const lines = [];

  if (scope === "Tony" || scope === "Tony+Drew") {
    lines.push(serializeProfile("Tony", memory.tonyProfile));
    if (memory.tonyTags) lines.push(`Tony's behavioral patterns: ${memory.tonyTags}`);
  }
  if (scope === "Drew" || scope === "Tony+Drew") {
    lines.push(serializeProfile("Drew", memory.drewProfile));
    if (memory.drewTags) lines.push(`Drew's behavioral patterns: ${memory.drewTags}`);
  }
  if (memory.relationshipDynamic?.ai_dynamic_summary) {
    lines.push(`Couple dynamic summary: ${memory.relationshipDynamic.ai_dynamic_summary}`);
  }
  if (memory.recentSessions?.length > 0) {
    const sessionCtx = memory.recentSessions
      .map((s) => `  [${s.tool_type}] ${s.speaker} → ${s.speaking_to || "?"}: "${s.situation?.slice(0, 200)}"${s.ai_response ? `\n    AI noted: "${s.ai_response?.slice(0, 300)}"` : ""}`)
      .join("\n\n");
    lines.push(`Recent AI Coach sessions (${memory.recentSessions.length}):\n${sessionCtx}`);
  }
  if (memory.recentCheckIns?.length > 0) {
    const checkInCtx = memory.recentCheckIns
      .map((c) => `  ${c.person_name} (${c.week_label || "recent"}): mood=${c.mood || "?"}, worked="${c.what_worked?.slice(0, 150)}", improve="${c.what_could_improve?.slice(0, 150)}", gratitude="${c.gratitude?.slice(0, 100) || "not noted"}"`)
      .join("\n");
    lines.push(`Recent check-ins (${memory.recentCheckIns.length}):\n${checkInCtx}`);
  }
  return lines.join("\n\n");
}

/**
 * Ask AI Coach a free-form question with full page context.
 */
export async function askCoach({ question, ctx }) {
  const memoryBlock = serializeMemoryForPrompt(ctx);
  const prompt = `${RELATIONSHIP_COACH_SYSTEM}

═══════════════════════════════════════════
PAGE CONTEXT
═══════════════════════════════════════════
Page: ${ctx.page}
Section: ${ctx.sectionTitle}
Scope: ${ctx.scope}

${memoryBlock}

${ctx.originalOutput ? `CURRENT AI OUTPUT THE USER IS LOOKING AT:\n${ctx.originalOutput}` : ""}

═══════════════════════════════════════════
USER QUESTION
═══════════════════════════════════════════
${question}

Answer this question specifically in the context of the page and section above. 
Be specific to ${ctx.scope}. Use stored profile data and memory. Do not give generic advice.
Format your response with clear section headers and short readable paragraphs.`;

  const result = await safeInvokeLLM(
    { prompt, model: "claude_sonnet_4_6", partnerLanguage: getPartnerLanguageForScope(ctx.scope) },
    35000,
    "I'm unable to respond right now. Please try again in a moment."
  );

  // Log session
  try {
    const speaker = ctx.scope === "Drew" ? "Drew" : "Tony";
    await api.entities.CoachSession.create({
      speaker,
      speaking_to: ctx.scope === "Tony+Drew" ? "Drew" : speaker === "Tony" ? "Drew" : "Tony",
      situation: `[${ctx.page} / ${ctx.sectionTitle}] ${question}`,
      ai_response: result,
      tool_type: "coach",
    });
  } catch (_) {}

  return result;
}

/**
 * Explain: simplify an existing AI output section.
 */
export async function explainSection({ ctx }) {
  const memoryBlock = serializeMemoryForPrompt(ctx);
  const scope = ctx.scope;

  const prompt = `${RELATIONSHIP_COACH_SYSTEM}

The user wants a SIMPLIFIED EXPLANATION of the following AI-generated section.

Page: ${ctx.page}
Section: ${ctx.sectionTitle}
Scope: ${scope}

${memoryBlock}

AI CONTENT TO EXPLAIN:
${ctx.originalOutput}

Provide a simplified explanation that is:
- Easy to read and emotionally clear
- Written specifically for ${scope}
- Grounded in the same underlying data

Return your response in this exact format:

## 💡 What This Means
[Plain English version of the core message — 2-3 sentences]

## 🧠 Why the AI Said This
[Brief reason grounded in ${scope}'s actual patterns — 2-3 sentences]

## 💬 What It Means for ${scope.includes("+") ? "You Both" : scope}
[How this shows up in real life for this person / couple — 2-3 sentences]

## ✅ What To Do Next
[One or two realistic, immediate actions]

## 📌 One Simple Takeaway
[Single sentence. Make it memorable.]`;

  return safeInvokeLLM(
    { prompt, model: "claude_sonnet_4_6", partnerLanguage: getPartnerLanguageForScope(scope) },
    35000,
    "Unable to generate explanation right now. Please try again."
  );
}

/**
 * Elaborate: expand an existing AI output section with more depth.
 */
export async function elaborateSection({ ctx }) {
  const memoryBlock = serializeMemoryForPrompt(ctx);
  const scope = ctx.scope;

  const prompt = `${RELATIONSHIP_COACH_SYSTEM}

The user wants a DEEPER ELABORATION of the following AI-generated section.

Page: ${ctx.page}
Section: ${ctx.sectionTitle}
Scope: ${scope}

${memoryBlock}

AI CONTENT TO ELABORATE ON:
${ctx.originalOutput}

Provide a more detailed, expanded response that is:
- Richer in reasoning and examples
- Grounded in ${scope}'s actual patterns, history, and memory
- Organized and easy to scan

Return your response in this exact format:

## 🔍 Expanded Interpretation
[Deeper reading of what this output reveals — 3-4 sentences]

## 🔄 The Pattern Being Identified
[Name and describe the pattern specifically — what it looks like, where it comes from]

## 💞 Why This Matters in Your Relationship
[How this impacts ${scope.includes("+") ? "Tony and Drew's dynamic" : `${scope}'s experience`} — be specific]

## 🧩 How It May Show Up in Real Life
[A concrete, realistic example grounded in their dynamic]

## 🛠️ Ways to Work With It
[3-4 actionable suggestions, practical and achievable]

## ✨ Why This Fits Your Dynamic
[A closing insight connecting this pattern to their specific relationship history]`;

  return safeInvokeLLM(
    { prompt, model: "claude_sonnet_4_6", partnerLanguage: getPartnerLanguageForScope(scope) },
    35000,
    "Unable to generate elaboration right now. Please try again."
  );
}

/**
 * Generate a clean plain-text export summary from a context object.
 */
export function buildExportText(ctx, aiContent) {
  const date = new Date(ctx.timestamp).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
  return `RelateIQ — ${ctx.sectionTitle}
Generated: ${date}
Scope: ${ctx.scope}
Source: ${ctx.page}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${aiContent || ctx.originalOutput || ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RelateIQ provides evidence-informed relationship coaching insights and is not a substitute for licensed therapy.
`;
}
