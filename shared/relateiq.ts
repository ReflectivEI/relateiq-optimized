export type PersonId = "Tony" | "Drew";

export type ProfileSummary = {
  person: PersonId;
  relationshipRole: string;
  communicationStyle: string;
  likelyNeedsUnderStress: string[];
  repairPreferences: string[];
  appreciationLanguage: string[];
  summary: string;
};

export type QuestionnaireSummary = {
  person: PersonId;
  totalQuestions: number;
  importedQuestions: number;
  sourceFile: string;
  importReady: boolean;
  notes: string[];
  uploadedAt?: string;
  fileName?: string;
};

export type TriggerEntry = {
  id: string;
  owner: PersonId | "Tony_Drew";
  title: string;
  description: string;
  commonReaction: string;
  whatHelps: string;
  whatWorsens: string;
  confidence: "low" | "medium" | "high";
  confirmed: boolean;
};

export type InsightCard = {
  id: string;
  title: string;
  body: string;
  scope: PersonId | "Tony_Drew";
  theme: "communication" | "repair" | "timing" | "questionnaire";
};

export type ToolCard = {
  id: string;
  name: string;
  purpose: string;
  route: string;
};

export type AppState = {
  productName: string;
  migrationState: string;
  questionnaireImported: boolean;
  profiles: ProfileSummary[];
  questionnaires: QuestionnaireSummary[];
  triggers: TriggerEntry[];
  insights: InsightCard[];
  tools: ToolCard[];
};

export type UploadedQuestionnaire = {
  person: PersonId;
  fileName: string;
  uploadedAt: string;
  responses: Array<Record<string, unknown>>;
  raw: Record<string, unknown> | Array<Record<string, unknown>>;
};

export const RELATEIQ_STATE: AppState = {
  productName: "RelateIQ",
  migrationState: "Running on a GitHub-managed frontend with a Cloudflare backend",
  questionnaireImported: false,
  profiles: [
    {
      person: "Tony",
      relationshipRole: "Partner",
      communicationStyle: "Direct, fast-moving, clarity-seeking",
      likelyNeedsUnderStress: [
        "Clear signals instead of ambiguity",
        "A concrete next step",
        "Respect for urgency without escalation",
      ],
      repairPreferences: [
        "Name the issue plainly",
        "Own impact quickly",
        "Move toward a specific repair action",
      ],
      appreciationLanguage: ["Verbal affirmation", "Acts of service"],
      summary:
        "Tony appears to benefit from directness, calm structure, and visible follow-through after difficult moments.",
    },
    {
      person: "Drew",
      relationshipRole: "Partner",
      communicationStyle: "Reflective, emotionally textured, pace-sensitive",
      likelyNeedsUnderStress: [
        "A softer entry into hard topics",
        "Time to process before resolution pressure",
        "Signals of emotional safety",
      ],
      repairPreferences: [
        "Validation before problem-solving",
        "Gentle pacing",
        "Warm reassurance with room to respond",
      ],
      appreciationLanguage: ["Quality time", "Thoughtful words"],
      summary:
        "Drew appears to respond best when emotional context is acknowledged before logistics or solutions are introduced.",
    },
  ],
  questionnaires: [
    {
      person: "Tony",
      totalQuestions: 94,
      importedQuestions: 0,
      sourceFile: "data/relateiq/tony.questionnaire.json",
      importReady: false,
      notes: [
        "Waiting for upload through the site or API.",
        "Once uploaded, this summary will update automatically from Cloudflare KV.",
      ],
    },
    {
      person: "Drew",
      totalQuestions: 94,
      importedQuestions: 0,
      sourceFile: "data/relateiq/drew.questionnaire.json",
      importReady: false,
      notes: [
        "Waiting for upload through the site or API.",
        "The frontend and worker expect a 94-question record.",
      ],
    },
  ],
  triggers: [
    {
      id: "timing-overload",
      owner: "Tony_Drew",
      title: "Bad timing compounds good intentions",
      description:
        "Difficult conversations land poorly when one person is rushed and the other wants depth.",
      commonReaction: "One person pushes for closure while the other pulls back.",
      whatHelps: "State capacity first and schedule the real conversation clearly.",
      whatWorsens: "Trying to force a complete resolution in the wrong moment.",
      confidence: "high",
      confirmed: true,
    },
    {
      id: "tone-vs-intent",
      owner: "Tony_Drew",
      title: "Intent is positive but tone feels sharp",
      description:
        "Problem-solving energy can sound dismissive even when the goal is repair.",
      commonReaction: "Defensiveness, shutdown, or debate over wording.",
      whatHelps: "Lead with acknowledgment before proposing any fix.",
      whatWorsens: "Jumping straight to logic or explaining why the tone was misunderstood.",
      confidence: "high",
      confirmed: true,
    },
    {
      id: "unfinished-loop",
      owner: "Drew",
      title: "Unfinished emotional loops linger",
      description:
        "When a conflict closes procedurally but not emotionally, it tends to resurface later.",
      commonReaction: "Distance, hesitation, or re-triggering around similar topics.",
      whatHelps: "Explicitly check whether the issue feels emotionally settled.",
      whatWorsens: "Assuming silence means resolution.",
      confidence: "medium",
      confirmed: true,
    },
  ],
  insights: [
    {
      id: "insight-1",
      title: "RelateIQ now runs on a direct GitHub and Cloudflare architecture",
      body:
        "GitHub is the source of truth and Cloudflare is the runtime. The app uses its own worker endpoints and Cloudflare KV questionnaire storage.",
      scope: "Tony_Drew",
      theme: "questionnaire",
    },
    {
      id: "insight-2",
      title: "Repair improves when pacing is explicit",
      body:
        "The strongest shared pattern so far is pacing mismatch. Naming whether this is a quick reassurance, a processing pause, or a full repair talk prevents escalation.",
      scope: "Tony_Drew",
      theme: "repair",
    },
    {
      id: "insight-3",
      title: "Questionnaire import is the next personalization unlock",
      body:
        "As soon as the Tony and Drew 94-question JSON files are dropped into the expected path, the worker can summarize themes and make coaching more specific.",
      scope: "Tony_Drew",
      theme: "questionnaire",
    },
  ],
  tools: [
    {
      id: "coach",
      name: "Conversation Coach",
      purpose: "Draft a response that fits both people more cleanly.",
      route: "/coach",
    },
    {
      id: "check-in",
      name: "Check-In",
      purpose: "Capture current emotional temperature and what needs attention.",
      route: "/check-in",
    },
    {
      id: "repair",
      name: "Repair Planner",
      purpose: "Generate a repair approach after conflict or disconnection.",
      route: "/repair",
    },
  ],
};

