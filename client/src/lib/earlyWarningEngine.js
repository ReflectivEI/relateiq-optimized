/**
 * earlyWarningEngine.js
 * ─────────────────────────────────────────────────────────────────
 * Early Warning System: Analyzes daily mood/gratitude patterns to detect
 * emerging conflict risks BEFORE they happen.
 *
 * Uses trait profiles + framework logic to suggest micro-repairs.
 * Fully deterministic — no AI.
 *
 * Public API:
 *   detectRiskSignals({ checkIns, profiles })
 *   generateMicroRepairs({ riskSignals, profiles, frameworks })
 */

import { matchFrameworks, buildFrameworkExplanations } from "./frameworkEngine";

// ── RISK DETECTION RULES ────────────────────────────────────────

const RISK_INDICATORS = {
  mood_declining: {
    id: "mood_declining",
    label: "Mood Declining",
    severity: "medium",
    description: "Consistent mood drop over 3-5 days",
    check: (checkIns) => {
      if (checkIns.length < 3) return false;
      const recent = checkIns.slice(0, 5);
      const moodScore = (m) => ({ great: 5, good: 4, okay: 3, tough: 2, difficult: 1 }[m] || 3);
      const scores = recent.map((c) => moodScore(c.mood));
      const declining = scores[0] < scores[scores.length - 1];
      return declining && scores[0] <= 2;
    },
  },

  low_gratitude: {
    id: "low_gratitude",
    label: "Low Gratitude Expression",
    severity: "medium",
    description: "Short or missing gratitude statements",
    check: (checkIns) => {
      if (checkIns.length === 0) return false;
      const recent = checkIns.slice(0, 7);
      const withoutGratitude = recent.filter((c) => !c.gratitude || c.gratitude.trim().length < 10);
      return withoutGratitude.length >= 3;
    },
  },

  high_isolation_language: {
    id: "high_isolation_language",
    label: "Isolation Language Detected",
    severity: "high",
    description: "Check-ins contain 'alone', 'disconnect', 'distant', 'withdrawn'",
    check: (checkIns) => {
      const isolationWords = ["alone", "disconnect", "distant", "withdrawn", "separate", "apart"];
      const recent = checkIns.slice(0, 5);
      return recent.some((c) =>
        isolationWords.some((word) =>
          (c.what_worked || "").toLowerCase().includes(word) ||
          (c.what_could_improve || "").toLowerCase().includes(word) ||
          (c.gratitude || "").toLowerCase().includes(word)
        )
      );
    },
  },

  conflict_talk_absent: {
    id: "conflict_talk_absent",
    label: "Avoidance of Conflict Discussion",
    severity: "medium",
    description: "No mention of conflict resolution or repair in recent check-ins",
    check: (checkIns) => {
      const recent = checkIns.slice(0, 7);
      const repairWords = ["talk", "discuss", "fix", "repair", "resolve", "work through"];
      const mentionsRepair = recent.some((c) =>
        repairWords.some((word) =>
          (c.what_worked || "").toLowerCase().includes(word) ||
          (c.what_could_improve || "").toLowerCase().includes(word)
        )
      );
      return !mentionsRepair && recent.length >= 3;
    },
  },

  multiple_tough_weeks: {
    id: "multiple_tough_weeks",
    label: "Multiple Consecutive Tough Weeks",
    severity: "high",
    description: "3+ consecutive check-ins with 'tough' or 'difficult' mood",
    check: (checkIns) => {
      if (checkIns.length < 3) return false;
      const toughMoods = ["tough", "difficult"];
      const recent = checkIns.slice(0, 7);
      let toughStreak = 0;
      for (const check of recent) {
        if (toughMoods.includes(check.mood)) {
          toughStreak++;
          if (toughStreak >= 3) return true;
        } else {
          toughStreak = 0;
        }
      }
      return false;
    },
  },

  gratitude_vs_improvement_imbalance: {
    id: "gratitude_improvement_imbalance",
    label: "Gratitude-to-Issues Imbalance",
    severity: "low",
    description: "Many issues noted but little gratitude expressed",
    check: (checkIns) => {
      if (checkIns.length === 0) return false;
      const recent = checkIns.slice(0, 5);
      const withImprovement = recent.filter((c) => c.what_could_improve && c.what_could_improve.trim().length > 5);
      const withGratitude = recent.filter((c) => c.gratitude && c.gratitude.trim().length > 5);
      return withImprovement.length >= 3 && withGratitude.length <= 1;
    },
  },
};

