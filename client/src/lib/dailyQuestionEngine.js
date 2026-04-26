/**
 * dailyQuestionEngine.js — Manage daily reflection questions
 * Deterministic question rotation with relationship-type aware wording.
 */

import { getRelationshipTerms } from "@/lib/relationshipParticipants";

const ROMANTIC_QUESTION_BANK = [
  {
    text: "What's something about your partner you're grateful for today, even if it's small?",
    category: "gratitude",
    depth_level: "light",
    lgbtq_specific: false,
    prompt_guidance: "Focus on a specific action, quality, or moment.",
  },
  {
    text: "When did you last feel truly seen by your partner? What made it possible?",
    category: "vulnerability",
    depth_level: "deep",
    lgbtq_specific: false,
    prompt_guidance: "Be specific about what 'seen' means to you.",
  },
  {
    text: "What's a dream you have for us as a couple in the next year?",
    category: "dreams",
    depth_level: "medium",
    lgbtq_specific: false,
    prompt_guidance: "Big or small — what do you want us to build together?",
  },
  {
    text: "Share a favorite memory from early in our relationship. Why does it matter to you?",
    category: "memories",
    depth_level: "medium",
    lgbtq_specific: false,
    prompt_guidance: "Describe what made that moment special.",
  },
  {
    text: "What's something you want your partner to know about how you experience being loved by them?",
    category: "intimacy",
    depth_level: "deep",
    lgbtq_specific: false,
    prompt_guidance: "Be honest about what feels good and what you need.",
  },
  {
    text: "For male couples: How has your relationship with another man deepened your understanding of yourself?",
    category: "growth",
    depth_level: "deep",
    lgbtq_specific: true,
    prompt_guidance: "Reflect on identity, vulnerability, or authenticity.",
  },
  {
    text: "What's a value you share with your partner that guides how you show up for each other?",
    category: "values",
    depth_level: "medium",
    lgbtq_specific: false,
    prompt_guidance: "Name the value and how you see it in your partner.",
  },
  {
    text: "For same-sex male couples: What unique strengths do you bring to this relationship because of who you are?",
    category: "appreciation",
    depth_level: "medium",
    lgbtq_specific: true,
    prompt_guidance: "Think about perspective, resilience, or love style.",
  },
  {
    text: "What's something you're working through right now that you'd like your partner to understand?",
    category: "vulnerability",
    depth_level: "deep",
    lgbtq_specific: false,
    prompt_guidance: "Share honestly — vulnerability builds connection.",
  },
  {
    text: "How do you want to grow together as a couple this year?",
    category: "growth",
    depth_level: "medium",
    lgbtq_specific: false,
    prompt_guidance: "What skills, understanding, or intimacy do you want to develop?",
  },
  {
    text: "When you imagine your future together, what does it feel like?",
    category: "future",
    depth_level: "medium",
    lgbtq_specific: false,
    prompt_guidance: "Describe the feeling — safe, excited, hopeful?",
  },
  {
    text: "What's something you've learned about love from being with your partner?",
    category: "healing",
    depth_level: "medium",
    lgbtq_specific: false,
    prompt_guidance: "How has this relationship changed what love means to you?",
  },
  {
    text: "For male couples: How do you celebrate the masculinity and vulnerability in each other?",
    category: "intimacy",
    depth_level: "deep",
    lgbtq_specific: true,
    prompt_guidance: "Reflect on redefining strength and tenderness together.",
  },
  {
    text: "What's a moment this week when you felt genuinely connected to your partner?",
    category: "gratitude",
    depth_level: "light",
    lgbtq_specific: false,
    prompt_guidance: "Any moment counts — even a laugh or a look.",
  },
  {
    text: "How does your partner bring out the best version of you?",
    category: "appreciation",
    depth_level: "medium",
    lgbtq_specific: false,
    prompt_guidance: "Specific traits or ways they inspire you.",
  },
];

const FRIENDSHIP_QUESTION_BANK = [
  {
    text: "What's something about your friend you're grateful for today, even if it's small?",
    category: "gratitude",
    depth_level: "light",
    prompt_guidance: "Focus on a specific action, quality, or moment.",
  },
  {
    text: "When did you last feel truly understood by your friend? What made that moment land?",
    category: "understanding",
    depth_level: "deep",
    prompt_guidance: "Be specific about what feeling understood means for you.",
  },
  {
    text: "What's one way this friendship feels easy or natural right now?",
    category: "ease",
    depth_level: "light",
    prompt_guidance: "Name what helps the friendship feel low-pressure and real.",
  },
  {
    text: "Share a favorite memory from this friendship. Why does it still matter to you?",
    category: "memories",
    depth_level: "medium",
    prompt_guidance: "Describe what made that moment memorable.",
  },
  {
    text: "What's something you wish your friend better understood about how you handle stress or overwhelm?",
    category: "support",
    depth_level: "deep",
    prompt_guidance: "Share what support helps and what misses the mark.",
  },
  {
    text: "What's a value you share with your friend that shapes how you show up for each other?",
    category: "values",
    depth_level: "medium",
    prompt_guidance: "Name the value and how it shows up in this friendship.",
  },
  {
    text: "What's something you're working through right now that you'd want your friend to understand better?",
    category: "vulnerability",
    depth_level: "deep",
    prompt_guidance: "Be honest about what feels hard to explain.",
  },
  {
    text: "How do you want this friendship to feel over the next year?",
    category: "growth",
    depth_level: "medium",
    prompt_guidance: "Focus on what kind of friendship you want to keep building.",
  },
  {
    text: "What's a moment this week when you felt genuinely connected to your friend?",
    category: "connection",
    depth_level: "light",
    prompt_guidance: "Any moment counts — even a quick text or laugh.",
  },
  {
    text: "How does your friend bring out a version of you that you like?",
    category: "appreciation",
    depth_level: "medium",
    prompt_guidance: "Be specific about the version of you that shows up here.",
  },
];

