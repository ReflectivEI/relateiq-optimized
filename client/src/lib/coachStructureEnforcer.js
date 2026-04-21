/**
 * coachStructureEnforcer.js
 * Ensure every AI Coach output follows required structure
 * Transforms raw AI output into locked structure, then derives display modes
 */

function buildFallbackCoachSections(seedText = "", situationText = "") {
  const cleanedSeed = String(seedText || "").replace(/#+\s*[A-Za-z ?'-]+/g, "").trim();
  const cleanedSituation = String(situationText || "").trim();
  const summary =
    cleanedSituation ||
    cleanedSeed ||
    "A coaching guidance card was saved for this conversation, but the original section text was incomplete.";

  return {
    situation_summary: summary,
    what_is_happening:
      cleanedSeed ||
      "This exchange appears to involve emotional friction, disconnection, or a communication mismatch that needs to be named more clearly.",
    why_it_is_happening:
      "The current dynamic likely reflects a mismatch in pace, tone, or emotional needs, which can make both people feel unseen or defensive.",
    risk_if_unchanged:
      "If this pattern stays unnamed, the same frustration is likely to repeat and become harder to repair over time.",
    recommended_approach:
      "Slow the moment down, name what happened simply, and lead with a calm statement of what you need before trying to solve everything at once.",
    example_language:
      "I want to talk about what just happened in a way that helps us understand each other instead of escalating this further.",
    what_to_avoid:
      "Avoid piling on more examples, pushing for immediate agreement, or assuming intent before the other person has responded.",
    confidence: 0.5,
  };
}

export function enforceCoachStructure(rawOutput, situationText = "") {
  if (typeof rawOutput === "string") {
    const text = rawOutput.replace(/\r/g, "").trim();
    const normalized = text.replace(/\s+##\s+/g, "\n\n## ");
    const headingRegex = /^##\s+(.+?)\s*$/gm;
    const matches = [...normalized.matchAll(headingRegex)];

    if (matches.length > 0) {
      const sections = {};
      for (let index = 0; index < matches.length; index += 1) {
        const current = matches[index];
        const next = matches[index + 1];
        const heading = current[1].trim().toLowerCase();
        const start = current.index + current[0].length;
        const end = next ? next.index : normalized.length;
        const content = normalized.slice(start, end).trim();
        sections[heading] = content;
      }

      const structured = {
        situation_summary: sections["situation"] || sections["situation summary"] || "",
        what_is_happening: sections["what's happening"] || sections["what is happening"] || "",
        why_it_is_happening: sections["why this is happening"] || sections["why it's happening"] || "",
        risk_if_unchanged: sections["risk if unchanged"] || "",
        recommended_approach: sections["recommended approach"] || "",
        example_language: sections["example language"] || "",
        what_to_avoid: sections["what to avoid"] || "",
        confidence: 0.7,
      };

      const hasMeaningfulContent = Object.entries(structured)
        .filter(([key]) => key !== "confidence")
        .some(([, value]) => typeof value === "string" && value.trim().length > 0);

      return hasMeaningfulContent ? structured : buildFallbackCoachSections(text, situationText);
    }

    const paragraphs = text.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
    const structured = {
      situation_summary: paragraphs[0] || "",
      what_is_happening: paragraphs[1] || paragraphs[0] || "",
      why_it_is_happening: paragraphs[2] || paragraphs[1] || "",
      risk_if_unchanged: paragraphs[3] || "",
      recommended_approach: paragraphs[4] || paragraphs[1] || paragraphs[0] || "",
      example_language: paragraphs[5] || paragraphs[4] || "",
      what_to_avoid: paragraphs[6] || "",
      confidence: 0.7,
    };
    const hasMeaningfulContent = Object.entries(structured)
      .filter(([key]) => key !== "confidence")
      .some(([, value]) => typeof value === "string" && value.trim().length > 0);
    return hasMeaningfulContent ? structured : buildFallbackCoachSections(text, situationText);
  }

  // Ensure all required fields exist
  const structured = {
    situation_summary: rawOutput.situation_summary || "",
    what_is_happening: rawOutput.what_is_happening || "",
    why_it_is_happening: rawOutput.why_it_is_happening || "",
    risk_if_unchanged: rawOutput.risk_if_unchanged || "",
    recommended_approach: rawOutput.recommended_approach || "",
    example_language: rawOutput.example_language || "",
    what_to_avoid: rawOutput.what_to_avoid || "",
    confidence: Math.min(1, Math.max(0, rawOutput.confidence || 0.7)),
  };
  const hasMeaningfulContent = Object.entries(structured)
    .filter(([key]) => key !== "confidence")
    .some(([, value]) => typeof value === "string" && value.trim().length > 0);
  return hasMeaningfulContent ? structured : buildFallbackCoachSections("", situationText);
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
