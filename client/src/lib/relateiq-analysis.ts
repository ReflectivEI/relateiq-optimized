export type QuestionnaireResponse = {
  person_name: string;
  category: string;
  question_id: string;
  question_text: string;
  answer?: string | number;
  selected_options?: string[];
  mode?: string;
  weight?: string;
  tags?: string[];
};

export type ProfileSection = {
  id: string;
  title: string;
  summary: string;
  explain: string;
  whyItMatters: string;
  doDifferently: string;
  realLifeExample: string;
};

export type GeneratedProfile = {
  person: string;
  responseCount: number;
  intro: string;
  notice: string;
  badges: string[];
  sections: ProfileSection[];
  traitMap: Array<{ label: string; value: string }>;
};

export type ContextInsight = {
  id: string;
  title: string;
  body: string;
};

function getResponse(
  responses: QuestionnaireResponse[],
  questionId: string,
): QuestionnaireResponse | undefined {
  return responses.find((item) => item.question_id === questionId);
}

function answerText(response?: QuestionnaireResponse): string {
  if (!response) return "";
  if (typeof response.answer === "number") return String(response.answer);
  if (typeof response.answer === "string" && response.answer.trim()) return response.answer.trim();
  if (Array.isArray(response.selected_options) && response.selected_options.length > 0) {
    return response.selected_options.join(", ");
  }
  return "";
}

function sentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function firstClause(text: string): string {
  const normalized = text.trim().replace(/\s+/g, " ");
  const split = normalized.split(/[.?!]/)[0];
  return split || normalized;
}

