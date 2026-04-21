/**
 * aiCoachIntegration.js
 * ─────────────────────────────────────────────────────────────────
 * HOW TO USE THE STRUCTURED AI COACH SYSTEM
 *
 * 1. In a page, import generateStructuredGuidance and deriveOutputVariant
 * 2. Call generateStructuredGuidance with perspective, situation, and context
 * 3. Render output with StructuredGuidancePanel component
 * 4. Multi-output derivation is automatic (no new AI calls)
 * 5. Log with logStructuredGuidance for session tracking
 */

// ── EXAMPLE PAGE USAGE ────────────────────────────────────────────

const examplePageUsage = `
import { generateStructuredGuidance, logStructuredGuidance } from "@/lib/aiCoachStructured";
import { buildContextObject } from "@/lib/aiCoachService";
import StructuredGuidancePanel from "@/components/coach/StructuredGuidancePanel";

export default function ExamplePage() {
  const [guidance, setGuidance] = useState(null);

  const handleGenerateGuidance = async () => {
    // Build context with user data
    const ctx = buildContextObject({
      page: "Example Page",
      sectionTitle: "Guidance Section",
      scope: "Tony→Drew", // or "Tony", "Drew", "Drew→Tony"
      sourceInputs: {},
      profiles: [tonyProfile, drewProfile],
      tonyResponses: tonyResponses,
      drewResponses: drewResponses,
      sessions: sessions,
      checkIns: checkIns,
      relationshipDynamic: dynamic,
    });

    const output = await generateStructuredGuidance({
      perspective: "Tony→Drew",
      situation: "Drew brings up something sensitive unexpectedly",
      ctx: ctx,
    });

    setGuidance(output);

    // Log to session history
    await logStructuredGuidance("Tony→Drew", situation, output, ctx);
  };

  return (
    <div>
      {guidance && <StructuredGuidancePanel baseOutput={guidance} perspective="Tony→Drew" />}
    </div>
  );
}
`;

// ── QUICK ACTION PATTERN ──────────────────────────────────────────

const exampleQuickAction = `
import { generateStructuredGuidance, generateQuickAction } from "@/lib/aiCoachStructured";

const handleQuickAction = async () => {
  const baseOutput = await generateStructuredGuidance({...});
  const quick = generateQuickAction(baseOutput);
  
  // Show user immediate guidance
  console.log("Right now:", quick.immediate_action);
  console.log("Say this:", quick.what_to_say);
  console.log("Watch for:", quick.risk_if_not_addressed);
};
`;

// ── ASK AI BUTTON PATTERN ─────────────────────────────────────────

const exampleAskAIButton = `
import AskAIButton from "@/components/ai/AskAIButton";

<div className="flex items-center gap-2">
  <h3>Your Profile</h3>
  <AskAIButton
    page="Profiles"
    sectionTitle="Behavioral Profile"
    scope={activePerson}
    onClick={() => {
      // AskCoachDrawer is already rendered globally on the page
      // Clicking the button will focus it and pre-fill context
    }}
    showText={true}
  />
</div>
`;

// ── INTEGRATION POINTS ────────────────────────────────────────────

export const INTEGRATION_POINTS = [
  {
    page: "Profiles",
    sections: [
      "Overview Summary",
      "Communication Style Card",
      "Conflict Tendencies Card",
      "Emotional Triggers Card",
    ],
    buttonPlacement: "top-right of each card header",
  },
  {
    page: "Insights",
    sections: [
      "Context Insights Summary",
      "Deep Insights Summary",
      "Behavioral Patterns Section",
      "Risk Flags Section",
    ],
    buttonPlacement: "top-right of each section",
  },
  {
    page: "Analysis Engine",
    sections: [
      "Pattern Scores Card (per person)",
      "Misalignments Card",
      "Prediction Card",
    ],
    buttonPlacement: "top-right of card header",
  },
  {
    page: "Smart Tools",
    sections: [
      "Tool Output",
      "Before You React Result",
      "Translation Result",
    ],
    buttonPlacement: "above the output",
  },
  {
    page: "Repair",
    sections: [
      "Repair Suggestion Alert",
      "Repair Output Panel",
    ],
    buttonPlacement: "top-right of panel header",
  },
];

// ── SCHEMA VALIDATION HELPER ──────────────────────────────────────

export function validateStructuredOutput(output) {
  const errors = [];

  // Required fields
  if (!output.situation_summary || typeof output.situation_summary !== "string") {
    errors.push("situation_summary must be a non-empty string");
  }
  if (!output.what_you_are_experiencing || typeof output.what_you_are_experiencing !== "string") {
    errors.push("what_you_are_experiencing must be a non-empty string");
  }
  if (!output.what_they_are_experiencing || typeof output.what_they_are_experiencing !== "string") {
    errors.push("what_they_are_experiencing must be a non-empty string");
  }
  if (!Array.isArray(output.what_is_at_risk) || output.what_is_at_risk.length === 0) {
    errors.push("what_is_at_risk must be a non-empty array");
  }
  if (!Array.isArray(output.what_to_do) || output.what_to_do.length === 0) {
    errors.push("what_to_do must be a non-empty array");
  }
  if (!Array.isArray(output.what_not_to_do) || output.what_not_to_do.length === 0) {
    errors.push("what_not_to_do must be a non-empty array");
  }
  if (!Array.isArray(output.suggested_language) || output.suggested_language.length === 0) {
    errors.push("suggested_language must be a non-empty array");
  }
  if (!["gentle", "neutral", "direct"].includes(output.tone_recommendation)) {
    errors.push("tone_recommendation must be 'gentle', 'neutral', or 'direct'");
  }
  if (!Array.isArray(output.frameworks_used) || output.frameworks_used.length === 0) {
    errors.push("frameworks_used must be a non-empty array");
  }

  // Content validation
  if (output.suggested_language.some((lang) => lang.startsWith("You "))) {
    errors.push("suggested_language items should use 'I' statements, not 'You'");
  }

  return { valid: errors.length === 0, errors };
}

export default examplePageUsage;