const PARTNER_FOCUSES = [
  "when one of us has a hard day",
  "how we reconnect after distance",
  "what makes us feel close",
  "the way we handle plans and logistics",
  "our physical affection",
  "future plans and what we are building",
  "feeling seen and understood",
  "how we spend ordinary time together",
];

const FRIEND_FOCUSES = [
  "supporting each other when life is messy",
  "how we stay in touch",
  "sharing wins and setbacks",
  "what makes time together feel easy",
  "the things we are both growing through",
  "honesty between us",
  "trusting each other with real life",
  "keeping this friendship strong over time",
];

const PARTNER_TEMPLATES = {
  light: [
    (focus) => `What is one small thing about ${focus} that already makes you feel good about us?`,
    (focus) => `What feels easiest or sweetest between us when it comes to ${focus}?`,
    (focus) => `What about ${focus} makes you smile faster than I probably realize?`,
    (focus) => `If we made ${focus} 10% more fun, what would you add first?`,
    (focus) => `What habit around ${focus} feels quietly loving to you?`,
  ],
  reflective: [
    (focus) => `What do you wish I understood more clearly about ${focus}?`,
    (focus) => `When it comes to ${focus}, what lands well with you that I should do more often?`,
    (focus) => `What tends to get missed between us around ${focus}?`,
    (focus) => `What would make ${focus} feel more intentional for you right now?`,
    (focus) => `What do you notice about yourself around ${focus} that I may not see yet?`,
  ],
  deep: [
    (focus) => `What hope or fear shows up for you around ${focus} that you do not always say out loud?`,
    (focus) => `What part of ${focus} feels most tender or vulnerable for you lately?`,
    (focus) => `When ${focus} goes badly, what meaning do you start making about us?`,
    (focus) => `What would help you feel safest and most chosen around ${focus}?`,
    (focus) => `What truth about ${focus} do you most want me to remember in a hard moment?`,
  ],
};

const FRIEND_TEMPLATES = {
  light: [
    (focus) => `What is one playful thing about ${focus} that always makes this friendship feel easy?`,
    (focus) => `What do you naturally enjoy most about us when it comes to ${focus}?`,
    (focus) => `If we made ${focus} even more fun, what would you want us to try?`,
    (focus) => `What little thing around ${focus} makes you think, "Yep, this is my person"?`,
    (focus) => `What is one low-stakes way we already do ${focus} well together?`,
  ],
  reflective: [
    (focus) => `What do you wish I understood better about you when it comes to ${focus}?`,
    (focus) => `What helps you feel most supported by me around ${focus}?`,
    (focus) => `What gets overlooked between us around ${focus}, even when our intentions are good?`,
    (focus) => `What would make ${focus} feel more honest, grounded, or real between us?`,
    (focus) => `What are you learning about yourself lately through ${focus}?`,
  ],
  deep: [
    (focus) => `What part of ${focus} feels most vulnerable or meaningful to you right now?`,
    (focus) => `When ${focus} feels off, what story do you start telling yourself about our friendship?`,
    (focus) => `What do you most want me to protect or handle well around ${focus}?`,
    (focus) => `What truth about ${focus} do you hope I never make light of?`,
    (focus) => `What would deepen trust between us around ${focus} in a real, lasting way?`,
  ],
};

const DEPTH_ORDER = ["light", "reflective", "deep"];