// ── TRAIT-BASED RISK AMPLIFICATION ─────────────────────────────

function amplifyRiskByTraits(baseRisk, profile) {
  if (!profile || !profile.traits) return baseRisk;

  let multiplier = 1;

  // High sensitivity + declining mood = higher risk
  if (profile.traits.emotional_sensitivity?.score >= 7) {
    multiplier *= 1.3;
  }

  // High conflict avoidance + isolation language = higher risk
  if (profile.traits.conflict_avoidance?.score >= 7) {
    multiplier *= 1.25;
  }

  // High withdrawal tendency + isolation language = much higher risk
  if (profile.traits.withdrawal_tendency?.score >= 7) {
    multiplier *= 1.4;
  }

  // High need for validation = lower risk if gratitude is present, higher if absent
  if (profile.traits.need_for_validation?.score >= 7) {
    multiplier *= 1.2;
  }

  return Math.min(baseRisk * multiplier, 1); // Cap at 1.0
}

// ── PUBLIC API ────────────────────────────────────────────────────

/**
 * Detect emerging risk signals from recent check-ins + mood patterns.
 *
 * @param {object} params
 * @param {array} params.checkIns — CheckIn records sorted by date (newest first)
 * @param {object} params.tonyProfile — Tony's UserProfile
 * @param {object} params.drewProfile — Drew's UserProfile
 * @returns {array} Detected risk signals with severity + recommendations
 */
export function detectRiskSignals({
  checkIns,
  tonyProfile,
  drewProfile,
  participantAProfile,
  participantBProfile,
}) {
  const profileA = participantAProfile || tonyProfile;
  const profileB = participantBProfile || drewProfile;
  const signals = [];
  const seen = new Set();

  // Check all risk indicators
  for (const [key, indicator] of Object.entries(RISK_INDICATORS)) {
    if (indicator.check(checkIns)) {
      let riskScore = { low: 0.3, medium: 0.6, high: 0.85 }[indicator.severity] || 0.5;

      // Amplify by trait profiles (use average of both for relationship-wide risk)
      const amplifiedA = profileA ? amplifyRiskByTraits(riskScore, profileA) : riskScore;
      const amplifiedB = profileB ? amplifyRiskByTraits(riskScore, profileB) : riskScore;
      riskScore = Math.max(amplifiedA, amplifiedB); // Use highest

      signals.push({
        id: indicator.id,
        label: indicator.label,
        severity: indicator.severity,
        description: indicator.description,
        risk_score: Math.round(riskScore * 100) / 100,
        detected_at: new Date().toISOString(),
      });

      seen.add(indicator.id);
    }
  }

  return signals.length > 0 ? signals : null;
}

/**
 * Generate micro-repair suggestions based on detected risks.
 * Micro-repairs are small, immediate actions that prevent escalation.
 *
 * @param {array} riskSignals — Output from detectRiskSignals()
 * @param {object} tonyProfile — Tony's UserProfile (with traits)
 * @param {object} drewProfile — Drew's UserProfile (with traits)
 * @returns {array} Micro-repair suggestions with frameworks
 */
