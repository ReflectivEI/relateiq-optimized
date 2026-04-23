import { api } from "@/api/client";

export const PLAY_LAB_MODULES = [
  {
    id: "guess_my_inner_world",
    title: "Guess My Inner World",
    shortDescription: "One partner answers, the other guesses, then the app shows the emotional match or miss.",
    teaserDescription: "Reveal what your partner most hopes you notice first, then see where your understanding is strong or still catching up.",
    whyItMatters: "Builds empathy, support accuracy, and stronger understanding of hidden needs.",
    instructions: [
      "Choose who is answering first.",
      "Answer the prompt honestly in your own words.",
      "Have the other partner guess what the answer would be.",
      "Review the match summary and save the takeaway.",
    ],
  },
  {
    id: "repair_quest",
    title: "Repair Quest",
    shortDescription: "Turn tension into one clear repair move, backups, and a follow-through plan.",
    teaserDescription: "Turn a tense moment into one grounded repair move, realistic backups, and a next step that feels doable.",
    whyItMatters: "Improves repair timing and helps the system learn which moves reduce friction fastest.",
    instructions: [
      "Name what happened.",
      "Name what still feels unresolved.",
      "Review the best repair move plus backup options.",
      "Log whether it helped later.",
    ],
  },
  {
    id: "stress_decoder",
    title: "Stress Decoder",
    shortDescription: "Capture what support is really needed under stress and compare it against what was guessed.",
    teaserDescription: "Decode what support actually lands under pressure so you can stop guessing and respond in ways that help.",
    whyItMatters: "Improves support matching and helps AI Coach recommend better stress responses later.",
    instructions: [
      "Describe the stress source.",
      "Name the support you actually need.",
      "Have the other partner predict what you need.",
      "Review the mismatch meaning and best support move.",
    ],
  },
  {
    id: "two_truths_and_a_misread",
    title: "Two Truths and a Misread",
    shortDescription: "Use one hard moment to surface what was probably true and what was likely misread.",
    teaserDescription: "Spot the likely misread inside a hard moment and reduce the storylines that keep conflict spinning.",
    whyItMatters: "Reduces blame and improves interpretation accuracy during conflict or shutdown.",
    instructions: [
      "Paste or summarize a recent tense moment.",
      "Name what you think may have been misread.",
      "Review the likely truths, likely misread, and what to try next time.",
    ],
  },
  {
    id: "love_map_sprint",
    title: "Love Map Sprint",
    shortDescription: "Quickly test how well each partner understands the other’s current week, stressors, and needs.",
    teaserDescription: "Check how current your understanding really is by testing what matters to your partner right now, not last month.",
    whyItMatters: "Keeps relationship knowledge current instead of static or outdated.",
    instructions: [
      "Start a current-life prompt.",
      "One partner answers, the other guesses.",
      "See what was known, missed, or partly accurate.",
    ],
  },
  {
    id: "aha_cards",
    title: "Aha Cards",
    shortDescription: "Turn stored patterns into memorable insight cards you can save, export, and reuse later.",
    teaserDescription: "Turn recurring patterns into memorable insight cards you can save, revisit, and use when it matters most.",
    whyItMatters: "Makes the app’s learning portable and easier to remember in the moments that matter.",
    instructions: [
      "Generate a fresh Aha card from stored patterns.",
      "Save the card if it feels meaningful.",
      "Reuse it in AI Coach, Insights, or exports.",
    ],
  },
  {
    id: "side_quest",
    title: "One Degree of Change",
    shortDescription: "Get one small weekly behavior experiment tied to the patterns the app is already seeing.",
    teaserDescription: "Get one small behavior shift the app believes is realistic enough to try and meaningful enough to matter.",
    whyItMatters: "Creates gentle behavior change without making the app feel like homework.",
    instructions: [
      "Assign one small challenge.",
      "Understand why it was chosen.",
      "Log whether it helped or felt natural.",
    ],
  },
];

export const PLAY_LAB_SCOPE_OPTIONS = [
  { value: "Tony", label: "Tony" },
  { value: "Drew", label: "Drew" },
  { value: "Tony+Drew", label: "Tony + Drew" },
];

export function getPlayLabModule(moduleType) {
  return PLAY_LAB_MODULES.find((module) => module.id === moduleType) || PLAY_LAB_MODULES[0];
}

export async function createPlayLabSession(payload) {
  return api.playLab.createSession(payload);
}

export async function refreshPlayLabPrompt(payload) {
  return api.playLab.refreshPrompt(payload);
}

export async function submitPlayLabAnswer(payload) {
  return api.playLab.submitAnswer(payload);
}

export async function evaluatePlayLab(payload) {
  return api.playLab.evaluate(payload);
}

export async function generateRepairPlan(payload) {
  return api.playLab.generateRepairPlan(payload);
}

export async function generateAhaCard(payload) {
  return api.playLab.generateAhaCard(payload);
}

export async function assignSideQuest(payload) {
  return api.playLab.assignSideQuest(payload);
}

export async function logPlayLabOutcome(payload) {
  return api.playLab.logOutcome(payload);
}

export async function fetchPlayLabHistory(params) {
  return api.playLab.fetchHistory(params);
}

export async function fetchAhaCards(params) {
  return api.playLab.fetchAhaCards(params);
}

export async function fetchSideQuests(params) {
  return api.playLab.fetchSideQuests(params);
}

export async function explainPlayLabResult(payload) {
  return api.playLab.explain(payload);
}

export async function elaboratePlayLabResult(payload) {
  return api.playLab.elaborate(payload);
}

export async function exportPlayLabSummary(payload) {
  return api.playLab.exportSummary(payload);
}

export function buildPlayLabExportContent(result, moduleTitle) {
  const action = result?.suggestedAction || result?.suggested_action || null;
  const sections = Array.isArray(result?.sections) ? result.sections : [];

  return {
    title: moduleTitle || result?.moduleLabel || "Play Lab Result",
    scope: result?.scope || "Tony+Drew",
    summary: result?.summary || result?.ai_summary || "",
    interpretation: result?.interpretation || "",
    sections: sections.map((section) => ({
      heading: section?.title || "Insight",
      body: section?.body || "",
    })),
    nextStep: action
      ? {
          heading: action.title || "Next Step",
          body: action.description || "",
          bullets: Array.isArray(action.backups) ? action.backups : [],
        }
      : null,
  };
}
