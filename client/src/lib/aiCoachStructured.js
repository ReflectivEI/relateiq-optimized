/**
 * aiCoachStructured.js
 * ─────────────────────────────────────────────────────────────────
 * Structured AI Coach output with schema-locked JSON + multi-output derivation.
 *
 * ALL outputs follow this schema — NO free-form text allowed.
 * From ONE base output, derive: Full, Explain This, 60-Second, Action Plan, What Now
 *
 * Public API:
 *   generateStructuredGuidance(perspective, situation, ctx)
 *   deriveOutputVariant(baseOutput, variant)
 */

import { api } from "@/api/client";
import { RELATIONSHIP_COACH_SYSTEM } from "./prompts";
import { safeInvokeLLM } from "./aiSafe";
import { matchFrameworks, buildFrameworkExplanations } from "./frameworkEngine";

// ── FRAMEWORK MAPPINGS ────────────────────────────────────────────

export const FRAMEWORK_MAPPINGS = {
  Gottman: "Focus on repair bids, turning towards connection, and managing stonewalling — conflict repair approach based on observational research.",
  EFT: "Emotional regulation and attachment needs — safe, slow, attuned connection centered on underlying emotional experiences.",
  CBT: "Thought-reaction patterns and cognitive restructuring — identifying and reframing unhelpful thought loops.",
  "LGBTQ dynamics": "Acknowledging unique power dynamics, external stressors, and validation needs specific to LGBTQ+ relationships.",
  Attachment: "Secure vs. anxious/avoidant attachment patterns and how they show up under stress or during conflict.",
  Validation: "Meeting someone's need to be heard and understood before problem-solving or offering advice.",
};

// ── CONFLICT-SAFE LANGUAGE ENGINE ────────────────────────────────

function generateConflictSafeLanguage(situation, perspective, tone, targetProfile) {
  const templates = {
    gentle: [
      `I want to share something that matters to me, and I'm not blaming you — I just want us to understand each other better.`,
      `I've been noticing something, and I want to talk about it in a way that helps us get closer, not further apart.`,
      `I need to be honest about how I'm feeling, and I trust you to hear me with care.`,
    ],
    neutral: [
      `I'd like to discuss something that's been on my mind. Can we talk about it?`,
      `I need to express my perspective on this. I'd appreciate your thoughts too.`,
      `I think we need to address this directly so we can move forward together.`,
    ],
    direct: [
      `We need to talk about this, and I want to be straight with you.`,
      `I'm not okay with how this is going, and I need to say so clearly.`,
      `This matters to me, and I need you to understand why.`,
    ],
  };

  const openings = templates[tone] || templates.neutral;
  return openings[Math.floor(Math.random() * openings.length)];
}

function getParticipantProfilesFromMemory(memory = {}) {
  const primaryPerson = memory?.primaryPerson || memory?.primaryProfile?.person_name || memory?.tonyProfile?.person_name || "Person A";
  const secondaryPerson = memory?.secondaryPerson || memory?.secondaryProfile?.person_name || memory?.drewProfile?.person_name || "Other Person";
  const primaryProfile = memory?.primaryProfile || memory?.tonyProfile || null;
  const secondaryProfile = memory?.secondaryProfile || memory?.drewProfile || null;

  return {
    primaryPerson,
    secondaryPerson,
    profileFor(person) {
      if (!person) return null;
      if (person === primaryPerson) return primaryProfile;
      if (person === secondaryPerson) return secondaryProfile;
      if (person === "Tony") return memory?.tonyProfile || primaryProfile;
      if (person === "Drew") return memory?.drewProfile || secondaryProfile;
      return null;
    },
  };
}

// ── MAIN STRUCTURED GUIDANCE GENERATION ──────────────────────────

/**
 * Generate a single base structured guidance output.
 * NO free-form text — ALL fields follow schema.
 *
 * @param {object} params
 * @param {string} params.perspective — "PersonA" | "PersonB" | "PersonA→PersonB"
 * @param {string} params.situation — the situation being discussed
 * @param {object} params.ctx — full context object with profiles, traits, etc.
 * @returns {object} Structured guidance following the schema
 */
