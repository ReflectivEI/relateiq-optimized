/**
 * toolTriggerEngine.js
 * Auto-suggest Smart Tools based on detected patterns and emotional state
 * Deterministic rules only — no AI
 */

export function suggestSmartTools({
  lastSession = null,
  activeTriggers = [],
  recentCheckIns = [],
  patternScores = {},
  speaker = "Tony",
}) {
  const suggestions = [];

  if (!lastSession) return suggestions;

  const situation = (lastSession.situation || "").toLowerCase();

  // ─── RULE 1: High Sensitivity + Conflict ────────────────────────────────────
  const emotionalWords = [
    "conflict",
    "fight",
    "angry",
    "upset",
    "frustrated",
    "overwhelmed",
  ];
  const hasConflict = emotionalWords.some((word) => situation.includes(word));
  const speakerTraits = patternScores[speaker.toLowerCase()]?.traits || {};
  const highSensitivity = (speakerTraits.emotional_reactivity || 0) > 0.6;

  if (hasConflict && highSensitivity) {
    suggestions.push({
      tool: "Before You React",
      reason: "High emotional sensitivity detected + conflict context",
      priority: "high",
    });
  }

  // ─── RULE 2: Withdrawal Pattern ───────────────────────────────────────────────
  const withdrawalWords = [
    "withdraw",
    "distant",
    "quiet",
    "shutdown",
    "closed off",
    "silent",
  ];
  const hasWithdrawal = withdrawalWords.some((word) => situation.includes(word));
  const withdrawalTriggers = activeTriggers.filter((t) =>
    t.common_reaction?.includes("withdraw")
  );

  if (hasWithdrawal || withdrawalTriggers.length > 0) {
    suggestions.push({
      tool: "Proactive Repair",
      reason: "Withdrawal pattern detected — needs reconnection",
      priority: "high",
    });
  }

  // ─── RULE 3: Miscommunication / Misunderstanding ──────────────────────────────
  const miscWords = [
    "misunderstand",
    "didn't mean",
    "you thought",
    "i said",
    "what i meant",
    "translation",
  ];
  const hasMisc = miscWords.some((word) => situation.includes(word));
  const repeatedMiscomm = recentCheckIns
    .filter((c) => (c.what_could_improve || "").includes("communication"))
    .slice(0, 2).length >= 2;

  if (hasMisc || repeatedMiscomm) {
    suggestions.push({
      tool: "Translate Meaning",
      reason: "Communication clarity needed — decoding meaning",
      priority: "medium",
    });
  }

  // ─── RULE 4: Trigger Activation ────────────────────────────────────────────────
  const activatedTriggers = activeTriggers.filter(
    (t) => t.owner === speaker && (t.related_context || "").length > 0
  );

  if (activatedTriggers.length > 0) {
    suggestions.push({
      tool: "Trigger Check",
      reason: `Your trigger activated: "${activatedTriggers[0].title}"`,
      priority: "high",
    });
  }

  // ─── RULE 5: Replay / Retrospective ────────────────────────────────────────────
  const recentNegativeMood = recentCheckIns
    .filter((c) => ["tough", "difficult"].includes(c.mood))
    .slice(0, 1).length > 0;

  if (recentNegativeMood && suggestions.length === 0) {
    suggestions.push({
      tool: "Conversation Replay",
      reason: "Recent tough mood — let's analyze what happened",
      priority: "medium",
    });
  }

  return suggestions.sort((a, b) => {
    const priorityRank = { high: 1, medium: 2, low: 3 };
    return priorityRank[a.priority] - priorityRank[b.priority];
  });
}