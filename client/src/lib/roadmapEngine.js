/**
 * roadmapEngine.js — Generate personalized relationship growth roadmap
 * Uses pattern profiles, personality traits, and detected misalignments
 * Outputs a 6-month thematic milestone plan tailored to the couple
 */

export function generateRoadmap({
  tonyPatterns,
  drewPatterns,
  tonyProfile,
  drewProfile,
  checkIns = [],
  sessions = [],
  misalignments = [],
}) {
  if (!tonyPatterns || !drewPatterns) return null;

  const tonyTraits = tonyPatterns.traits || {};
  const drewTraits = drewPatterns.traits || {};

  // Determine primary challenges & strengths
  const challenges = detectChallenges(tonyTraits, drewTraits, misalignments);
  const strengths = detectStrengths(tonyTraits, drewTraits);
  const recentMood = analyzeRecentMood(checkIns);

  // Generate 6 sequential milestones
  const milestones = [];

  // Month 1: Foundation & Awareness
  milestones.push({
    month: 1,
    title: "Foundation: Know Each Other Deeply",
    theme: "Self-Awareness & Empathy",
    icon: "🔍",
    description: "Establish baseline understanding of each other's communication styles, triggers, and needs.",
    goals: [
      `${tonyProfile?.person_name || "Tony"}: Map your emotional triggers and what helps you regulate.`,
      `${drewProfile?.person_name || "Drew"}: Understand how ${tonyProfile?.person_name || "Tony"} experiences your presence.`,
      "Weekly: 20-min deep listening sessions without problem-solving.",
    ],
    focus: "Empathy & Understanding",
    difficulty: "easy",
  });

  // Month 2: Repair Skills (if conflict avoidance detected)
  if (challenges.includes("conflict_avoidance")) {
    milestones.push({
      month: 2,
      title: "Conflict Repair Month",
      theme: "Healthy Disagreement",
      icon: "🔧",
      description: "Learn Gottman's repair techniques and practice addressing small tensions before they escalate.",
      goals: [
        "Practice 3 repair bids from the Gottman method.",
        "Have one intentional difficult conversation using the 'bridge and acknowledge' technique.",
        "Journal: What happened, how you repaired, how it felt.",
      ],
      focus: "Repair & Vulnerability",
      difficulty: "medium",
    });
  } else {
    milestones.push({
      month: 2,
      title: "Deepen Communication",
      theme: "Active Listening",
      icon: "💬",
      description: "Move beyond surface-level conversations into emotional intimacy.",
      goals: [
        "Practice the '4 Stages of Listening' framework.",
        "Share one vulnerable truth per week.",
        "Notice and name each other's emotions without judgment.",
      ],
      focus: "Emotional Intimacy",
      difficulty: "medium",
    });
  }

  // Month 3: Connection & Affection (based on love language)
  milestones.push({
    month: 3,
    title: "Affection & Connection Month",
    theme: "Physical & Emotional Closeness",
    icon: "💕",
    description: `Connect through ${tonyProfile?.love_language || "preferred ways of feeling loved"} and physical affection.`,
    goals: [
      `Discover each other's love language if unknown.`,
      "Daily: 2-min non-sexual physical affection (hand-holding, hugging).",
      `Weekly: 1 gesture that says 'I see you' in their preferred love language.`,
    ],
    focus: "Intimacy & Appreciation",
    difficulty: "easy",
  });

  // Month 4: Shared Visioning
  milestones.push({
    month: 4,
    title: "Dream Together",
    theme: "Shared Goals & Values",
    icon: "✨",
    description: "Align on future vision: 1 year, 5 years, 10 years.",
    goals: [
      "Create a shared vision board or written goals (relationship, finances, life).",
      "Discuss: What does a thriving relationship look like to us?",
      "Identify 3 shared values that guide decisions.",
    ],
    focus: "Alignment & Hope",
    difficulty: "easy",
  });

  // Month 5: Growth Under Pressure (if recent tension)
  if (recentMood.tension_detected) {
    milestones.push({
      month: 5,
      title: "Resilience & Stress Management",
      theme: "Staying Connected During Chaos",
      icon: "⚡",
      description: "Build tools to stay connected when external stress is high.",
      goals: [
        "Identify personal stress signals and what helps each of you regulate.",
        "Create a 'connection ritual' for stressful weeks (5-min check-in).",
        "Practice separate self-care without abandoning each other.",
      ],
      focus: "Resilience",
      difficulty: "medium",
    });
  } else {
    milestones.push({
      month: 5,
      title: "Growth & Adventure",
      theme: "New Experiences Together",
      icon: "🚀",
      description: "Step outside routine and explore new territory as a couple.",
      goals: [
        "Try 2 new activities or conversations together.",
        "Have one 'adventure day' with zero plan — just presence.",
        "Share something about yourself they've never heard.",
      ],
      focus: "Growth & Play",
      difficulty: "easy",
    });
  }

  // Month 6: Integration & Celebration
  milestones.push({
    month: 6,
    title: "Integration & Celebration",
    theme: "Living the Roadmap",
    icon: "🎉",
    description: "Review progress, celebrate wins, and plan next season.",
    goals: [
      "Reflect: What shifted? What surprised you?",
      "Celebrate 3 wins from the past 6 months.",
      "Plan the next roadmap based on what you've learned.",
    ],
    focus: "Progress & Planning",
    difficulty: "easy",
  });

  return {
    milestones,
    strengths: strengths.slice(0, 3),
    challenges: challenges.slice(0, 3),
    primaryFocus: challenges[0] || "deepening_connection",
    competentAreas: strengths.slice(0, 2),
    estimatedDuration: "6 months",
    personalization: {
      tonyStyle: tonyProfile?.communication_style || "direct",
      drewStyle: drewProfile?.communication_style || "accommodating",
      tonyNeed: tonyProfile?.needs_during_conflict || "space",
      drewNeed: drewProfile?.needs_during_conflict || "reassurance",
    },
  };
}

