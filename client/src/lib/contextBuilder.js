/**
 * contextBuilder.js
 * ─────────────────────────────────────────────────────────────────
 * Unified context builder for all Ask AI requests.
 * Extracts patterns, traits, risks, and scenario from current page state.
 *
 * Public API:
 *   buildContext({
 *     section,
 *     perspective,
 *     currentAnalysis,
 *     patternScores,
 *     predictiveOutput,
 *     selectedInsight,
 *     profiles,
 *     checkIns,
 *     triggers,
 *     sessions
 *   })
 */

/**
 * Build structured context for Ask AI requests.
 * Extracts all relevant data from current page to prevent generic responses.
 *
 * @param {object} params
 * @param {string} params.section — Current section (Profiles, Analysis, Insights, etc.)
 * @param {string} params.perspective — Tony/Drew/Tony→Drew/Drew→Tony
 * @param {object} params.currentAnalysis — Current analysis output (if applicable)
 * @param {object} params.patternScores — Pattern scores for both partners (if applicable)
 * @param {object} params.predictiveOutput — Predictive engine output (if applicable)
 * @param {object} params.selectedInsight — Selected insight from library (if applicable)
 * @param {object} params.riskSummary — Risk summary from Early Warning System (if applicable)
 * @param {array} params.profiles — UserProfile objects for both partners
 * @param {array} params.checkIns — Recent CheckIn records
 * @param {array} params.triggers — TriggerEntry records
 * @param {array} params.sessions — CoachSession records
 * @returns {object} Structured context object
 */
export function buildContext({
  section = "General",
  perspective = "Tony+Drew",
  currentAnalysis = null,
  patternScores = null,
  predictiveOutput = null,
  selectedInsight = null,
  riskSummary = null,
  profiles = [],
  checkIns = [],
  triggers = [],
  sessions = [],
}) {
  // Extract active perspective
  const isDirectional = perspective.includes("→");
  const [actor, target] = isDirectional ? perspective.split("→").map((s) => s.trim()) : [perspective, perspective];

  // Get profiles
  const actorProfile = profiles.find((p) => p.person_name === actor);
  const targetProfile = profiles.find((p) => p.person_name === target);

  // Extract patterns from current analysis
  const patterns = extractPatterns({
    analysis: currentAnalysis,
    insight: selectedInsight,
    scores: patternScores,
    checkIns,
  });

  // Extract trait scores
  const traits = extractTraits({
    actorProfile,
    targetProfile,
    scores: patternScores,
  });

  // Extract active risks (combine from analysis, insight, predictive, triggers, AND early warning)
  const activeRisks = extractRisks({
    analysis: currentAnalysis,
    insight: selectedInsight,
    predictive: predictiveOutput,
    triggers,
    earlyWarning: riskSummary,
  });

  // Extract recent session insights
  const recentInsights = extractRecentInsights({
    sessions,
    checkIns,
    selectedInsight,
  });

  // Build scenario summary
  const scenario = buildScenarioSummary({
    section,
    perspective,
    analysis: currentAnalysis,
    predictive: predictiveOutput,
  });

  return {
    section,
    perspective,
    actor,
    target,
    isDirectional,
    patterns: patterns.slice(0, 10), // Top 10 patterns
    traits: traits.slice(0, 8), // Top 8 traits
    active_risks: activeRisks,
    recent_insights: recentInsights,
    scenario,
    base_data: {
      actor_profile: actorProfile ? {
        name: actorProfile.person_name,
        communication_style: actorProfile.communication_style,
        conflict_tendencies: actorProfile.conflict_tendencies,
        needs: actorProfile.needs_during_conflict,
      } : null,
      target_profile: targetProfile ? {
        name: targetProfile.person_name,
        communication_style: targetProfile.communication_style,
        conflict_tendencies: targetProfile.conflict_tendencies,
        needs: targetProfile.needs_during_conflict,
      } : null,
      recent_checkins: checkIns.slice(0, 3).map((c) => ({
        person: c.person_name,
        mood: c.mood,
        what_worked: c.what_worked?.slice(0, 60),
        what_could_improve: c.what_could_improve?.slice(0, 60),
      })),
    },
    metadata: {
      built_at: new Date().toISOString(),
      data_sources: [
        profiles.length > 0 ? "profiles" : null,
        checkIns.length > 0 ? "checkins" : null,
        triggers.length > 0 ? "triggers" : null,
        sessions.length > 0 ? "sessions" : null,
        currentAnalysis ? "analysis" : null,
        patternScores ? "patterns" : null,
        predictiveOutput ? "predictive" : null,
      ].filter(Boolean),
    },
  };
}

// ── HELPER FUNCTIONS ──────────────────────────────────────────────

