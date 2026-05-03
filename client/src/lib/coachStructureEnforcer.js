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
    risk_if_unchanged,
    recommended_approach,
    example_language,
    what_to_avoid,
  } = structuredOutput;

  const nonEmptyLines = (value = "") =>
    String(value)
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

  const sentenceParts = (value = "") =>
    String(value)
      .split(/(?<=[.!?])\s+/)
      .map((part) => part.trim())
      .filter(Boolean);

  const firstSentence = (value = "", fallback = "") => sentenceParts(value)[0] || fallback;
  const safeQuote = (value = "") => String(value).replace(/^"|"$/g, "").trim();

  const approachSteps = nonEmptyLines(recommended_approach);
  const avoidSteps = nonEmptyLines(what_to_avoid);
  const languageLines = nonEmptyLines(example_language).map(safeQuote);

  const step1 = approachSteps[0] || firstSentence(recommended_approach, "Name what happened calmly before trying to solve it.");
  const step2 = approachSteps[1] || "Validate one emotion before asking for agreement.";
  const step3 = approachSteps[2] || "Make one specific request for what happens next.";

  const scriptOpen = languageLines[0] || "I want us to understand what just happened so we can reconnect.";
  const scriptDefensive =
    languageLines[1] ||
    "I hear you. I am not trying to attack you, I am trying to explain what landed hard for me.";
  const scriptRequest =
    languageLines[2] ||
    "Can we agree on one small change for next time so this feels safer for both of us?";

  const riskLine = firstSentence(
    risk_if_unchanged,
    "If this stays unaddressed, the same cycle is likely to repeat with more intensity."
  );
  const avoidLine =
    avoidSteps[0] ||
    firstSentence(
      what_to_avoid,
      "Avoid blame stacking, mind-reading intent, or demanding immediate agreement."
    );

  return {
    full: `
## Situation
${situation_summary}

## What's Happening
${what_is_happening}

## Why This Is Happening
${why_it_is_happening}

## Risk If Unchanged
${risk_if_unchanged}

## Recommended Approach
${recommended_approach}

## Example Language
${example_language}

## What to Avoid
${what_to_avoid}
    `.trim(),

    explain: `
## The Core Issue
${firstSentence(what_is_happening, "There is emotional friction that is not being named clearly enough.")}

## Evidence In This Pattern
${firstSentence(situation_summary, "A repeatable pattern is showing up in how this conversation landed.")}

## Why This Is Likely Happening
${firstSentence(why_it_is_happening, "A mismatch in pace, tone, or emotional need is driving disconnection.")}

## Predicted Risk If Nothing Changes
${riskLine}

## Practical Shift To Make
${step1}
    `.trim(),

    "60second": `
**Snapshot:** ${firstSentence(situation_summary, firstSentence(what_is_happening, "A tense moment needs a calmer reset."))}

**Primary driver:** ${firstSentence(why_it_is_happening, "A mismatch in tone and emotional pacing is escalating tension.")}

**Main risk:** ${riskLine}

**First move (now):** ${step1}

**Second move (next):** ${step2}

**Say this:** "${scriptOpen}"

**Do not do this:** ${avoidLine}
    `.trim(),

    action: `
**Step 1: Regulate before contact**
${step1}

**Step 2: Name impact, not blame**
${step2}

**Step 3: Make one concrete request**
${step3}

**Step 4: Confirm understanding**
Ask them to reflect back what they heard before discussing solutions.

**Step 5: Close the loop**
Set one follow-up checkpoint to prevent this pattern from repeating.

**Say this opener:** "${scriptOpen}"

**Avoid this trap:** ${avoidLine}
    `.trim(),

    script: `
## Opening
"${scriptOpen}"

## If they respond defensively:
"${scriptDefensive}"

## If they go quiet:
"I am okay slowing down. I still want to finish this conversation with clarity, not distance."

## If they engage well:
"Thank you for staying in this with me. Can we agree on one next step?"

## Clear request:
"${scriptRequest}"

## Key principle:
${step1}
    `.trim(),
  };
}
