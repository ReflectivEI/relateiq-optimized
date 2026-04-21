/**
 * coachStructureEnforcer.js
 * Ensure every AI Coach output follows required structure
 * Transforms raw AI output into locked structure, then derives display modes
 */

export function enforceCoachStructure(rawOutput) {
  // Ensure all required fields exist
  return {
    situation_summary: rawOutput.situation_summary || "",
    what_is_happening: rawOutput.what_is_happening || "",
    why_it_is_happening: rawOutput.why_it_is_happening || "",
    risk_if_unchanged: rawOutput.risk_if_unchanged || "",
    recommended_approach: rawOutput.recommended_approach || "",
    example_language: rawOutput.example_language || "",
    what_to_avoid: rawOutput.what_to_avoid || "",
    confidence: Math.min(1, Math.max(0, rawOutput.confidence || 0.7)),
  };
}

/**
 * Transform structured output into display modes
 * NO AI calls — pure deterministic transforms
 */
export function deriveCoachModes(structuredOutput) {
  const {
    situation_summary,
    what_is_happening,
    why_it_is_happening,
    recommended_approach,
    example_language,
    what_to_avoid,
  } = structuredOutput;

  return {
    full: `
## Situation
${situation_summary}

## What's Happening
${what_is_happening}

## Why This Is Happening
${why_it_is_happening}

## Recommended Approach
${recommended_approach}

## Example Language
${example_language}

## What to Avoid
${what_to_avoid}
    `.trim(),

    explain: `
## The Core Issue
${what_is_happening}

## Why It Matters
${why_it_is_happening}

## How to Move Forward
${recommended_approach}
    `.trim(),

    "60second": `
**What's happening:** ${what_is_happening.split("\n")[0]}

**Why:** ${why_it_is_happening.split("\n")[0]}

**What to do:** ${recommended_approach.split("\n")[0]}

**Key phrase:** "${example_language.split("\n")[0]}"
    `.trim(),

    action: `
**Step 1:** ${recommended_approach.split("\n")[0]}

**Step 2:** ${recommended_approach.split("\n")[1] || recommended_approach.split("\n")[0]}

**Say this:** ${example_language.split("\n")[0]}

**Avoid this:** ${what_to_avoid.split("\n")[0]}
    `.trim(),

    script: `
## Opening
${example_language.split("\n")[0]}

## If they respond defensively:
${example_language.split("\n")[1] || example_language.split("\n")[0]}

## Key principle:
${recommended_approach.split("\n")[0]}
    `.trim(),
  };
}