export function buildProfileFromQuestionnaire(
  person: "Tony" | "Drew",
  responses: QuestionnaireResponse[],
): GeneratedProfile {
  const partner = person === "Tony" ? "Drew" : "Tony";
  const c1 = answerText(getResponse(responses, "c1"));
  const c2 = answerText(getResponse(responses, "c2"));
  const c3 = answerText(getResponse(responses, "c3"));
  const c4 = answerText(getResponse(responses, "c4"));
  const e1 = answerText(getResponse(responses, "e1"));
  const e2 = answerText(getResponse(responses, "e2"));
  const e3 = answerText(getResponse(responses, "e3"));
  const cf1 = answerText(getResponse(responses, "cf1"));
  const cf2 = answerText(getResponse(responses, "cf2"));
  const cf3 = answerText(getResponse(responses, "cf3"));
  const nv1 = answerText(getResponse(responses, "nv1"));
  const nv2 = answerText(getResponse(responses, "nv2"));
  const nv3 = answerText(getResponse(responses, "nv3"));
  const p1 = answerText(getResponse(responses, "p1"));
  const p2 = answerText(getResponse(responses, "p2"));
  const p3 = answerText(getResponse(responses, "p3"));
  const d1 = answerText(getResponse(responses, "d1"));
  const d2 = answerText(getResponse(responses, "d2"));
  const d3 = answerText(getResponse(responses, "d3"));
  const s2 = answerText(getResponse(responses, "s2"));
  const t1 = answerText(getResponse(responses, "t1"));
  const t2 = answerText(getResponse(responses, "t2"));

  const intro =
    person === "Tony"
      ? "Your responses point to a deeply reflective, connection-seeking style. You seem to want emotional presence, a soft entry into hard conversations, and proof that the feeling underneath the issue was actually understood."
      : "Your responses point to a low-pressure, connection-seeking style. You seem to want honesty to land simply, without turning into a lecture or an overwhelming emotional spiral.";

  const badges =
    person === "Tony"
      ? ["Processing: reflective", "Conflict pace: slower", "Need: emotional attunement"]
      : ["Processing: simple first", "Conflict pace: quicker", "Need: reassurance + ease"];

  const sections: ProfileSection[] = [
    {
      id: "who-you-are",
      title: "Who You Are",
      summary:
        person === "Tony"
          ? "Thoughtful, emotionally observant, and deeply oriented toward real presence rather than surface contact."
          : "Grounded, comfort-seeking, and strongly drawn toward warmth, simplicity, and low-pressure connection.",
      explain: sentence(firstClause(s2 || d3 || intro)),
      whyItMatters:
        person === "Tony"
          ? `When you do not feel chosen, absorbed, or emotionally received by ${partner}, your nervous system seems to move toward protection.`
          : `When connection starts to feel heavy, overanalyzed, or pressurized, your system seems to protect itself by simplifying, quieting, or getting irritable.`,
      doDifferently:
        person === "Tony"
          ? "Ask for the feeling-level response you need before the conversation gets flooded. Name that you want presence first and solutions second."
          : "Name when you want something to land simply. Ask for a short, calm response first before going deeper.",
      realLifeExample:
        person === "Tony"
          ? `"What I need first is for you to really take in how this felt for me before we solve it."`
          : `"I can talk about this, but I need it to stay simple at first so I do not shut down."`,
    },
    {
      id: "how-you-communicate",
      title: "How You Communicate",
      summary:
        person === "Tony"
          ? "You respond best to a soft check-in, context, and a sense that both people are calm enough to stay present."
          : "You respond best to calm timing, a soft entry, and feeling talked with rather than talked at.",
      explain: sentence(`Preferred start: ${c1}. Best response style: ${c2}. Feeling heard sounds like this: ${firstClause(c3)}`),
      whyItMatters:
        person === "Tony"
          ? "Your communication system is not asking for intensity. It is asking for emotional accuracy and proof of listening."
          : "Your communication system seems to open when the conversation stays respectful, direct, and emotionally manageable.",
      doDifferently:
        person === "Tony"
          ? `Let ${partner} know when timing matters by saying you want the right moment, not avoidance.`
          : `Tell ${partner} when you need a softer, shorter version of the conversation before the full emotional unpacking.`,
      realLifeExample: sentence(
        person === "Tony"
          ? `You already know you prefer to ${c4.toLowerCase()}; pairing that with an explicit follow-up time keeps your quiet from being misread.`
          : `If you say "I want to talk, just not in an intense way right this second," you reduce the chance that ${partner} reads your quiet as indifference.`,
      ),
    },
    {
      id: "what-you-need",
      title: "What You Need to Feel Connected",
      summary:
        person === "Tony"
          ? "You need warmth, emotional receptivity, and evidence that your inner experience is welcome rather than debated."
          : "You need honesty that lands cleanly, reassurance that the relationship is okay, and a sense that connection can feel easy again.",
      explain: sentence(firstClause(nv1 || d2)),
      whyItMatters:
        person === "Tony"
          ? `If ${partner} misses the emotional landing, you seem to pull inward and stop volunteering what is really going on.`
          : `If honesty feels like it will trigger a whole process, you hold back and try to manage it alone.`,
      doDifferently:
        person === "Tony"
          ? "Ask directly for initiation, eye contact, and emotional reflection instead of hoping it will be noticed."
          : "Translate your need into a small request: reassurance, closeness, a quick reset, or a calmer tone.",
      realLifeExample:
        person === "Tony"
          ? `"I do not need a defense right now. I need you to stay with my experience for a minute."`
          : `"I need to know we are okay before I can talk about the details."`,
    },
    {
      id: "triggers",
      title: "What Triggers You",
      summary:
        person === "Tony"
          ? "Dismissiveness, flatness, and minimization appear to hit you fast because they register as emotional absence."
          : "Lecturing, assumption, and repetition seem to trigger you because they feel like pressure rather than connection.",
      explain: sentence(`Misunderstood by: ${e1}. Fast defensive trigger: ${firstClause(e2)}. Frustrating situations: ${e3}`),
      whyItMatters:
        person === "Tony"
          ? "When presence drops, your body seems to interpret it as relational danger."
          : "When the tone becomes instructional or loaded, your system seems to move from openness to self-protection quickly.",
      doDifferently:
        person === "Tony"
          ? "Name the trigger early: say when tone or disengagement is becoming the real issue."
          : "Interrupt the pattern before irritability takes over by asking for a reset in tone or pace.",
      realLifeExample:
        person === "Tony"
          ? `"I can stay in this if you stay emotionally here with me."`
          : `"I want to hear you, but not in a lecturing tone. Can we reset how this is being said?"`,
    },
    {
      id: "conflict",
      title: "Your Conflict Patterns",
      summary:
        person === "Tony"
          ? "You often take space first, then return when you feel more regulated. From the outside, that can look harder or more distant than it feels internally."
          : "You tend to want resolution and reassurance sooner, and when that does not happen you can stay activated until the loop feels closed.",
      explain: sentence(`During conflict: ${cf1}. Most needed: ${cf2}. After conflict: ${cf3}`),
      whyItMatters:
        person === "Tony"
          ? `${partner} may read your silence as rejection even when it is really self-protection.`
          : `${partner} may read your urgency for closure as pressure even when it is really your attempt to restore security.`,
      doDifferently:
        person === "Tony"
          ? "Pair space with reassurance. Say you are pausing to regulate and when you will come back."
          : "Slow the first step down and ask for connection before resolution. Make room for pacing differences.",
      realLifeExample:
        person === "Tony"
          ? `"I am overwhelmed, not checked out. I need twenty minutes and then I will come back."`
          : `"I want us okay, but I can slow down if we agree not to leave this hanging forever."`,
    },
    {
      id: "partner-experience",
      title: "How Your Partner May Experience You",
      summary:
        person === "Tony"
          ? `You believe ${partner} can experience you as distant or hard to read, especially when you go quiet to regulate.`
          : `You believe ${partner} can experience you as staying too close to the surface when he wants more depth or emotional detail.`,
      explain: sentence(`You think ${partner} experiences you as: ${p1}. Biggest frustration: ${firstClause(p2)}. Most misunderstood area: ${firstClause(p3)}`),
      whyItMatters:
        person === "Tony"
          ? "Your intentions and your impact can drift apart during overwhelm."
          : "Your care can be real while still feeling incomplete to someone who wants more explicit depth.",
      doDifferently:
        person === "Tony"
          ? "Translate your silence so it does not have to be interpreted."
          : "Offer one layer more than feels natural when the moment matters.",
      realLifeExample:
        person === "Tony"
          ? `"I know I look far away right now. I am not rejecting you; I am trying to steady myself."`
          : `"I do care. I am just not naturally a big processor out loud, so I need help finding the words."`,
    },
  ];

  const traitMap = [
    { label: "Communication", value: c2 || "Soft and empathetic tone" },
    { label: "Conflict style", value: cf1 || "Varies by situation" },
    { label: "Primary need", value: firstClause(d2 || nv1 || "") || "To feel understood" },
    { label: "Common trigger", value: firstClause(e2 || e1 || "") || "Dismissive tone" },
    { label: "Growth edge", value: firstClause(t2 || t1 || d1 || "") || "Clearer expression" },
  ];

  return {
    person,
    responseCount: responses.length,
    intro,
    notice: `${person} has shared ${responses.length} questionnaire responses. Each section below is interactive and generated from real answers.`,
    badges,
    sections,
    traitMap,
  };
}