// Detect primary challenges from trait scores and misalignments
function detectChallenges(tonyTraits, drewTraits, misalignments = []) {
  const challenges = [];

  // Check for conflict avoidance
  if (
    (tonyTraits.conflict_avoidance_tendency || 0) > 0.6 ||
    (drewTraits.conflict_avoidance_tendency || 0) > 0.6
  ) {
    challenges.push("conflict_avoidance");
  }

  // Check for emotional expression gap
  if (
    Math.abs((tonyTraits.emotional_expressiveness || 0) - (drewTraits.emotional_expressiveness || 0)) > 0.5
  ) {
    challenges.push("emotional_expression_gap");
  }

  // Check for communication style mismatch
  if (
    Math.abs((tonyTraits.direct_communication || 0) - (drewTraits.direct_communication || 0)) > 0.5
  ) {
    challenges.push("communication_style_mismatch");
  }

  // Add detected misalignments
  if (misalignments && misalignments.length > 0) {
    challenges.push(...misalignments.slice(0, 2));
  }

  // Add more patterns if needed
  if ((tonyTraits.withdrawal_tendency || 0) > 0.6) {
    challenges.push("withdrawal_pattern");
  }

  return challenges.filter((c, i, arr) => arr.indexOf(c) === i); // dedupe
}

// Detect relationship strengths
function detectStrengths(tonyTraits, drewTraits) {
  const strengths = [];

  // Check for good repair capacity
  if (
    (tonyTraits.repair_capacity || 0) > 0.6 ||
    (drewTraits.repair_capacity || 0) > 0.6
  ) {
    strengths.push("repair_capacity");
  }

  // Check for vulnerability capacity
  if (
    (tonyTraits.emotional_vulnerability || 0) > 0.6 ||
    (drewTraits.emotional_vulnerability || 0) > 0.6
  ) {
    strengths.push("emotional_vulnerability");
  }

  // Check for growth mindset
  if (
    (tonyTraits.growth_mindset || 0) > 0.6 ||
    (drewTraits.growth_mindset || 0) > 0.6
  ) {
    strengths.push("growth_mindset");
  }

  // Check for empathy
  if (
    (tonyTraits.empathy_capacity || 0) > 0.6 &&
    (drewTraits.empathy_capacity || 0) > 0.6
  ) {
    strengths.push("mutual_empathy");
  }

  // Check for shared values alignment
  if (
    (tonyTraits.values_alignment || 0) > 0.6 ||
    (drewTraits.values_alignment || 0) > 0.6
  ) {
    strengths.push("values_alignment");
  }

  return strengths;
}

// Analyze recent mood trends for tension detection
function analyzeRecentMood(checkIns = []) {
  if (!checkIns || checkIns.length < 2) {
    return { tension_detected: false, trend: "stable" };
  }

  const recent = checkIns.slice(0, 7);
  const moods = {
    great: 5,
    good: 4,
    okay: 3,
    tough: 2,
    difficult: 1,
  };

  const scores = recent.map((c) => moods[c.mood] || 3);
  const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
  const declining = scores[0] < scores[scores.length - 1];

  return {
    tension_detected: avgScore < 3.5 || declining,
    trend: declining ? "declining" : avgScore < 3 ? "strained" : "stable",
    avgScore,
  };
}