export async function generateStructuredGuidance({ perspective, situation, ctx }) {
  const isDirectional = perspective.includes("→");
  const [actor, target] = isDirectional
    ? perspective.split("→").map((s) => s.trim())
    : [perspective, perspective];

  const memory = ctx.memory || {};
  const participants = getParticipantProfilesFromMemory(memory);
  const actorProfile = participants.profileFor(actor);
  const targetProfile = participants.profileFor(target);
  const actorTraits = actorProfile?.traits || {};
  const targetTraits = targetProfile?.traits || {};

  // Match frameworks deterministically
  const matchedFrameworks = matchFrameworks({
    patterns: [],
    traits: actorTraits,
    other_traits: targetTraits,
    scenario_id: null,
    perspective,
    lgbtq_context: false, // Set to true if app has LGBTQ context
  });

  const prompt = `You are a relationship coach using Gottman, EFT, and CBT frameworks. 
Generate ONLY valid JSON following this exact structure. NO free-form text.

Perspective: ${perspective}
Situation: ${situation}

Actor: ${actor}
Target: ${target}${isDirectional ? " (directional guidance)" : " (self-guidance)"}

Actor Profile/Traits: ${JSON.stringify(actorTraits)}
Target Profile/Traits: ${JSON.stringify(targetTraits)}

${memory.recentSessions?.length > 0 ? `Recent sessions context: ${memory.recentSessions.map((s) => s.situation).join("; ").slice(0, 500)}` : ""}

Respond with ONLY this JSON (no markdown, no code block):

{
  "situation_summary": "1-2 sentence restatement of the situation",
  "what_you_are_experiencing": "${actor} is likely experiencing [emotional state]. [Specific impact on them].",
  "what_they_are_experiencing": "${target} is likely experiencing [emotional state]. [Specific impact on them].",
  "what_is_at_risk": ["Specific relationship outcome if unaddressed", "Another specific risk"],
  "what_to_do": [
    "Action 1 with specific detail",
    "Action 2 with specific detail"
  ],
  "what_not_to_do": [
    "Avoid this specific behavior because [why]",
    "Don't do this because [why]"
  ],
  "suggested_language": [
    "I-statement opening that doesn't blame",
    "Validation phrase for ${target}",
    "Clear request or need statement"
  ],
  "tone_recommendation": "gentle|neutral|direct",
  "frameworks_used": ["Gottman", "EFT"]
}

All fields must be specific to ${perspective}. Use profile data. Reference patterns.`;

  const jsonStr = await safeInvokeLLM(
    { prompt, model: "claude_sonnet_4_6" },
    35000,
    JSON.stringify({
      situation_summary: `Guidance for ${perspective} regarding: ${situation.slice(0, 100)}`,
      what_you_are_experiencing: `${actor} is likely experiencing anxiety about the conversation.`,
      what_they_are_experiencing: `${target} may be feeling defensive or uncertain.`,
      what_is_at_risk: ["Misunderstanding escalates", "Distance grows"],
      what_to_do: ["Take a breath before speaking", "Choose a calm time and place"],
      what_not_to_do: ["Don't use accusatory language", "Avoid bringing up past issues"],
      suggested_language: [
        `I want to talk about something that matters to me.`,
        `I'm not blaming you — I just want us to understand each other.`,
        `Can we find a time to discuss this?`,
      ],
      tone_recommendation: "gentle",
      frameworks_used: ["Gottman"],
    })
  );

  try {
    const parsed = JSON.parse(jsonStr);

    // Attach framework explanations
    const frameworkExplanations = buildFrameworkExplanations(matchedFrameworks, {
      actor,
      target,
      scenario: situation,
      trait_influence: Object.entries(actorTraits)
        .filter(([, v]) => v?.score >= 6)
        .map(([k]) => k)
        .join(", "),
      lgbtq_note: "Both partners' emotional needs and identity are honored in this guidance.",
    });

    return {
      ...parsed,
      frameworks_used: matchedFrameworks.map((m) => m.framework),
      framework_explanations: frameworkExplanations,
    };
  } catch {
    // If JSON parsing fails, return fallback
    return {
      situation_summary: `Guidance for ${perspective}`,
      what_you_are_experiencing: `${actor} is experiencing tension about this situation.`,
      what_they_are_experiencing: `${target} may be feeling similarly challenged.`,
      what_is_at_risk: ["Misunderstanding", "Growing distance"],
      what_to_do: ["Choose a calm moment", "Use 'I' statements"],
      what_not_to_do: ["Avoid blame", "Don't escalate tone"],
      suggested_language: [`I want to talk about something.`, `Help me understand your perspective.`],
      tone_recommendation: "gentle",
      frameworks_used: ["GOTTMAN"],
      framework_explanations: buildFrameworkExplanations(
        matchedFrameworks,
        { actor, target, scenario: situation }
      ),
    };
  }
}

