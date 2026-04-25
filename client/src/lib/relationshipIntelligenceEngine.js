/**
 * relationshipIntelligenceEngine.js
 * Deterministic aggregator unifying all system outputs into one continuous intelligence layer
 * Updates on every interaction, no AI — pure rule-based synthesis
 */

export function synthesizeRelationshipIntelligence({
  participants = ["Person A", "Other Person"],
  relationshipTerms = { bond: "relationship", type: "romantic" },
  profiles = [],
  patternScores = {},
  recentCoachSessions = [],
  recentCheckIns = [],
  repairEntries = [],
  triggers = [],
  predictiveOutputs = {},
}) {
  const [primaryPerson = "Person A", secondaryPerson = "Other Person"] = participants;
  const tony = profiles.find((p) => p.person_name === primaryPerson);
  const drew = profiles.find((p) => p.person_name === secondaryPerson);

  if (!tony || !drew) {
    return {
      relationship_state: "initializing",
      primary_dynamic: "Profiles not yet complete",
      top_3_patterns: [],
      top_3_risks: [],
      top_3_strengths: [],
      recent_shifts: [],
      recommended_focus: `Complete both profiles to enable full ${relationshipTerms.bond} intelligence`,
      confidence: 0,
      data_completeness: { profiles: false, patterns: false, sessions: false },
    };
  }

  // ─── STATE DETERMINATION ───────────────────────────────────────────────────────
  // Analyze last 5 check-ins to determine relationship state
  const recentMoods = recentCheckIns.slice(0, 5).map((c) => c.mood);
  const moodScores = {
    great: 5,
    good: 4,
    okay: 3,
    tough: 2,
    difficult: 1,
  };
  const avgMood = recentMoods.length
    ? recentMoods.reduce((sum, m) => sum + (moodScores[m] || 3), 0) / recentMoods.length
    : 3;

  // Count repair attempts vs sessions (higher ratio = strained)
  const repairRate = recentCoachSessions.length
    ? repairEntries.length / recentCoachSessions.length
    : 0;

  let relationshipState = "stable";
  if (avgMood < 2.5) relationshipState = "volatile";
  else if (avgMood < 3 || repairRate > 0.5) relationshipState = "strained";
  else if (avgMood > 4 && repairRate < 0.2) relationshipState = "improving";

  // ─── PATTERN AGGREGATION ──────────────────────────────────────────────────────
  const tonyTraits = patternScores.tony?.traits || {};
  const drewTraits = patternScores.drew?.traits || {};

  // Most active patterns
  const allTraits = { ...tonyTraits, ...drewTraits };
  const sortedTraits = Object.entries(allTraits)
    .sort(([, a], [, b]) => (b || 0) - (a || 0))
    .slice(0, 3)
    .map(([trait]) => trait);

  // ─── RISK DETECTION ───────────────────────────────────────────────────────────
  const detectedRisks = [];

  // Check for repeated unresolved patterns
  const sessionPatterns = recentCoachSessions.map((s) => s.situation).join(" ");
  const repeatedKeywords = ["conflict", "tension", "withdrawal", "misunderstood"];
  repeatedKeywords.forEach((keyword) => {
    const count = (sessionPatterns.match(new RegExp(keyword, "gi")) || []).length;
    if (count > 2) detectedRisks.push(`Repeated "${keyword}" pattern detected`);
  });

  // High-weight triggers that are active
  const activeHighRiskTriggers = triggers
    .filter((t) => t.confidence === "high" && (t.related_context || "").length > 0)
    .slice(0, 2)
    .map((t) => `${t.owner}'s trigger: ${t.title}`);
  detectedRisks.push(...activeHighRiskTriggers);

  // Check for declining mood trend
  if (recentMoods.length >= 3) {
    const trend = recentMoods.slice(0, 3);
    if (trend[0] < trend[1] && trend[1] < trend[2]) {
      detectedRisks.push("Declining mood trend over last 3 weeks");
    }
  }

  const topRisks = detectedRisks.slice(0, 3);

  // ─── STRENGTH DETECTION ───────────────────────────────────────────────────────
  const detectedStrengths = [];

  // Check for successful repairs
  const successfulRepairs = repairEntries.filter(
    (r) => r.outcome_rating === "helped" && r.did_it_reduce_tension
  );
  if (successfulRepairs.length > 0) {
    detectedStrengths.push("Proven ability to repair after conflict");
  }

  // Check for consistent check-in engagement
  if (recentCheckIns.length >= 4) {
    detectedStrengths.push("Consistent weekly check-ins showing commitment");
  }

  // Check for shared strengths from profiles
  const sharedTraits = [];
  ["vulnerability", "reflection", "growth_orientation"].forEach((trait) => {
    if (
      (tony.personality_traits || []).includes(trait) &&
      (drew.personality_traits || []).includes(trait)
    ) {
      sharedTraits.push(trait.replace(/_/g, " "));
    }
  });
  if (sharedTraits.length > 0) {
    detectedStrengths.push(`Shared strength: ${sharedTraits.join(", ")}`);
  }

  const topStrengths = detectedStrengths.slice(0, 3);

  // ─── RECENT SHIFTS ────────────────────────────────────────────────────────────
  const recentShifts = [];

  // Compare last two coach sessions for topic shift
  if (recentCoachSessions.length >= 2) {
    const prev = recentCoachSessions[1].situation;
    const curr = recentCoachSessions[0].situation;
    if (!prev.includes(curr.split(" ")[0])) {
      recentShifts.push(`Topic shift: from "${prev.substring(0, 40)}..." to current concern`);
    }
  }

  // Check for mood improvement
  if (recentCheckIns.length >= 2) {
    const prevMood = moodScores[recentCheckIns[1].mood] || 3;
    const currMood = moodScores[recentCheckIns[0].mood] || 3;
    if (currMood > prevMood) {
      recentShifts.push("Positive mood shift in latest check-in");
    }
  }

  // ─── PRIMARY DYNAMIC ──────────────────────────────────────────────────────────
  const repairSuccess = successfulRepairs.length / (repairEntries.length || 1);
  let primaryDynamic = `Stable ${relationshipTerms.bond} with mutual commitment to growth`;

  if (relationshipState === "volatile") {
    primaryDynamic = "High tension requires immediate de-escalation focus";
  } else if (relationshipState === "strained") {
    if (repairSuccess > 0.5) {
      primaryDynamic =
        "Navigating conflict well — repairs are effective when attempted";
    } else {
      primaryDynamic = "Repair attempts not yet aligned — need better approach";
    }
  } else if (relationshipState === "improving") {
    primaryDynamic = "Positive momentum — building on strengths";
  }

  // ─── RECOMMENDED FOCUS ────────────────────────────────────────────────────────
  let recommendedFocus = "Continue growth trajectory";
  if (topRisks.length > 0) {
    recommendedFocus = `Address: ${topRisks[0]}`;
  }
  if (relationshipState === "volatile") {
    recommendedFocus = "Implement de-escalation protocol";
  }

  // ─── CONFIDENCE ───────────────────────────────────────────────────────────────
  const dataPoints =
    recentCoachSessions.length +
    recentCheckIns.length +
    repairEntries.length +
    triggers.length;
  const confidence = Math.min(0.95, Math.max(0.3, dataPoints / 50)); // scales 0.3-0.95

  return {
    relationship_state: relationshipState,
    primary_dynamic: primaryDynamic,
    top_3_patterns: sortedTraits,
    top_3_risks: topRisks,
    top_3_strengths: topStrengths,
    recent_shifts: recentShifts,
    recommended_focus: recommendedFocus,
    confidence,
    metrics: {
      avg_mood: avgMood,
      repair_success_rate: repairSuccess,
      repair_frequency: repairRate,
      data_points: dataPoints,
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Trend direction for state
 */
export function getStateTrend(currentIntelligence, previousIntelligence) {
  if (!previousIntelligence) return "→";
  const stateRank = {
    volatile: 1,
    strained: 2,
    stable: 3,
    improving: 4,
  };
  const curr = stateRank[currentIntelligence.relationship_state] || 2;
  const prev = stateRank[previousIntelligence.relationship_state] || 2;

  if (curr > prev) return "↑ improving";
  if (curr < prev) return "↓ declining";
  return "→ steady";
}