type CoachRequest = {
  speaker: PersonId;
  topic: string;
  goal: string;
};

type RepairRequest = {
  speaker: PersonId;
  issue: string;
  desiredOutcome: string;
};

type CheckInRequest = {
  speaker: PersonId;
  mood: string;
  notes: string;
};

export function getPartner(person: PersonId): PersonId {
  return person === "Tony" ? "Drew" : "Tony";
}

export function buildCoachResponse(input: CoachRequest) {
  const speaker = RELATEIQ_STATE.profiles.find((profile) => profile.person === input.speaker)!;
  const partner = RELATEIQ_STATE.profiles.find((profile) => profile.person === getPartner(input.speaker))!;

  return {
    response:
      `${input.speaker}, open by naming the topic in one calm sentence, then show you understand ${partner.person}'s likely need for ${partner.likelyNeedsUnderStress[0].toLowerCase()}. ` +
      `After that, make one concrete ask tied to your goal: ${input.goal || "clarity and reconnection"}.`,
    suggestedOpeners: [
      `I want to talk about ${input.topic || "this"} in a way that feels clear and safe for both of us.`,
      `Before we solve anything, I want to make sure you feel understood about what happened.`,
      `My goal here is ${input.goal || "to reconnect, not to win the point"}.`,
    ],
    avoid: [
      "Leading with defense or explanation",
      "Turning tone feedback into a debate",
      "Trying to solve the whole issue in one pass if capacity is low",
    ],
    lens: {
      speakerStyle: speaker.communicationStyle,
      partnerStyle: partner.communicationStyle,
    },
  };
}

export function buildRepairResponse(input: RepairRequest) {
  const partner = RELATEIQ_STATE.profiles.find((profile) => profile.person === getPartner(input.speaker))!;

  return {
    summary:
      `Best next move: validate the impact of ${input.issue || "the conflict"}, then ask for a paced reset that supports ${partner.person}'s need for ${partner.likelyNeedsUnderStress[1].toLowerCase()}.`,
    scripts: [
      `I don't want to rush past what happened. I can see this affected us, and I want to repair it well.`,
      `I have thoughts on the practical side, but first I want to understand what felt hardest for you.`,
      `Would it feel better to talk for ten minutes now or set a real time later today so we can do this properly?`,
    ],
    avoid: [
      "Pressure for immediate resolution",
      "Minimizing the emotional residue",
      "Explaining intent before acknowledging impact",
    ],
    desiredOutcome: input.desiredOutcome || "reconnection with clearer pacing",
  };
}

export function buildCheckInResponse(input: CheckInRequest) {
  const partner = getPartner(input.speaker);
  return {
    summary:
      `${input.speaker} is reporting ${input.mood || "mixed"} energy. The next best move is a low-pressure check-in with ${partner} that names capacity and what kind of support is needed.`,
    nextStep:
      `Try: "I'm at a ${input.mood || "mixed"} place right now and don't want to guess wrong. Do you need closeness, space, or a quick practical sync first?"`,
    notesEcho: input.notes || "No additional notes provided.",
  };
}
