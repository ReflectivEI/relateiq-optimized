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
import {
  buildActiveConnectionContext,
  buildActiveConnectionContextBlock,
  getRelationshipParticipants,
  validateOutputScope,
} from "./relationshipParticipants";

const SCOPE_VALIDATION_FAILURE = "This response could not be safely generated for the active connection. Please try again.";
const NOT_ENOUGH_SCOPED_INFORMATION = "Not enough information is available for this connection yet.";

function getNamesFromMemory(memory = {}) {
  const primaryProfile = memory?.primaryProfile || memory?.tonyProfile || null;
  const secondaryProfile = memory?.secondaryProfile || memory?.drewProfile || null;
  const primaryResponsesName = memory?.primaryResponses?.[0]?.person_name;
  const secondaryResponsesName = memory?.secondaryResponses?.[0]?.person_name;
  return {
    primaryPerson:
      primaryProfile?.person_name ||
      primaryResponsesName ||
      memory?.primaryPerson ||
      "Person A",
    secondaryPerson:
      secondaryProfile?.person_name ||
      secondaryResponsesName ||
      memory?.secondaryPerson ||
      "Other Person",
  };
}

function isPrimaryScope(scope = "", primaryPerson = "Person A") {
  return scope === primaryPerson || scope === "Tony";
}

function isSecondaryScope(scope = "", secondaryPerson = "Other Person") {
  return scope === secondaryPerson || scope === "Drew";
}

function isSharedScope(scope = "", primaryPerson = "Person A", secondaryPerson = "Other Person") {
  return (
    scope === `${primaryPerson}+${secondaryPerson}` ||
    scope === "Tony+Drew" ||
    (typeof scope === "string" &&
      scope.includes(primaryPerson) &&
      scope.includes(secondaryPerson))
  );
}

function getPartnerLanguageForScope(scope = "", memory = {}) {
  const { primaryPerson, secondaryPerson } = getNamesFromMemory(memory);
  if (isPrimaryScope(scope, primaryPerson)) {
    return { personName: primaryPerson, partnerName: secondaryPerson };
  }
  if (isSecondaryScope(scope, secondaryPerson)) {
    return { personName: secondaryPerson, partnerName: primaryPerson };
  }
  if (isSharedScope(scope, primaryPerson, secondaryPerson)) {
    return { personName: primaryPerson, partnerName: secondaryPerson, replacePronouns: false };
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
  scope,
  sourceInputs,
  originalOutput,
  profiles = [],
  tonyResponses = [],
  drewResponses = [],
  sessions = [],
  checkIns = [],
  relationshipDynamic = null,
  activeRelationship = null,
  actorUser = "",
  targetUser = "",
  forbiddenPeople = [],
}) {
  const relationshipParticipants = getRelationshipParticipants(activeRelationship, actorUser || profiles[0]?.person_name || tonyResponses[0]?.person_name);
  const primaryPerson =
    tonyResponses[0]?.person_name ||
    profiles[0]?.person_name ||
    relationshipParticipants[0] ||
    actorUser ||
    "Person A";
  const secondaryPerson =
    drewResponses[0]?.person_name ||
    profiles.find((p) => p.person_name && p.person_name !== primaryPerson)?.person_name ||
    profiles[1]?.person_name ||
    relationshipParticipants.find((person) => person && person !== primaryPerson) ||
    targetUser ||
    "Other Person";

  const primaryProfile =
    profiles.find((p) => p.person_name === primaryPerson) ||
    profiles[0] ||
    null;
  const secondaryProfile =
    profiles.find((p) => p.person_name === secondaryPerson) ||
    profiles.find((p) => p.person_name !== primaryProfile?.person_name) ||
    profiles[1] ||
    null;
  const relationshipLabel = `${primaryPerson} & ${secondaryPerson}`;

  return {
    page,
    sectionTitle,
    scope,
    sourceInputs,
    originalOutput: originalOutput || null,
    timestamp: new Date().toISOString(),
    sessionId: `${page}-${Date.now()}`,
    memory: {
      primaryProfile: primaryProfile || null,
      secondaryProfile: secondaryProfile || null,
      primaryResponses: tonyResponses,
      secondaryResponses: drewResponses,
      primaryTags: aggregateTags(tonyResponses),
      secondaryTags: aggregateTags(drewResponses),
      primaryResponseCount: tonyResponses.length,
      secondaryResponseCount: drewResponses.length,
      relationshipLabel,
      primaryPerson,
      secondaryPerson,
      tonyProfile: primaryProfile || null,
      drewProfile: secondaryProfile || null,
      tonyTags: aggregateTags(tonyResponses),
      drewTags: aggregateTags(drewResponses),
      tonyResponseCount: tonyResponses.length,
      drewResponseCount: drewResponses.length,
      recentSessions: sessions.slice(0, 20),
      recentCheckIns: checkIns.slice(0, 20),
      relationshipDynamic,
      activeRelationship,
      relationshipId: activeRelationship?.id || api.session.getStoredRelationshipId(),
    },
    scopeContext: buildActiveConnectionContext({
      pairId: activeRelationship?.id || api.session.getStoredRelationshipId(),
      activeConnectionId: activeRelationship?.id || api.session.getStoredRelationshipId(),
      activeRelationship,
      actorUser: actorUser || primaryPerson,
      targetUser: targetUser || secondaryPerson,
      allowedPeople: [primaryPerson, secondaryPerson],
      forbiddenPeople,
      availableDataSources: [
        profiles.length ? "profiles" : "",
        tonyResponses.length || drewResponses.length ? "questionnaire" : "",
        sessions.length ? "coachSessions" : "",
        checkIns.length ? "checkIns" : "",
        relationshipDynamic ? "relationshipDynamic" : "",
      ].filter(Boolean),
    }),
  };
}

