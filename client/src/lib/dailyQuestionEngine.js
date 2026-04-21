/**
 * dailyQuestionEngine.js — Manage daily reflection questions
 * Deterministic question rotation, AI curation, intimacy-focused
 */

// Curated question bank (mix of depths, categories, LGBTQ-aware)
const QUESTION_BANK = [
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

/**
 * Get today's question deterministically based on date
 * Same date always returns same question
 */
export function getTodayQuestion() {
  const today = new Date();
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  const questionIndex = dayOfYear % QUESTION_BANK.length;
  
  const question = QUESTION_BANK[questionIndex];
  
  return {
    ...question,
    date: today.toISOString().split("T")[0],
    index: questionIndex,
  };
}

/**
 * Get question for a specific date
 */
export function getQuestionForDate(dateString) {
  const date = new Date(dateString);
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  const questionIndex = dayOfYear % QUESTION_BANK.length;
  
  const question = QUESTION_BANK[questionIndex];
  
  return {
    ...question,
    date: dateString,
    index: questionIndex,
  };
}

/**
 * Get upcoming questions (next N days)
 */
export function getUpcomingQuestions(daysAhead = 7) {
  const upcoming = [];
  const today = new Date();
  
  for (let i = 0; i < daysAhead; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const dateString = date.toISOString().split("T")[0];
    upcoming.push(getQuestionForDate(dateString));
  }
  
  return upcoming;
}

/**
 * Get question history for a period
 */
export function getQuestionHistory(days = 30) {
  const history = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split("T")[0];
    history.push(getQuestionForDate(dateString));
  }
  
  return history;
}