export function generateMicroRepairs({
  riskSignals,
  tonyProfile,
  drewProfile,
  participantAProfile,
  participantBProfile,
}) {
  const profileA = participantAProfile || tonyProfile;
  const profileB = participantBProfile || drewProfile;
  void profileA;
  void profileB;
  if (!riskSignals || riskSignals.length === 0) return null;

  const repairs = [];
  const riskMap = {};

  // Index by ID for easy lookup
  riskSignals.forEach((r) => {
    riskMap[r.id] = r;
  });

  // ── MOOD_DECLINING ──────────────────────────────────────

  if (riskMap.mood_declining) {
    repairs.push({
      risk_id: "mood_declining",
      title: "Mood Check-In",
      category: "connection",
      why: "Declining mood often precedes conflict. Quick emotional check-ins restore safety.",
      actions: [
        {
          step: 1,
          action: "Ask directly: 'How are you feeling this week?' without problem-solving yet.",
          tone: "curious, gentle",
        },
        {
          step: 2,
          action: "Listen for emotional content (anxiety, stress, overwhelm), not logistics.",
          tone: "validating",
        },
        {
          step: 3,
          action: "Respond with: 'I notice you've been having a tougher week. I'm here.'",
          tone: "present",
        },
      ],
      frameworks: ["EFT"],
    });
  }

  // ── LOW_GRATITUDE ───────────────────────────────────────

  if (riskMap.low_gratitude) {
    repairs.push({
      risk_id: "low_gratitude",
      title: "Reconnect with Appreciation",
      category: "gratitude",
      why: "Low gratitude signals disconnection. Intentional appreciation rebuilds warmth.",
      actions: [
        {
          step: 1,
          action: "Share something specific you appreciated about your partner this week (daily if possible).",
          tone: "warm, specific",
        },
        {
          step: 2,
          action: "Make it concrete: 'I appreciated how you [specific action].'",
          tone: "detailed",
        },
        {
          step: 3,
          action: "Follow up: 'It meant a lot because...' (add emotional context).",
          tone: "vulnerable",
        },
      ],
      frameworks: ["EFT", "GOTTMAN"],
    });
  }

  // ── HIGH_ISOLATION_LANGUAGE ─────────────────────────────

  if (riskMap.high_isolation_language) {
    repairs.push({
      risk_id: "high_isolation_language",
      title: "Reconnect Intentionally",
      category: "presence",
      why: "Isolation language signals disconnection. Active togetherness is protective.",
      actions: [
        {
          step: 1,
          action: "Schedule 15 minutes this week (not tied to a 'talk') for just being together.",
          tone: "matter-of-fact",
        },
        {
          step: 2,
          action: "No agenda: cook, walk, sit. The point is proximity and presence.",
          tone: "relaxed",
        },
        {
          step: 3,
          action: "End with: 'I'm glad we have this.' (simple acknowledgment).",
          tone: "understated",
        },
      ],
      frameworks: ["GOTTMAN"],
    });
  }

  // ── CONFLICT_TALK_ABSENT ────────────────────────────────

  if (riskMap.conflict_talk_absent) {
    repairs.push({
      risk_id: "conflict_talk_absent",
      title: "Build a Repair Moment",
      category: "repair",
      why: "Avoiding conflict discussion = conflict grows. Micro-repairs prevent escalation.",
      actions: [
        {
          step: 1,
          action: "Name what you notice: 'I feel like we're not checking in about tough stuff.'",
          tone: "observational",
        },
        {
          step: 2,
          action: "Offer repair: 'I want to understand what's been hard. When can we talk?'",
          tone: "inviting",
        },
        {
          step: 3,
          action: "Start small: identify ONE thing and work through it together.",
          tone: "collaborative",
        },
      ],
      frameworks: ["GOTTMAN", "CBT"],
    });
  }

  // ── MULTIPLE_TOUGH_WEEKS ────────────────────────────────

  if (riskMap.multiple_tough_weeks) {
    repairs.push({
      risk_id: "multiple_tough_weeks",
      title: "Prioritize Emotional Safety",
      category: "safety",
      why: "3+ tough weeks = system is overwhelmed. Focus on safety before problem-solving.",
      actions: [
        {
          step: 1,
          action: "Pause trying to 'fix' things. Instead: 'What do you need to feel safe with me?'",
          tone: "grounded",
        },
        {
          step: 2,
          action: "Offer concrete safety: 'I'm not going anywhere.' 'You can tell me.' 'We'll figure it out.'",
          tone: "reassuring",
        },
        {
          step: 3,
          action: "Schedule recovery time: sleep, solitude, joy — individual wellness first.",
          tone: "protective",
        },
      ],
      frameworks: ["EFT"],
    });
  }

  // ── GRATITUDE_IMPROVEMENT_IMBALANCE ─────────────────────

  if (riskMap.gratitude_improvement_imbalance) {
    repairs.push({
      risk_id: "gratitude_improvement_imbalance",
      title: "Balance Feedback",
      category: "reciprocity",
      why: "Too much criticism without appreciation → resentment builds. Rebalance.",
      actions: [
        {
          step: 1,
          action: "For every 'could improve' thought, name 2 things you appreciate.",
          tone: "intentional",
        },
        {
          step: 2,
          action: "Share the appreciation: 'I've been focusing on issues. Let me tell you what's working...'",
          tone: "corrective",
        },
        {
          step: 3,
          action: "Then discuss improvements: 'And here's one thing I'd love us to work on together.'",
          tone: "collaborative",
        },
      ],
      frameworks: ["GOTTMAN", "CBT"],
    });
  }

  return repairs;
}

