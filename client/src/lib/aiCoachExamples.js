/**
 * aiCoachExamples.js
 * ─────────────────────────────────────────────────────────────────
 * VALIDATION EXAMPLES — Structured AI Coach outputs.
 * These show the exact JSON schema, framework mappings, and multi-output derivation.
 *
 * USE FOR TESTING:
 * 1. Copy EXAMPLE_BASE_OUTPUT
 * 2. Pass to deriveOutputVariant() with variants: "full", "explain", "60-second", "action-plan", "what-now"
 * 3. Render with StructuredGuidancePanel component
 */

export const EXAMPLE_BASE_OUTPUT = {
  situation_summary:
    "Drew is bringing up a sensitive topic (something about your communication during conflicts) unexpectedly after a long work day when Tony is already stressed.",

  what_you_are_experiencing:
    "Tony is experiencing defensive alertness and fatigue — you're already depleted from work stress, and a difficult conversation feels like one more demand. Your conflict_avoidance (trait score 7/10) is likely activated, making you want to defer, change the subject, or minimize the issue.",

  what_they_are_experiencing:
    "Drew is likely experiencing frustration about being avoided, plus anxiety about whether you actually care about their concerns. Their emotional_sensitivity (score 7/10) means they're highly attuned to your tone — if you sound flat or dismissive, they'll interpret it as you not valuing them.",

  what_is_at_risk: [
    "Drew interprets your exhaustion/deferral as rejection rather than regulation — relationship distance increases",
    "Unaddressed issue grows resentment over time",
    "Conflict escalates when both people are dysregulated (tired + emotionally heightened)",
  ],

  what_to_do: [
    "Signal your intention before fully diving in: 'I want to hear this. I'm tired right now, so can we talk in 30 minutes after I decompress? This matters to me.'",
    "When you sit down, open with validation of Drew's feelings BEFORE introducing your own perspective",
    "Use 'I' statements: 'I noticed I shut down during that conflict. I hate that, and I want to do better.'",
    "Name your pattern directly: 'When I get stressed, I tend to pull away. It's not because I don't care — it's how I regulate. Help me understand what you need from me right now.'",
  ],

  what_not_to_do: [
    "Don't dismiss or minimize: 'This isn't a big deal' or 'Can we talk about this later?' — this confirms Drew's fear of not being heard",
    "Don't use 'you always/you never' framing — it triggers defensiveness and makes Tony even more avoidant",
    "Don't solve immediately — Drew needs to feel heard first before problem-solving happens",
    "Don't bring up past grievances — stick to THIS situation",
  ],

  suggested_language: [
    "I want to talk about this with you. I'm also tired right now, so let me take 30 minutes to recharge so I can show up fully. Can we check in then?",
    "I hear you, and I know this matters. Help me understand what you're feeling so I can really get it.",
    "I notice I shut down during conflict, and I hate that I do that with you. That's on me, not on you.",
    "I need to be honest: when you bring something up unexpectedly, my first instinct is to defer. But I don't want to keep doing that with you.",
  ],

  tone_recommendation: "gentle",

  frameworks_used: ["Gottman", "EFT", "Attachment"],
};

// ── FRAMEWORK MAPPING EXPLANATION ──────────────────────────────

export const FRAMEWORK_EXPLANATIONS = {
  Gottman:
    "This output applies Gottman's repair bids and turning-towards connection: (1) Signal intention before engagement to de-escalate; (2) Lead with validation; (3) Use 'we're a team' framing. Avoids stonewalling and criticism by reframing withdrawal as regulation, not rejection.",

  EFT: "This output centers emotional needs and attachment: understanding why Drew needs to be heard (attachment security), why Tony withdraws (self-regulation), and how to reconnect at the emotional level before problem-solving. Safe, attuned language activates receptivity.",

  Attachment:
    "Tony shows avoidant attachment under stress (withdraw to regulate). Drew shows anxious attachment (need reassurance of being valued). This output bridges them by acknowledging both styles and creating a window of safety.",

  CBT: "The 'I notice I shut down' language is cognitive reframing — naming the automatic thought/reaction pattern so Tony can begin to separate it from identity ('I do this' vs. 'I am broken'). This opens space for choice.",
};

// ── DERIVED OUTPUT EXAMPLES ────────────────────────────────────