const FAMILY_QUESTION_BANK = [
  {
    text: "What's something about this family connection you're grateful for today, even if it's small?",
    category: "gratitude",
    depth_level: "light",
    prompt_guidance: "Focus on a specific action, quality, or moment.",
  },
  {
    text: "When do you feel most understood by this family member?",
    category: "understanding",
    depth_level: "deep",
    prompt_guidance: "Name what helps you feel understood instead of assumed.",
  },
  {
    text: "What's one thing you want to protect in this family connection right now?",
    category: "stability",
    depth_level: "medium",
    prompt_guidance: "Think about trust, closeness, or consistency.",
  },
  {
    text: "What's something you wish this family member understood better about your life right now?",
    category: "support",
    depth_level: "deep",
    prompt_guidance: "Be clear about what feels unseen or misunderstood.",
  },
  {
    text: "What helps this family connection feel steady and respectful?",
    category: "values",
    depth_level: "medium",
    prompt_guidance: "Describe the habits or qualities that help.",
  },
];

const OTHER_QUESTION_BANK = [
  {
    text: "What's something about this connection you're grateful for today, even if it's small?",
    category: "gratitude",
    depth_level: "light",
    prompt_guidance: "Focus on a specific action, quality, or moment.",
  },
  {
    text: "When do you feel most understood by the other person in this connection?",
    category: "understanding",
    depth_level: "deep",
    prompt_guidance: "Be specific about what makes that possible.",
  },
  {
    text: "What's something that helps this connection feel stable, useful, or supportive right now?",
    category: "stability",
    depth_level: "medium",
    prompt_guidance: "Think about what actually makes this connection work.",
  },
  {
    text: "What's something you wish the other person understood better about what you need?",
    category: "support",
    depth_level: "deep",
    prompt_guidance: "Name what would make this connection easier or clearer.",
  },
  {
    text: "What's a recent moment when this connection felt especially easy, productive, or meaningful?",
    category: "connection",
    depth_level: "light",
    prompt_guidance: "Describe what made the moment work well.",
  },
];

function getQuestionBank(activeRelationshipOrType) {
  const terms = getRelationshipTerms(activeRelationshipOrType);
  switch (terms.type) {
    case "friendship":
      return FRIENDSHIP_QUESTION_BANK;
    case "family":
      return FAMILY_QUESTION_BANK;
    case "other":
      return OTHER_QUESTION_BANK;
    case "romantic":
    default:
      return ROMANTIC_QUESTION_BANK;
  }
}

/**
 * Get today's question deterministically based on date
 * Same date always returns same question
 */
export function getTodayQuestion(activeRelationshipOrType) {
  const questionBank = getQuestionBank(activeRelationshipOrType);
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  const questionIndex = dayOfYear % questionBank.length;
  
  const question = questionBank[questionIndex];
  
  return {
    ...question,
    date: today.toISOString().split("T")[0],
    index: questionIndex,
  };
}

/**
 * Get question for a specific date
 */
export function getQuestionForDate(dateString, activeRelationshipOrType) {
  const questionBank = getQuestionBank(activeRelationshipOrType);
  const date = new Date(dateString);
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  const questionIndex = dayOfYear % questionBank.length;
  
  const question = questionBank[questionIndex];
  
  return {
    ...question,
    date: dateString,
    index: questionIndex,
  };
}

/**
 * Get upcoming questions (next N days)
 */
export function getUpcomingQuestions(daysAhead = 7, activeRelationshipOrType) {
  const upcoming = [];
  const today = new Date();
  
  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateString = date.toISOString().split("T")[0];
    upcoming.push(getQuestionForDate(dateString, activeRelationshipOrType));
  }
  
  return upcoming;
}

/**
 * Get question history for a period
 */
export function getQuestionHistory(days = 30, activeRelationshipOrType) {
  const history = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split("T")[0];
    history.push(getQuestionForDate(dateString, activeRelationshipOrType));
  }
  
  return history;
}
