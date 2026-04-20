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

function normalize(text: string): string {
  return text.trim().replace(/\s+/g, " ");
}

function excerpt(text: string, max = 240): string {
  const normalized = normalize(text);
  if (!normalized) return "";
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max).trimEnd()}...`;
}

function combineLabeled(parts: Array<{ label: string; value: string }>): string {
  return parts
    .filter((part) => normalize(part.value))
    .map((part) => `${part.label}: ${sentence(normalize(part.value))}`)
    .join(" ");
}

function quote(text: string): string {
  const normalized = normalize(text);
  if (!normalized) return "";
  return `"${normalized}"`;
}

function combineParagraphs(...parts: string[]): string {
  return parts
    .map((part) => normalize(part))
    .filter(Boolean)
    .map((part) => sentence(part))
    .join(" ");
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
  const c5 = answerText(getResponse(responses, "c5"));
  const e1 = answerText(getResponse(responses, "e1"));
  const e2 = answerText(getResponse(responses, "e2"));
  const e3 = answerText(getResponse(responses, "e3"));
  const cf1 = answerText(getResponse(responses, "cf1"));
  const cf2 = answerText(getResponse(responses, "cf2"));
  const cf3 = answerText(getResponse(responses, "cf3"));
  const cf7 = answerText(getResponse(responses, "cf7"));
  const cf9 = answerText(getResponse(responses, "cf9"));
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
  const t3 = answerText(getResponse(responses, "t3"));
  const t4 = answerText(getResponse(responses, "t4"));
  const t5 = answerText(getResponse(responses, "t5"));
  const b3 = answerText(getResponse(responses, "b3"));
  const b5 = answerText(getResponse(responses, "b5"));
  const e5 = answerText(getResponse(responses, "e5"));
  const e8 = answerText(getResponse(responses, "e8"));
  const f3 = answerText(getResponse(responses, "f3"));
  const f4 = answerText(getResponse(responses, "f4"));
  const f5 = answerText(getResponse(responses, "f5"));
  const p4 = answerText(getResponse(responses, "p4"));
  const p5 = answerText(getResponse(responses, "p5"));
  const p7 = answerText(getResponse(responses, "p7"));
  const p8 = answerText(getResponse(responses, "p8"));
  const nv5 = answerText(getResponse(responses, "nv5"));
  const nv6 = answerText(getResponse(responses, "nv6"));
  const nv8 = answerText(getResponse(responses, "nv8"));
  const nv9 = answerText(getResponse(responses, "nv9"));
  const nv10 = answerText(getResponse(responses, "nv10"));

  const intro = combineParagraphs(
    s2,
    d2,
    d3,
  );

  const badges = [cf1, c2, excerpt(nv5 || d2 || nv8, 56)].filter(Boolean);

  const sections: ProfileSection[] = [
    {
      id: "who-you-are",
      title: "Who You Are",
      summary: excerpt(s2 || d2 || d3 || intro, 170),
      explain: combineParagraphs(
        `Perfect evening: ${quote(s2)}`,
        `Hardest thing to express: ${quote(d3)}`,
        `Emotionally hard to ask for: ${quote(d2)}`,
      ),
      whyItMatters: combineParagraphs(
        `Underlying fear: ${quote(answerText(getResponse(responses, "d6")))}`,
        `What hurts means: ${quote(answerText(getResponse(responses, "d9")))}`,
        `First internal hurt response: ${quote(answerText(getResponse(responses, "d10")))}`,
      ),
      doDifferently: combineParagraphs(
        `What has changed in this relationship: ${quote(t2)}`,
        `Pattern not fully resolved: ${quote(t3)}`,
        `Needs now: ${quote(t4)}`,
      ),
      realLifeExample: combineParagraphs(
        `What has been hard to say: ${quote(nv6)}`,
        `What your partner may not fully understand: ${quote(answerText(getResponse(responses, "d5")))}`,
      ),
    },
    {
      id: "how-you-communicate",
      title: "How You Communicate",
      summary: excerpt(c3 || nv1 || p3 || c1, 170),
      explain: combineLabeled([
        { label: "Preferred start", value: c1 },
        { label: "Best response style", value: c2 },
        { label: "Feeling heard looks like", value: c3 },
      ]),
      whyItMatters: combineParagraphs(
        `When something is bothering you, you usually ${quote(c4)}`,
        `When an issue is raised unexpectedly, your response is ${quote(c5)}`,
        `When you need something emotionally, you usually ${quote(answerText(getResponse(responses, "c7")))}`,
      ),
      doDifferently: combineParagraphs(
        `What honesty requires for you: ${quote(nv1)}`,
        `How much you usually say out loud: ${quote(answerText(getResponse(responses, "c9")))}`,
        `How silence feels in tense moments: ${quote(answerText(getResponse(responses, "c8")))}`,
      ),
      realLifeExample: combineParagraphs(
        `From the outside before you say anything: ${quote(b5)}`,
        `Where you think ${partner} misunderstands you most: ${quote(p3)}`,
      ),
    },
    {
      id: "what-you-need",
      title: "What You Need to Feel Connected",
      summary: excerpt(d2 || nv5 || nv8 || nv10, 170),
      explain: combineParagraphs(
        `To be fully honest, you need: ${quote(nv1)}`,
        `Being truly supported looks like: ${quote(nv5)}`,
        `You feel closest when: ${quote(nv8)}`,
      ),
      whyItMatters: combineParagraphs(
        `What you need emotionally but find hard to ask for: ${quote(d2)}`,
        `When stressed, you need: ${quote(nv9)}`,
        `What makes you feel most alone: ${quote(nv10)}`,
      ),
      doDifferently: combineParagraphs(
        `How you indirectly show you need support: ${quote(nv2)}`,
        `What disconnection looks like for you: ${quote(nv3)}`,
        `How important it is to feel like a priority: ${quote(answerText(getResponse(responses, "nv4")))}`,
      ),
      realLifeExample: combineParagraphs(
        `What you have wanted to say for a while: ${quote(nv6)}`,
        `What you think your partner needs more of from you: ${quote(p4)}`,
      ),
    },
    {
      id: "triggers",
      title: "What Triggers You",
      summary: excerpt(e2 || e5 || e8 || e3, 170),
      explain: combineLabeled([
        { label: "Misunderstood by", value: e1 },
        { label: "Fast defensive trigger", value: e2 },
        { label: "Frustrating situations", value: e3 },
      ]),
      whyItMatters: combineParagraphs(
        `Most vulnerable relationship situation: ${quote(e5)}`,
        `Specific phrase that sets you off: ${quote(e8)}`,
        `Partner stress affects you like this: ${quote(answerText(getResponse(responses, "e7")))}`,
      ),
      doDifferently: combineParagraphs(
        `What your partner does that is hard for you: ${quote(p7)}`,
        `Most negative tone for you: ${quote(answerText(getResponse(responses, "e4")))}`,
      ),
      realLifeExample: combineParagraphs(
        `You say you are highly sensitive to tone and body language: ${quote(answerText(getResponse(responses, "e6")))}`,
        `When upset behavior means: ${quote(answerText(getResponse(responses, "d9")))}`,
      ),
    },
    {
      id: "conflict",
      title: "Your Conflict Patterns",
      summary: excerpt(cf1 || cf2 || cf7 || cf9, 170),
      explain: combineLabeled([
        { label: "During conflict", value: cf1 },
        { label: "Most needed", value: cf2 },
        { label: "After conflict", value: cf3 },
      ]),
      whyItMatters: combineParagraphs(
        `Go-to coping mechanism at home: ${quote(b3)}`,
        `What helps de-escalate: ${quote(answerText(getResponse(responses, "cf7")))}`,
        `If conflict does not resolve cleanly: ${quote(answerText(getResponse(responses, "cf4")))}`,
      ),
      doDifferently: combineParagraphs(
        `Who you think initiates resolution: ${quote(answerText(getResponse(responses, "cf5")))}`,
        `What helps you feel repaired: ${quote(answerText(getResponse(responses, "cf9")))}`,
        `How quickly you prefer to reconnect: ${quote(answerText(getResponse(responses, "cf10")))}`,
      ),
      realLifeExample: combineParagraphs(
        `When you realize you were wrong, you usually: ${quote(answerText(getResponse(responses, "cf11")))}`,
        `How you handle mistakes or hurt: ${quote(answerText(getResponse(responses, "b6")))}`,
      ),
    },
    {
      id: "partner-experience",
      title: "How Your Partner May Experience You",
      summary: excerpt(p2 || p3 || p4 || p5, 170),
      explain: combineLabeled([
        { label: `You think ${partner} experiences you as`, value: p1 },
        { label: "Biggest frustration", value: p2 },
        { label: "Most misunderstood area", value: p3 },
      ]),
      whyItMatters: combineParagraphs(
        `What you think ${partner} needs from you: ${quote(p4)}`,
        `What you think ${partner} loves most about you: ${quote(p5)}`,
        `How accurately you think ${partner} reads your emotions: ${quote(answerText(getResponse(responses, "p6")))}`,
      ),
      doDifferently: combineParagraphs(
        `What is hard for you about ${partner}: ${quote(p7)}`,
        `What you think ${partner} needs during conflict: ${quote(p8)}`,
      ),
      realLifeExample: combineParagraphs(
        `What love looked like in your family: ${quote(f3)}`,
        `What you had to do to feel loved growing up: ${quote(f4)}`,
        `What you vowed to do differently: ${quote(f5)}`,
      ),
    },
  ];

  const traitMap = [
    { label: "Communication", value: excerpt(c3 || c2, 140) || "Soft and empathetic tone" },
    { label: "Conflict style", value: excerpt(cf1 || cf2, 140) || "Varies by situation" },
    { label: "Primary need", value: excerpt(d2 || nv1 || nv5, 140) || "To feel understood" },
    { label: "Common trigger", value: excerpt(e2 || e5 || e1, 140) || "Dismissive tone" },
    { label: "Growth edge", value: excerpt(t2 || t3 || t4 || d1, 140) || "Clearer expression" },
  ];

  return {
    person,
    responseCount: responses.length,
    intro,
    notice: `${person} has shared ${responses.length} questionnaire responses. Each section below is assembled directly from the uploaded answers.`,
    badges,
    sections,
    traitMap,
  };
}

export function buildContextInsights(
  tonyResponses: QuestionnaireResponse[],
  drewResponses: QuestionnaireResponse[],
): ContextInsight[] {
  const tonyC1 = answerText(getResponse(tonyResponses, "c1"));
  const drewC1 = answerText(getResponse(drewResponses, "c1"));
  const tonyC2 = answerText(getResponse(tonyResponses, "c2"));
  const drewC2 = answerText(getResponse(drewResponses, "c2"));
  const tonyCf1 = answerText(getResponse(tonyResponses, "cf1"));
  const drewCf1 = answerText(getResponse(drewResponses, "cf1"));
  const tonyCf2 = answerText(getResponse(tonyResponses, "cf2"));
  const drewCf2 = answerText(getResponse(drewResponses, "cf2"));
  const tonyC3 = answerText(getResponse(tonyResponses, "c3"));
  const drewC3 = answerText(getResponse(drewResponses, "c3"));
  const tonyC4 = answerText(getResponse(tonyResponses, "c4"));
  const drewC4 = answerText(getResponse(drewResponses, "c4"));
  const tonyC5 = answerText(getResponse(tonyResponses, "c5"));
  const drewC5 = answerText(getResponse(drewResponses, "c5"));
  const tonyNv1 = answerText(getResponse(tonyResponses, "nv1"));
  const drewNv1 = answerText(getResponse(drewResponses, "nv1"));
  const tonyNv5 = answerText(getResponse(tonyResponses, "nv5"));
  const drewNv5 = answerText(getResponse(drewResponses, "nv5"));
  const tonyNv6 = answerText(getResponse(tonyResponses, "nv6"));
  const drewNv6 = answerText(getResponse(drewResponses, "nv6"));
  const tonyNv8 = answerText(getResponse(tonyResponses, "nv8"));
  const drewNv8 = answerText(getResponse(drewResponses, "nv8"));
  const tonyP7 = answerText(getResponse(tonyResponses, "p7"));
  const drewP7 = answerText(getResponse(drewResponses, "p7"));
  const tonyP4 = answerText(getResponse(tonyResponses, "p4"));
  const drewP4 = answerText(getResponse(drewResponses, "p4"));
  const tonyE5 = answerText(getResponse(tonyResponses, "e5"));
  const drewE5 = answerText(getResponse(drewResponses, "e5"));
  const tonyT4 = answerText(getResponse(tonyResponses, "t4"));
  const drewT4 = answerText(getResponse(drewResponses, "t4"));
  const tonyT5 = answerText(getResponse(tonyResponses, "t5"));
  const drewT5 = answerText(getResponse(drewResponses, "t5"));

  return [
    {
      id: "conversation-entry",
      title: "How Conversations Need To Start",
      body: combineParagraphs(
        `Tony says difficult conversations work best when they start ${quote(tonyC1)} and that he responds best to ${quote(tonyC2)}`,
        `Drew says difficult conversations work best when they start ${quote(drewC1)} and that he responds best to ${quote(drewC2)}`,
      ),
    },
    {
      id: "conflict-pacing",
      title: "Conflict Pacing",
      body: combineParagraphs(
        `Tony reports ${quote(tonyCf1)} and says he needs ${quote(tonyCf2)}`,
        `Drew reports ${quote(drewCf1)} and says he needs ${quote(drewCf2)}`,
      ),
    },
    {
      id: "feeling-heard",
      title: "Feeling Heard",
      body: combineParagraphs(
        `Tony says he feels heard when ${quote(tonyC3)}`,
        `Drew says he feels heard when ${quote(drewC3)}`,
        `When something is bothering Tony, he usually ${quote(tonyC4)}; Drew usually ${quote(drewC4)}`,
        `When issues arrive unexpectedly, Tony says ${quote(tonyC5)} while Drew says ${quote(drewC5)}`,
      ),
    },
    {
      id: "honesty-support",
      title: "Honesty And Support",
      body: combineParagraphs(
        `Tony says honesty requires ${quote(tonyNv1)}`,
        `Drew says honesty requires ${quote(drewNv1)}`,
        `Tony defines support as ${quote(tonyNv5)}`,
        `Drew defines support as ${quote(drewNv5)}`,
      ),
    },
    {
      id: "connection-blueprint",
      title: "What Connection Looks Like",
      body: combineParagraphs(
        `Tony feels closest when ${quote(tonyNv8)}`,
        `Drew feels closest when ${quote(drewNv8)}`,
        `Tony thinks Drew needs more ${quote(tonyP4)}`,
        `Drew thinks Tony needs more ${quote(drewP4)}`,
      ),
    },
    {
      id: "unspoken-weight",
      title: "Unspoken Weight",
      body: combineParagraphs(
        `Tony has wanted to say ${quote(tonyNv6)}`,
        `Drew has wanted to say ${quote(drewNv6)}`,
        `Tony says what is hard about Drew is ${quote(tonyP7)}`,
        `Drew says what is hard about Tony is ${quote(drewP7)}`,
      ),
    },
    {
      id: "vulnerability-hotspots",
      title: "Where Each Of You Feels Most Exposed",
      body: combineParagraphs(
        `Tony feels most vulnerable when ${quote(tonyE5)}`,
        `Drew feels most vulnerable when ${quote(drewE5)}`,
      ),
    },
    {
      id: "relationship-direction",
      title: "What Each Of You Wants More Of Now",
      body: combineParagraphs(
        `Tony says his needs have changed toward ${quote(tonyT4)}`,
        `Drew says his needs have changed toward ${quote(drewT4)}`,
      ),
    },
    {
      id: "what-they-miss",
      title: "What They Miss",
      body: combineParagraphs(
        `Tony misses ${quote(tonyT5)}`,
        `Drew misses ${quote(drewT5)}`,
      ),
    },
  ];
}