const PARTNER_INTIMACY_STORY_CARDS = [
  {
    id: "partners-story-light-1",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "light",
    focus: "storyline_intimacy",
    question: "If you were Shane and I was Ilya, what is one look, touch, or tiny gesture that would give away how much you want me?",
  },
  {
    id: "partners-story-light-2",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "light",
    focus: "storyline_intimacy",
    question: "If no one else was around and you ran into me unexpectedly, what would be your first instinct if you let yourself be honest?",
  },
  {
    id: "partners-story-light-3",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "light",
    focus: "storyline_intimacy",
    question: "What kind of flirting between us feels bold enough to be exciting but still soft enough to feel safe?",
  },
  {
    id: "partners-story-light-4",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "light",
    focus: "storyline_intimacy",
    question: "What would make a quiet, private moment between us feel more electric than anything public ever could?",
  },
  {
    id: "partners-story-light-5",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "light",
    focus: "storyline_intimacy",
    question: "What kind of teasing or playful tension between us feels fun instead of frustrating?",
  },
  {
    id: "partners-story-light-6",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "light",
    focus: "storyline_intimacy",
    question: "What is one thing I could do in a crowded room that would make you feel secretly chosen?",
  },
  {
    id: "partners-story-reflective-1",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "reflective",
    focus: "storyline_intimacy",
    question: "When desire and emotion get tangled together for you, what helps intimacy feel grounded instead of overwhelming?",
  },
  {
    id: "partners-story-reflective-2",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "reflective",
    focus: "storyline_intimacy",
    question: "If we had a Shane-and-Ilya kind of private chemistry, what part of that would feel thrilling to you and what part would feel risky?",
  },
  {
    id: "partners-story-reflective-3",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "reflective",
    focus: "storyline_intimacy",
    question: "What makes physical closeness feel emotionally meaningful to you instead of just physical?",
  },
  {
    id: "partners-story-reflective-4",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "reflective",
    focus: "storyline_intimacy",
    question: "What kind of communication makes you open up more sexually or romantically instead of pulling back?",
  },
  {
    id: "partners-story-reflective-5",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "reflective",
    focus: "storyline_intimacy",
    question: "What do you wish I understood better about the connection between feeling wanted and feeling safe?",
  },
  {
    id: "partners-story-reflective-6",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "reflective",
    focus: "storyline_intimacy",
    question: "If one of us was acting cool on the outside but clearly affected underneath, how would you want the other person to respond?",
  },
  {
    id: "partners-story-deep-1",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "deep",
    focus: "storyline_intimacy",
    question: "What kind of intimacy makes you feel most seen as a gay man, not just desired?",
  },
  {
    id: "partners-story-deep-2",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "deep",
    focus: "storyline_intimacy",
    question: "If we were in a moment where we both wanted each other but neither of us wanted to say too much first, what would help you feel brave enough to close the distance?",
  },
  {
    id: "partners-story-deep-3",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "deep",
    focus: "storyline_intimacy",
    question: "What part of intimacy feels easiest for you to offer, and what part feels most vulnerable to ask for?",
  },
  {
    id: "partners-story-deep-4",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "deep",
    focus: "storyline_intimacy",
    question: "If you knew I wanted you but was afraid of being too much, what would you do to make the moment feel unmistakably safe?",
  },
  {
    id: "partners-story-deep-5",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "deep",
    focus: "storyline_intimacy",
    question: "What kind of emotional honesty would deepen desire for you instead of making the moment heavier?",
  },
  {
    id: "partners-story-deep-6",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "deep",
    focus: "storyline_intimacy",
    question: "When intimacy feels especially charged between us, what do you most want me to notice, protect, or respond to well?",
  },
];

function buildDeck(deckId, label, focuses, templates) {
  const cards = [];
  DEPTH_ORDER.forEach((depth) => {
    templates[depth].forEach((builder, builderIndex) => {
      focuses.forEach((focus, focusIndex) => {
        cards.push({
          id: `${deckId}-${depth}-${builderIndex + 1}-${focusIndex + 1}`,
          deckId,
          deckLabel: label,
          depth,
          focus,
          question: builder(focus),
        });
      });
    });
  });
  return cards;
}

function shuffle(items) {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function pickCard(cards, usedIds = []) {
  const used = new Set(usedIds);
  const candidate = shuffle(cards).find((card) => !used.has(card.id));
  return candidate || shuffle(cards)[0] || null;
}

function cardsForDepth(deck, depth) {
  return deck.filter((card) => card.depth === depth);
}

export const PLAY_LAB_II_DECKS = {
  partners: {
    id: "partners",
    title: "Partners",
    subtitle: "Romantic, supportive, and emotionally rich prompts for people building a life together.",
    badge: "Romantic, playful, deeper",
    instructions: [
      "One person holds the phone and reads the card aloud.",
      "Let the other person answer first without interruption.",
      "Type what you would have guessed they might say if you want the comparison.",
      "Capture what they actually said by typing or voice memo so the app can learn from it.",
    ],
    cards: [
      ...buildDeck("partners", "Partners", PARTNER_FOCUSES, PARTNER_TEMPLATES),
      ...PARTNER_INTIMACY_STORY_CARDS,
    ],
  },
  friends: {
    id: "friends",
    title: "Friends",
    subtitle: "Funny, thoughtful, and revealing prompts that strengthen closeness without making it heavy.",
    badge: "Funny, introspective, light-to-deep",
    instructions: [
      "Read the card out loud and let the other person answer naturally.",
      "Use your prediction field if you want to test how well you know them.",
      "Capture the real answer by typing or voice memo so it becomes part of the learning record.",
      "Use the rounds to move from light connection into deeper understanding.",
    ],
    cards: buildDeck("friends", "Friends", FRIEND_FOCUSES, FRIEND_TEMPLATES),
  },
};

export function getPlayLabIIDeck(deckId) {
  return PLAY_LAB_II_DECKS[deckId] || PLAY_LAB_II_DECKS.partners;
}

export function buildPlayLabIIRoundCards(deckId, usedIds = []) {
  const deck = getPlayLabIIDeck(deckId);
  return DEPTH_ORDER.map((depth) => {
    const card = pickCard(cardsForDepth(deck.cards, depth), usedIds);
    return card;
  }).filter(Boolean);
}

export function drawReplacementPlayLabIICard(deckId, depth, usedIds = []) {
  const deck = getPlayLabIIDeck(deckId);
  return pickCard(cardsForDepth(deck.cards, depth), usedIds);
}

export function getDeckCardCount(deckId) {
  return getPlayLabIIDeck(deckId).cards.length;
}