export function getExampleVariant(variant) {
  const base = EXAMPLE_BASE_OUTPUT;

  switch (variant) {
    case "explain":
      return {
        situation_summary: base.situation_summary,
        what_you_are_experiencing: base.what_you_are_experiencing.split(".")[0] + ". [In simpler terms: you're tired and your gut is telling you to avoid difficult conversations right now.]",
        what_they_are_experiencing: base.what_they_are_experiencing.split(".")[0] + ". [They need to know you value them, and your tone right now will tell them everything.]",
        what_to_do: base.what_to_do.slice(0, 2),
        suggested_language: base.suggested_language.slice(0, 2),
        tone_recommendation: base.tone_recommendation,
        _note: "Simplified version — focus on emotional truth without jargon",
      };

    case "60-second":
      return {
        situation_summary: base.situation_summary,
        what_to_do: [base.what_to_do[0]],
        suggested_language: [base.suggested_language[0]],
        tone_recommendation: base.tone_recommendation,
        _note: "Ultra-condensed — take this one action next. Everything else is secondary.",
      };

    case "action-plan":
      return {
        what_to_do: base.what_to_do,
        what_not_to_do: base.what_not_to_do,
        suggested_language: base.suggested_language,
        tone_recommendation: base.tone_recommendation,
        _note: "Action-only version — skip emotional analysis, go straight to what to do and what to say",
      };

    case "what-now":
      return {
        what_to_do: [base.what_to_do[0]],
        suggested_language: [base.suggested_language[0]],
        tone_recommendation: base.tone_recommendation,
        _note: "What do I do right now? Take this action next. Don't overthink.",
      };

    case "full":
    default:
      return base;
  }
}

// ── VALIDATION CHECKLIST ─────────────────────────────────────────

export const VALIDATION_CHECKLIST = {
  schema_compliance: [
    "✓ situation_summary: 1-2 sentences, specific to the scenario",
    "✓ what_you_are_experiencing: Actor's emotional state + trait influence",
    "✓ what_they_are_experiencing: Target's emotional state + trait influence",
    "✓ what_is_at_risk: Array of 2-3 specific relationship outcomes",
    "✓ what_to_do: Array of 2-4 actionable steps with specific detail",
    "✓ what_not_to_do: Array of 2-3 behaviors to avoid with reasons",
    "✓ suggested_language: Array of 3-4 exact phrases, 'I-statements', no blame",
    "✓ tone_recommendation: 'gentle' | 'neutral' | 'direct'",
    "✓ frameworks_used: Array of applicable frameworks (Gottman, EFT, CBT, Attachment, etc.)",
  ],

  conflict_safe_language: [
    "✓ All suggested_language items start with 'I', not 'You'",
    "✓ No blame framing ('you always', 'you never')",
    "✓ Includes validation phrase acknowledging the other person",
    "✓ Clear request or need statement",
    "✓ References emotions, not accusations",
  ],

  perspective_specificity: [
    "✓ Output references actor and target by name (Tony/Drew)",
    "✓ Tone is adjusted for directional guidance (Tony→Drew vs. Drew→Tony)",
    "✓ Risk framing is specific to target's traits (e.g., Drew's emotional_sensitivity)",
    "✓ Suggested language avoids generic phrases, references actual situation",
  ],

  multi_output_derivation: [
    "✓ 'Explain' removes jargon, simplifies core emotional truth",
    "✓ '60-Second' keeps ONLY first action and first language phrase",
    "✓ 'Action Plan' strips emotional context, keeps do/don't/say",
    "✓ 'What Now' = first action only, ultra-focused",
    "✓ All variants use SAME base data (no new AI calls)",
  ],

  no_generic_language: [
    "✓ No 'it's important to communicate' — instead: specific communication strategy",
    "✓ No 'listen to each other' — instead: 'validate their emotion before sharing yours'",
    "✓ No 'work through this together' — instead: exact next steps",
  ],
};

// ── TEST SCENARIOS ────────────────────────────────────────────────

export const TEST_SCENARIOS = [
  {
    perspective: "Tony→Drew",
    situation: "Drew brings up something sensitive out of nowhere while Tony is exhausted from work",
    expectedToneRecommendation: "gentle",
    expectedFrameworks: ["Gottman", "EFT"],
  },
  {
    perspective: "Drew→Tony",
    situation: "Tony went quiet during the last conflict and Drew feels unheard",
    expectedToneRecommendation: "gentle",
    expectedFrameworks: ["Attachment", "EFT"],
  },
  {
    perspective: "Tony",
    situation: "I always shut down when we fight and I hate it",
    expectedToneRecommendation: "gentle",
    expectedFrameworks: ["CBT", "Attachment"],
  },
  {
    perspective: "Drew",
    situation: "I feel like Tony doesn't care about my feelings",
    expectedToneRecommendation: "gentle",
    expectedFrameworks: ["EFT", "Attachment"],
  },
];