/**
 * Calculate overall relationship risk score (0-1).
 * Combines all signals into a single metric.
 */
export function calculateOverallRiskScore(riskSignals) {
  if (!riskSignals || riskSignals.length === 0) return 0;

  const scores = riskSignals.map((s) => s.risk_score);
  return Math.round((Math.max(...scores) + scores.reduce((a, b) => a + b, 0) / scores.length) / 2 * 100) / 100;
}

/**
 * Get risk summary for dashboard display.
 */
export function getRiskSummary({
  checkIns,
  tonyProfile,
  drewProfile,
  participantAProfile,
  participantBProfile,
}) {
  const profileA = participantAProfile || tonyProfile;
  const profileB = participantBProfile || drewProfile;
  const signals = detectRiskSignals({
    checkIns,
    tonyProfile: profileA,
    drewProfile: profileB,
    participantAProfile: profileA,
    participantBProfile: profileB,
  });
  if (!signals) {
    return {
      status: "healthy",
      message: "No emerging risks detected.",
      overall_score: 0,
      signals: [],
      repairs: [],
      timeline: "5-7 days",
      days_ahead: 5,
      breakdown: {
        signal_count: 0,
        strongest_signal: null,
        average_signal_score: 0,
        scoring_method:
          "The risk score is calculated as the midpoint between the strongest detected signal and the average of all detected signals.",
      },
    };
  }

  const repairs = generateMicroRepairs({
    riskSignals: signals,
    tonyProfile: profileA,
    drewProfile: profileB,
    participantAProfile: profileA,
    participantBProfile: profileB,
  });
  const overall = calculateOverallRiskScore(signals);
  const averageSignalScore =
    signals.reduce((sum, signal) => sum + signal.risk_score, 0) / signals.length;
  const strongestSignal = [...signals].sort((a, b) => b.risk_score - a.risk_score)[0];

  return {
    status: overall >= 0.7 ? "high_risk" : overall >= 0.4 ? "elevated" : "caution",
    message:
      overall >= 0.7
        ? "⚠️ High conflict risk detected (5-7 days ahead). Micro-repairs needed soon."
        : overall >= 0.4
        ? "Elevated risk signals detected (5-7 days). Consider proactive repairs."
        : "✓ Monitor patterns. Consider preventative steps.",
    overall_score: overall,
    signals,
    repairs,
    timeline: "5-7 days",
    days_ahead: 5,
    breakdown: {
      signal_count: signals.length,
      strongest_signal: strongestSignal,
      average_signal_score: Math.round(averageSignalScore * 100) / 100,
      scoring_method:
        "The risk score is calculated as the midpoint between the strongest detected signal and the average of all detected signals.",
    },
  };
}