// ── MULTI-OUTPUT DERIVATION (NO new AI calls) ────────────────────

/**
 * Derive a variant of the base output WITHOUT additional AI calls.
 * All variants are derived transforms of the same base analysis.
 *
 * @param {object} baseOutput — the structured guidance output
 * @param {string} variant — "explain" | "60-second" | "action-plan" | "what-now" | "full"
 * @returns {object} Transformed output
 */
export function deriveOutputVariant(baseOutput, variant) {
  switch (variant) {
    case "explain":
      // Simplify and contextualize
      return {
        ...baseOutput,
        what_you_are_experiencing:
          baseOutput.what_you_are_experiencing.split(".")[0] + ".  [In other words: the emotional core without jargon]",
        what_they_are_experiencing:
          baseOutput.what_they_are_experiencing.split(".")[0] + ".  [What they likely need from you: understanding without solving.]",
        what_to_do: baseOutput.what_to_do.slice(0, 2),
        suggested_language: baseOutput.suggested_language.slice(0, 2),
      };

    case "60-second":
      // Ultra-condensed version
      return {
        situation_summary: baseOutput.situation_summary,
        what_to_do: [baseOutput.what_to_do[0]],
        suggested_language: [baseOutput.suggested_language[0]],
        tone_recommendation: baseOutput.tone_recommendation,
        _note: "60-second version — focus on the most critical action first.",
      };

    case "action-plan":
      // Only actions, no theory
      return {
        situation_summary: baseOutput.situation_summary,
        what_to_do: baseOutput.what_to_do,
        what_not_to_do: baseOutput.what_not_to_do,
        suggested_language: baseOutput.suggested_language,
        tone_recommendation: baseOutput.tone_recommendation,
        _note: "Action-focused version — skip the emotional analysis, go straight to what to do.",
      };

    case "what-now":
      // Immediate next step only
      return {
        what_to_do: [baseOutput.what_to_do[0]], // First action only
        suggested_language: [baseOutput.suggested_language[0]], // First language template
        tone_recommendation: baseOutput.tone_recommendation,
        _note: "What do I do right now? Take this one action next.",
      };

    case "full":
    default:
      // Return as-is
      return baseOutput;
  }
}

// ── QUICK ACTION HANDLER ──────────────────────────────────────────

/**
 * Generate a quick "How do I handle this?" response.
 * Returns: immediate action + language + risk warning.
 */
export function generateQuickAction(baseOutput) {
  const firstAction = baseOutput.what_to_do?.[0] || "Take a moment to regulate before responding.";
  const firstLanguage = baseOutput.suggested_language?.[0] || "I want to understand what's happening here.";
  const risks = baseOutput.what_is_at_risk || [];
  const riskWarning = risks.length > 0 ? `Risk: ${risks[0]}` : null;

  return {
    immediate_action: firstAction,
    what_to_say: firstLanguage,
    risk_if_not_addressed: riskWarning,
    tone: baseOutput.tone_recommendation,
  };
}

// ── LOGGING ──────────────────────────────────────────────────────

/**
 * Log the structured guidance to CoachSession.
 */
export async function logStructuredGuidance(perspective, situation, baseOutput, ctx) {
  try {
    const [speaker, target] = perspective.includes("→")
      ? perspective.split("→").map((s) => s.trim())
      : [perspective, perspective];

    await api.entities.CoachSession.create({
      speaker,
      speaking_to: target,
      situation,
      ai_response: JSON.stringify(baseOutput),
      tool_type: "coach",
      strategy: baseOutput.what_to_do?.[0] || "",
      sample_script: baseOutput.suggested_language?.[0] || "",
    });
  } catch (_) {
    // Fire-and-forget
  }
}