export function buildContextInsights(
  tonyResponses: QuestionnaireResponse[],
  drewResponses: QuestionnaireResponse[],
): ContextInsight[] {
  const tonyProfile = buildProfileFromQuestionnaire("Tony", tonyResponses);
  const drewProfile = buildProfileFromQuestionnaire("Drew", drewResponses);

  return [
    {
      id: "dynamic",
      title: "Main Dynamic",
      body:
        "Tony appears to slow down and withdraw when emotional safety drops, while Drew appears to want clearer reassurance and quicker resolution when distance appears. The core mismatch is pace: one protects through space, the other protects through reconnection.",
    },
    {
      id: "best-approach",
      title: "Best Approach",
      body:
        "Start difficult moments with a soft check-in, name the emotional goal before the practical goal, and explicitly separate regulation time from avoidance. That lets Tony feel received and lets Drew know the connection is still intact.",
    },
    {
      id: "watch-outs",
      title: "What To Avoid",
      body:
        "Avoid flat disengagement, lecturing tone, or turning the first moment of honesty into a full analysis. Those patterns are likely to confirm each person's threat story and push both of them into protection.",
    },
    {
      id: "shared-strength",
      title: "Shared Strength",
      body:
        `Both profiles show strong self-awareness and a real desire for closeness. ${tonyProfile.person} wants depth and attunement; ${drewProfile.person} wants simplicity and reassurance. Those are not opposing goals if pacing is handled well.`,
    },
  ];
}