function extractPatterns({ analysis, insight, scores, checkIns }) {
  const patterns = [];

  // From analysis
  if (analysis?.behavioral_patterns) {
    patterns.push(...analysis.behavioral_patterns.map((p) => ({ type: "behavioral", value: p })));
  }

  // From insight
  if (insight?.behavioral_patterns) {
    patterns.push(...insight.behavioral_patterns.map((p) => ({ type: "behavioral", value: p })));
  }

  // From pattern scores (high-scoring traits)
  if (scores?.traits) {
    Object.entries(scores.traits).forEach(([trait, data]) => {
      if (data.score >= 6) {
        patterns.push({ type: "trait", value: `${trait} (${data.score}/10)` });
      }
    });
  }

  // From check-ins (linguistic patterns)
  if (checkIns.length > 0) {
    const recentChecks = checkIns.slice(0, 3);
    const commonThemes = {};
    recentChecks.forEach((c) => {
      [c.what_worked, c.what_could_improve].forEach((text) => {
        if (text) {
          const words = text.toLowerCase().split(/\s+/);
          words.forEach((w) => {
            if (w.length > 4) commonThemes[w] = (commonThemes[w] || 0) + 1;
          });
        }
      });
    });
    Object.entries(commonThemes)
      .filter(([, count]) => count >= 2)
      .forEach(([word]) => {
        patterns.push({ type: "linguistic", value: word });
      });
  }

  return patterns;
}

function extractTraits({ actorProfile, targetProfile, scores }) {
  const traits = [];

  // From pattern scores
  if (scores?.traits) {
    Object.entries(scores.traits).forEach(([name, data]) => {
      traits.push({
        trait: name,
        score: data.score,
        label: name.replace(/_/g, " "),
      });
    });
  }

  // From profiles (fallback)
  if (actorProfile?.personality_traits) {
    actorProfile.personality_traits.slice(0, 3).forEach((t) => {
      traits.push({ trait: t, label: t, source: "actor_profile" });
    });
  }

  if (targetProfile?.personality_traits) {
    targetProfile.personality_traits.slice(0, 3).forEach((t) => {
      traits.push({ trait: t, label: t, source: "target_profile" });
    });
  }

  return traits;
}

function extractRisks({ analysis, insight, predictive, triggers, earlyWarning }) {
  const risks = [];

  // From early warning (highest priority — predictive)
  if (earlyWarning?.signals?.length > 0) {
    earlyWarning.signals.slice(0, 3).forEach((s) => {
      risks.push({
        type: "early_warning",
        value: s.label,
        severity: s.severity,
        prediction_window: earlyWarning.timeline,
      });
    });
  }

  // From analysis
  if (analysis?.risk_flags) {
    risks.push(...analysis.risk_flags.map((r) => ({ type: "analysis", value: r, severity: "medium" })));
  }

  // From insight
  if (insight?.risk_flags) {
    risks.push(...insight.risk_flags.map((r) => ({ type: "insight", value: r, severity: "medium" })));
  }

  // From predictive
  if (predictive?.risk_level) {
    risks.push({
      type: "predictive",
      value: predictive.risk_level,
      severity: predictive.risk_level,
    });
  }

  // From triggers (unresolved triggers)
  if (triggers?.length > 0) {
    triggers.slice(0, 2).forEach((t) => {
      risks.push({
        type: "trigger",
        value: t.title,
        severity: t.confidence === "high" ? "high" : "medium",
      });
    });
  }

  return risks.slice(0, 5); // Top 5 risks
}

function extractRecentInsights({ sessions, checkIns, selectedInsight }) {
  const insights = [];

  // From selected insight (if any)
  if (selectedInsight) {
    insights.push({
      type: "selected",
      insight: selectedInsight.core_insight,
      frameworks: selectedInsight.frameworks_used,
    });
  }

  // From recent sessions
  if (sessions && sessions.length > 0) {
    sessions.slice(0, 2).forEach((s) => {
      insights.push({
        type: "session",
        situation: s.situation?.slice(0, 80),
        strategy: s.strategy?.slice(0, 80),
      });
    });
  }

  // From check-ins (mood trend)
  if (checkIns && checkIns.length >= 3) {
    const moodTrend = checkIns.slice(0, 3).map((c) => c.mood);
    insights.push({
      type: "mood_trend",
      trend: moodTrend,
    });
  }

  return insights;
}

function buildScenarioSummary({ section, perspective, analysis, predictive }) {
  let scenario = null;

  // From predictive
  if (predictive?.scenario_label) {
    scenario = predictive.scenario_label;
  }

  // From analysis
  if (analysis?.scenario) {
    scenario = analysis.scenario;
  }

  // Build context summary
  if (scenario) {
    return `${section} analysis for ${perspective}: ${scenario}`;
  }

  return `${section} analysis for ${perspective}`;
}

/**
 * Build a compact context summary for display in Ask AI modal.
 * Shows what data this Ask AI is based on.
 */
export function buildContextSummary(context) {
  const parts = [];

  if (context.patterns.length > 0) {
    parts.push(`Patterns: ${context.patterns.slice(0, 2).map((p) => p.value || p).join(", ")}`);
  }

  if (context.traits.length > 0) {
    parts.push(`Traits: ${context.traits.slice(0, 2).map((t) => t.label || t.trait).join(", ")}`);
  }

  if (context.active_risks.length > 0) {
    parts.push(`Risks: ${context.active_risks.slice(0, 2).map((r) => r.value).join(", ")}`);
  }

  if (context.scenario) {
    parts.push(`Scenario: ${context.scenario.slice(0, 60)}...`);
  }

  return parts.join(" · ");
}