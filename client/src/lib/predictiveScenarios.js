/**
 * predictiveScenarios.js
 * ─────────────────────────────────────────────────────────────────
 * Predefined scenario catalog + matching engine.
 * ZERO AI — fully deterministic keyword-based matching.
 *
 * matchScenario(inputText) → { scenario, confidence, triggerWords }
 */

// ── Scenario Catalog ─────────────────────────────────────────────

export const SCENARIOS = [
  {
    id: "unexpected_criticism",
    label: "Unexpected Criticism",
    triggers: ["out of nowhere", "suddenly criticized", "unexpectedly criticized", "attacked", "came out of nowhere", "blindsided", "unexpected feedback", "without warning criticized"],
    category: "conflict",
  },
  {
    id: "withdrawal_during_conflict",
    label: "Withdrawal During Conflict",
    triggers: ["went quiet", "shut down", "stopped responding", "stopped talking", "checked out", "stonewalled", "silent treatment", "withdrawn", "shut off", "disengaged", "not responding"],
    category: "conflict",
  },
  {
    id: "tone_escalation",
    label: "Tone Escalation",
    triggers: ["raised voice", "yelling", "yelled", "tone got sharp", "snapping", "snapped", "got loud", "aggressive tone", "harsh tone", "tone escalated", "voice raised"],
    category: "conflict",
  },
  {
    id: "emotional_shutdown",
    label: "Emotional Shutdown",
    triggers: ["shut down emotionally", "went blank", "emotionally unavailable", "closed off", "numb", "dissociated", "flat", "no response", "checked out emotionally", "walls up"],
    category: "emotional",
  },
  {
    id: "avoidance_after_disagreement",
    label: "Avoidance After Disagreement",
    triggers: ["avoided", "avoiding", "won't talk", "refuses to discuss", "walking away", "walked away", "leaving the room", "left the room", "not engaging", "changing the subject", "deflecting"],
    category: "conflict",
  },
  {
    id: "sensitive_topic_raised",
    label: "Sensitive Topic Raised",
    triggers: ["sensitive", "difficult topic", "hard conversation", "serious talk", "we need to talk", "brought up something", "serious issue", "difficult subject", "touchy subject"],
    category: "communication",
  },
  {
    id: "unexpected_surprise",
    label: "Unexpected / Surprise Confrontation",
    triggers: ["out of nowhere", "unexpectedly", "surprise", "without warning", "suddenly", "random", "didn't expect", "caught off guard", "ambushed"],
    category: "communication",
  },
  {
    id: "feeling_dismissed",
    label: "Feeling Dismissed or Ignored",
    triggers: ["ignored", "dismissed", "not listening", "not heard", "doesn't care", "doesn't get it", "brushed off", "not taking seriously", "not validated", "felt invisible"],
    category: "emotional",
  },
  {
    id: "stress_spillover",
    label: "Stress Spillover into Relationship",
    triggers: ["stressed", "work stress", "overwhelmed", "exhausted", "burned out", "too much", "can't handle", "too stressed", "work is hard", "under pressure", "falling apart"],
    category: "stress",
  },
  {
    id: "affection_bid_rejected",
    label: "Affection Bid Rejected",
    triggers: ["pushed away", "rejected physically", "didn't want to be touched", "pulled away", "rebuffed", "not interested", "not in the mood", "cold", "distant physically"],
    category: "emotional",
  },
  {
    id: "criticism_about_habits",
    label: "Criticism About Habits or Patterns",
    triggers: ["you always", "you never", "criticized my", "keeps criticizing", "pointed out my", "complained about my", "told me i always", "told me i never", "feedback about behavior", "picking on"],
    category: "conflict",
  },
  {
    id: "last_minute_change",
    label: "Last-Minute Plans or Changes",
    triggers: ["last minute", "last-minute", "changed plans", "canceled plans", "cancelled plans", "unexpected change", "plan changed", "schedule changed", "no notice", "no warning about change"],
    category: "stress",
  },
];

// ── Matching Engine ──────────────────────────────────────────────

const MATCH_THRESHOLD = 0.4;

/**
 * Tokenize input text into normalized words.
 */
function tokenize(text) {
  return (text || "").toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter(Boolean);
}

/**
 * Build multi-word n-grams from tokens (up to 4 words).
 */
function ngrams(tokens) {
  const result = [tokens.join(" ")]; // full string
  for (let len = 1; len <= 4; len++) {
    for (let i = 0; i <= tokens.length - len; i++) {
      result.push(tokens.slice(i, i + len).join(" "));
    }
  }
  return result;
}

/**
 * Score a single scenario against the input text.
 * Returns { hits: string[], score: number }
 */
function scoreScenario(scenario, inputTokenGrams) {
  const hits = [];
  for (const trigger of scenario.triggers) {
    const normalizedTrigger = trigger.toLowerCase();
    if (inputTokenGrams.includes(normalizedTrigger)) {
      hits.push(trigger);
    }
  }
  const score = hits.length / scenario.triggers.length;
  return { hits, score };
}

/**
 * Match a free-text input against the scenario catalog.
 *
 * @param {string} inputText
 * @returns {{
 *   scenario: object,       // best matching SCENARIO object
 *   confidence: number,     // 0–1
 *   triggerWords: string[], // which triggers were matched
 *   allMatches: Array       // all scenarios that had any match
 * }}
 */
export function matchScenario(inputText) {
  const tokens = tokenize(inputText);
  const grams  = ngrams(tokens);

  const scored = SCENARIOS.map((scenario) => {
    const { hits, score } = scoreScenario(scenario, grams);
    return { scenario, hits, score };
  }).filter((r) => r.hits.length > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0 || scored[0].score < MATCH_THRESHOLD) {
    // No strong match — return generic
    return {
      scenario: {
        id: "generic_scenario",
        label: "General Interpersonal Situation",
        triggers: [],
        category: "communication",
      },
      confidence: 0.2,
      triggerWords: [],
      allMatches: [],
    };
  }

  const best = scored[0];
  return {
    scenario:     best.scenario,
    confidence:   parseFloat(Math.min(0.95, 0.4 + best.score * 0.6).toFixed(2)),
    triggerWords: best.hits,
    allMatches:   scored.slice(0, 4), // top 4 matches for trace
  };
}