function serializeMemoryForPrompt(ctx) {
  const { memory, scope } = ctx;
  const { primaryPerson, secondaryPerson } = getNamesFromMemory(memory);
  const lines = [];

  if (isPrimaryScope(scope, primaryPerson) || isSharedScope(scope, primaryPerson, secondaryPerson)) {
    lines.push(serializeProfile(primaryPerson, memory.primaryProfile || memory.tonyProfile));
    if (memory.primaryTags || memory.tonyTags) lines.push(`${primaryPerson}'s behavioral patterns: ${memory.primaryTags || memory.tonyTags}`);
  }
  if (isSecondaryScope(scope, secondaryPerson) || isSharedScope(scope, primaryPerson, secondaryPerson)) {
    lines.push(serializeProfile(secondaryPerson, memory.secondaryProfile || memory.drewProfile));
    if (memory.secondaryTags || memory.drewTags) lines.push(`${secondaryPerson}'s behavioral patterns: ${memory.secondaryTags || memory.drewTags}`);
  }
  if (memory.relationshipDynamic?.ai_dynamic_summary) {
    lines.push(`Connection dynamic summary: ${memory.relationshipDynamic.ai_dynamic_summary}`);
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
  const scopeContext = ctx?.scopeContext || buildActiveConnectionContext({
    pairId: ctx?.memory?.relationshipId || api.session.getStoredRelationshipId(),
    activeConnectionId: ctx?.memory?.relationshipId || api.session.getStoredRelationshipId(),
    activeRelationship: ctx?.memory?.activeRelationship,
    actorUser: ctx?.memory?.primaryPerson,
    targetUser: ctx?.memory?.secondaryPerson,
    allowedPeople: [ctx?.memory?.primaryPerson, ctx?.memory?.secondaryPerson].filter(Boolean),
  });

  if (!scopeContext.pairId || (scopeContext.availableDataSources || []).length === 0) {
    return NOT_ENOUGH_SCOPED_INFORMATION;
  }

  const memoryBlock = serializeMemoryForPrompt(ctx);
  const scopeBlock = buildActiveConnectionContextBlock(scopeContext);
  const prompt = `${RELATIONSHIP_COACH_SYSTEM}

${scopeBlock}

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

  const generate = (inputPrompt) => safeInvokeLLM(
    { prompt: inputPrompt, model: "claude_sonnet_4_6", partnerLanguage: getPartnerLanguageForScope(ctx.scope, ctx.memory) },
    35000,
    "I'm unable to respond right now. Please try again in a moment."
  );

  let result = await generate(prompt);
  let validation = validateOutputScope(result, scopeContext);
  if (!validation.ok) {
    const retryPrompt = `${prompt}\n\nSTRICT REGENERATION RULES:\n- A prior output was rejected for scope leakage (${validation.violations.join(", ")}).\n- Only mention allowedPeople and match relationshipStatus exactly.`;
    result = await generate(retryPrompt);
    validation = validateOutputScope(result, scopeContext);
    if (!validation.ok) {
      return SCOPE_VALIDATION_FAILURE;
    }
  }

  // Log session
  try {
    const { primaryPerson, secondaryPerson } = getNamesFromMemory(ctx.memory);
    const speaker = isSecondaryScope(ctx.scope, secondaryPerson) ? secondaryPerson : primaryPerson;
    await api.entities.CoachSession.create({
      speaker,
      speaking_to: isSharedScope(ctx.scope, primaryPerson, secondaryPerson)
        ? secondaryPerson
        : speaker === primaryPerson
          ? secondaryPerson
          : primaryPerson,
      situation: `[${ctx.page} / ${ctx.sectionTitle}] ${question}`,
      ai_response: result,
      tool_type: "coach",
    });
  } catch (_) { }

  return result;
}

/**
 * Explain: simplify an existing AI output section.
 */
export async function explainSection({ ctx }) {
  const scopeContext = ctx?.scopeContext || buildActiveConnectionContext({
    pairId: ctx?.memory?.relationshipId || api.session.getStoredRelationshipId(),
    activeConnectionId: ctx?.memory?.relationshipId || api.session.getStoredRelationshipId(),
    activeRelationship: ctx?.memory?.activeRelationship,
    actorUser: ctx?.memory?.primaryPerson,
    targetUser: ctx?.memory?.secondaryPerson,
    allowedPeople: [ctx?.memory?.primaryPerson, ctx?.memory?.secondaryPerson].filter(Boolean),
  });
  if (!scopeContext.pairId) return NOT_ENOUGH_SCOPED_INFORMATION;

  const memoryBlock = serializeMemoryForPrompt(ctx);
  const scope = ctx.scope;
  const scopeBlock = buildActiveConnectionContextBlock(scopeContext);

  const prompt = `${RELATIONSHIP_COACH_SYSTEM}

${scopeBlock}

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
[How this shows up in real life for this person or connection — 2-3 sentences]

## ✅ What To Do Next
[One or two realistic, immediate actions]

## 📌 One Simple Takeaway
[Single sentence. Make it memorable.]`;

  const first = await safeInvokeLLM(
    { prompt, model: "claude_sonnet_4_6", partnerLanguage: getPartnerLanguageForScope(scope, ctx.memory) },
    35000,
    "Unable to generate explanation right now. Please try again."
  );
  let validation = validateOutputScope(first, scopeContext);
  if (validation.ok) return first;

  const retryPrompt = `${prompt}\n\nSTRICT REGENERATION RULES:\n- A prior output was rejected for scope leakage (${validation.violations.join(", ")}).\n- Only mention allowedPeople and match relationshipStatus exactly.\n- Use the real participant names from the active connection only.`;
  const retry = await safeInvokeLLM(
    { prompt: retryPrompt, model: "claude_sonnet_4_6", partnerLanguage: getPartnerLanguageForScope(scope, ctx.memory) },
    35000,
    "Unable to generate explanation right now. Please try again."
  );
  validation = validateOutputScope(retry, scopeContext);
  return validation.ok ? retry : SCOPE_VALIDATION_FAILURE;
}

/**
 * Elaborate: expand an existing AI output section with more depth.
 */
export async function elaborateSection({ ctx }) {
  const scopeContext = ctx?.scopeContext || buildActiveConnectionContext({
    pairId: ctx?.memory?.relationshipId || api.session.getStoredRelationshipId(),
    activeConnectionId: ctx?.memory?.relationshipId || api.session.getStoredRelationshipId(),
    activeRelationship: ctx?.memory?.activeRelationship,
    actorUser: ctx?.memory?.primaryPerson,
    targetUser: ctx?.memory?.secondaryPerson,
    allowedPeople: [ctx?.memory?.primaryPerson, ctx?.memory?.secondaryPerson].filter(Boolean),
  });
  if (!scopeContext.pairId) return NOT_ENOUGH_SCOPED_INFORMATION;

  const memoryBlock = serializeMemoryForPrompt(ctx);
  const scope = ctx.scope;
  const scopeBlock = buildActiveConnectionContextBlock(scopeContext);

  const prompt = `${RELATIONSHIP_COACH_SYSTEM}

${scopeBlock}

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

## 💞 Why This Matters in Your Connection
[How this impacts ${scope.includes("+") ? "this connection dynamic" : `${scope}'s experience`} — be specific]

## 🧩 How It May Show Up in Real Life
[A concrete, realistic example grounded in their dynamic]

## 🛠️ Ways to Work With It
[3-4 actionable suggestions, practical and achievable]

## ✨ Why This Fits Your Dynamic
[A closing insight connecting this pattern to their specific relationship history]`;

  const first = await safeInvokeLLM(
    { prompt, model: "claude_sonnet_4_6", partnerLanguage: getPartnerLanguageForScope(scope, ctx.memory) },
    35000,
    "Unable to generate elaboration right now. Please try again."
  );
  let validation = validateOutputScope(first, scopeContext);
  if (validation.ok) return first;

  const retryPrompt = `${prompt}\n\nSTRICT REGENERATION RULES:\n- A prior output was rejected for scope leakage (${validation.violations.join(", ")}).\n- Only mention allowedPeople and match relationshipStatus exactly.\n- Use the real participant names from the active connection only.`;
  const retry = await safeInvokeLLM(
    { prompt: retryPrompt, model: "claude_sonnet_4_6", partnerLanguage: getPartnerLanguageForScope(scope, ctx.memory) },
    35000,
    "Unable to generate elaboration right now. Please try again."
  );
  validation = validateOutputScope(retry, scopeContext);
  return validation.ok ? retry : SCOPE_VALIDATION_FAILURE;
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
