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
  "repairing things after a misunderstanding",
  "being the safe person each other can call",
  "what loyalty looks like between us",
  "showing up when one of us is stretched thin",
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
    (focus) => `What is one thing about ${focus} that already makes this friendship feel solid and real?`,
    (focus) => `What is something easy, funny, or familiar about ${focus} that you never want us to lose?`,
  ],
  reflective: [
    (focus) => `What do you wish I understood better about you when it comes to ${focus}?`,
    (focus) => `What helps you feel most supported by me around ${focus}?`,
    (focus) => `What gets overlooked between us around ${focus}, even when our intentions are good?`,
    (focus) => `What would make ${focus} feel more honest, grounded, or real between us?`,
    (focus) => `What are you learning about yourself lately through ${focus}?`,
    (focus) => `When it comes to ${focus}, what do I read well about you and what do I still miss?`,
    (focus) => `What would help ${focus} feel more mutual instead of one-sided between us?`,
  ],
  deep: [
    (focus) => `What part of ${focus} feels most vulnerable or meaningful to you right now?`,
    (focus) => `When ${focus} feels off, what story do you start telling yourself about our friendship?`,
    (focus) => `What do you most want me to protect or handle well around ${focus}?`,
    (focus) => `What truth about ${focus} do you hope I never make light of?`,
    (focus) => `What would deepen trust between us around ${focus} in a real, lasting way?`,
    (focus) => `If ${focus} became a stress point between us, what would you most need me to remember about you?`,
    (focus) => `What fear or hope around ${focus} do you rarely say out loud, even though it shapes how you show up with me?`,
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

const PARTNER_INTIMACY_CONNECTION_CARDS = [
  {
    id: "partners-connection-1",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "light",
    focus: "desire",
    question: "What was the first non-physical thing about me that got under your skin in the best way?",
  },
  {
    id: "partners-connection-2",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "light",
    focus: "desire",
    question: "What look, text, or tiny move from me still has the power to flip your whole mood?",
  },
  {
    id: "partners-connection-3",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "light",
    focus: "connection",
    question: "When do you feel most in sync with me without either of us needing to explain anything?",
  },
  {
    id: "partners-connection-4",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "light",
    focus: "attraction",
    question: "What personality trait of mine feels unexpectedly sexy to you every single time?",
  },
  {
    id: "partners-connection-5",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "reflective",
    focus: "emotional_safety",
    question: "How does feeling emotionally close to me change the way physical closeness lands for you?",
  },
  {
    id: "partners-connection-6",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "reflective",
    focus: "respect",
    question: "What’s something I do that makes you feel deeply respected and still wanted at the same time?",
  },
  {
    id: "partners-connection-7",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "light",
    focus: "pride",
    question: "When was a moment you felt quietly proud that I’m the one standing next to you?",
  },
  {
    id: "partners-connection-8",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "reflective",
    focus: "intimacy_definition",
    question: "How has your definition of intimacy changed since we became us?",
  },
  {
    id: "partners-connection-9",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "light",
    focus: "green_flags",
    question: "What was an early green flag that made you think this could be real for us?",
  },
  {
    id: "partners-connection-10",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "reflective",
    focus: "being_seen",
    question: "Is there a way I look at you that makes you feel completely understood?",
  },
  {
    id: "partners-connection-11",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "light",
    focus: "reconnection",
    question: "After we’ve been busy or off, what is the quickest way I can pull you back into connection with me?",
  },
  {
    id: "partners-connection-12",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "reflective",
    focus: "body_confidence",
    question: "How do you feel I’ve helped you get more comfortable in your own skin?",
  },
  {
    id: "partners-connection-13",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "deep",
    focus: "vulnerability",
    question: "What is the most vulnerable thing you’ve ever let me see, even if you didn’t say it out loud?",
  },
  {
    id: "partners-connection-14",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "deep",
    focus: "grounding",
    question: "If you were feeling insecure with me, what could I say or do that would actually steady you?",
  },
  {
    id: "partners-connection-15",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "deep",
    focus: "emotional_safety",
    question: "What is one thing I do that makes you feel safer with me than you expected to feel with anyone?",
  },
  {
    id: "partners-connection-16",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "deep",
    focus: "authenticity",
    question: "Do you feel like you can be fully yourself with me, even the messy parts, and what helps that feel true?",
  },
  {
    id: "partners-connection-17",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "reflective",
    focus: "communication",
    question: "What is the best way for me to ask for what I want so it lands as inviting instead of awkward or pressuring?",
  },
  {
    id: "partners-connection-18",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "reflective",
    focus: "boundaries",
    question: "How do you feel about the way we handle 'not tonight' or 'slow down' between us?",
  },
  {
    id: "partners-connection-19",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "reflective",
    focus: "boundaries",
    question: "What boundary between us are you grateful we know how to respect well?",
  },
  {
    id: "partners-connection-20",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "deep",
    focus: "change_over_time",
    question: "Is there something we used to do that doesn’t fit you anymore, and what would fit better now?",
  },
  {
    id: "partners-connection-21",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "reflective",
    focus: "check_ins",
    question: "When things get more intense between us, how can I check in without breaking the moment?",
  },
  {
    id: "partners-connection-22",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "reflective",
    focus: "sex_talk",
    question: "What is the most helpful conversation we’ve ever had about intimacy, attraction, or what we need from each other?",
  },
  {
    id: "partners-connection-23",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "deep",
    focus: "signals",
    question: "What kind of signal or safe word would make it easier to slow things down without killing closeness?",
  },
  {
    id: "partners-connection-24",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "reflective",
    focus: "past_experience",
    question: "Does talking about past experience help you feel more known by me, or does it make you pull back?",
  },
  {
    id: "partners-connection-25",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "deep",
    focus: "unasked_for",
    question: "What is one thing you’ve wanted to ask for but hesitated because you didn’t want to feel judged?",
  },
  {
    id: "partners-connection-26",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "reflective",
    focus: "feedback",
    question: "How do you prefer to get feedback or reassurance after we’ve shared something intimate?",
  },
  {
    id: "partners-connection-27",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "deep",
    focus: "aftercare",
    question: "When you feel overstimulated or tender, what comforts you fastest without making you shut down?",
  },
  {
    id: "partners-connection-28",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "reflective",
    focus: "talk_vs_do",
    question: "Do we have the right balance between talking things through and just letting ourselves feel them together?",
  },
  {
    id: "partners-connection-29",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "deep",
    focus: "inner_world",
    question: "What is a truth about you that you think I still haven’t fully figured out?",
  },
  {
    id: "partners-connection-30",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "deep",
    focus: "origin_story",
    question: "If we could go back to the night we first met, what would you whisper to your past self about me?",
  },
  {
    id: "partners-connection-31",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "deep",
    focus: "future",
    question: "What is one way you want us to grow closer emotionally over the next year?",
  },
  {
    id: "partners-connection-32",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "deep",
    focus: "future",
    question: "How do you want our intimacy to feel twenty years from now if we keep choosing each other well?",
  },
  {
    id: "partners-connection-33",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "reflective",
    focus: "traditions",
    question: "What habit or tradition of ours would break your heart to lose?",
  },
  {
    id: "partners-connection-34",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "deep",
    focus: "growth",
    question: "How has loving me challenged you to become more honest, softer, or braver?",
  },
  {
    id: "partners-connection-35",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "reflective",
    focus: "romance",
    question: "What is the most romantic thing we’ve done that had nothing to do with getting physical?",
  },
  {
    id: "partners-connection-36",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "light",
    focus: "absence",
    question: "When we’re apart, what is the one thing about me you miss first?",
  },
  {
    id: "partners-connection-37",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "deep",
    focus: "future",
    question: "What dream for us have you been holding quietly that you haven’t said out loud yet?",
  },
  {
    id: "partners-connection-38",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "reflective",
    focus: "public_affection",
    question: "How do you feel about the way we show affection around other people, and what feels most natural to you?",
  },
  {
    id: "partners-connection-39",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "deep",
    focus: "love_lessons",
    question: "What is the biggest thing you’ve learned about love because you’ve been with me?",
  },
  {
    id: "partners-connection-40",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "deep",
    focus: "relationship_soul",
    question: "If you had to describe the soul of our relationship in one sentence, what would you say?",
  },
  {
    id: "partners-connection-41",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "reflective",
    focus: "home",
    question: "What makes you feel most at home when you’re with me?",
  },
  {
    id: "partners-connection-42",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "light",
    focus: "afterglow",
    question: "What is your favorite thing for us to do in the minutes right after we’ve been really close?",
  },
  {
    id: "partners-connection-43",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "reflective",
    focus: "afterglow",
    question: "After a deep emotional talk, do you want silence, touch, words, or all three?",
  },
  {
    id: "partners-connection-44",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "reflective",
    focus: "aftercare",
    question: "What could I do that would make after-care feel even more like love and less like an afterthought?",
  },
  {
    id: "partners-connection-45",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "deep",
    focus: "afterglow",
    question: "How do you usually feel the morning after a night where we were really open with each other?",
  },
  {
    id: "partners-connection-46",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "deep",
    focus: "peace",
    question: "What is the most at peace you’ve ever felt in my arms, and what made that moment different?",
  },
  {
    id: "partners-connection-47",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "light",
    focus: "compliments",
    question: "What compliment from me lingers with you long after I say it?",
  },
  {
    id: "partners-connection-48",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "reflective",
    focus: "pillow_talk",
    question: "How has our pillow talk or late-night honesty strengthened us in ways we don’t always name?",
  },
  {
    id: "partners-connection-49",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "deep",
    focus: "self_knowledge",
    question: "What have you realized about your own needs because of being with me?",
  },
  {
    id: "partners-connection-50",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "deep",
    focus: "essential_truth",
    question: "If today were our last day together, what is the one thing you would need me to know for sure?",
  },
];

const PARTNER_INTIMACY_RIVALRY_CARDS = [
  {
    id: "partners-rivalry-1",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "light",
    focus: "rivalry_tension",
    question: "If we had to act like rivals in public, what’s the one look or move from me that would completely wreck your focus?",
  },
  {
    id: "partners-rivalry-2",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "light",
    focus: "public_tension",
    question: "What is the most dangerous little thing you’d want to do to me in public if you knew we couldn’t get caught?",
  },
  {
    id: "partners-rivalry-3",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "reflective",
    focus: "control",
    question: "If I gave you a direct order in a charged moment, would it hit harder to obey me or make me work for it?",
  },
  {
    id: "partners-rivalry-4",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "light",
    focus: "pet_names",
    question: "Is there a pet name, nickname, or tone from me that would completely undo your composure?",
  },
  {
    id: "partners-rivalry-5",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "reflective",
    focus: "teasing",
    question: "If I made you wait on purpose, how long do you think you could stay cool before you cracked?",
  },
  {
    id: "partners-rivalry-6",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "reflective",
    focus: "control",
    question: "When do you feel most tempted to flip the script and take over instead of letting me lead?",
  },
  {
    id: "partners-rivalry-7",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "reflective",
    focus: "intensity",
    question: "When you imagine our next really charged moment, do you want it softer, rougher, slower, or more unhinged?",
  },
  {
    id: "partners-rivalry-8",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "light",
    focus: "competition",
    question: "What is the boldest thing I could whisper to you while we’re technically busy doing something else that would make you lose instantly?",
  },
  {
    id: "partners-rivalry-9",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "reflective",
    focus: "secrecy",
    question: "Would it feel hotter or more stressful if we knew people were right outside the room and had no idea what was really going on between us?",
  },
  {
    id: "partners-rivalry-10",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "light",
    focus: "distance",
    question: "If we were stuck long-distance for a while, what would you need from me to keep the tension alive instead of letting it go flat?",
  },
  {
    id: "partners-rivalry-11",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "light",
    focus: "obsession",
    question: "What part of me are you a little too obsessed with for your own good?",
  },
  {
    id: "partners-rivalry-12",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "light",
    focus: "annoyingly_hot",
    question: "What is one habit of mine that is annoyingly hot even when you want to be normal about it?",
  },
  {
    id: "partners-rivalry-13",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "reflective",
    focus: "first_impression",
    question: "What was your most confusingly hot first impression of me?",
  },
  {
    id: "partners-rivalry-14",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "deep",
    focus: "hotel_energy",
    question: "Do you want the mood between us to feel more like a reckless secret or like a slow night where neither of us has to pretend?",
  },
  {
    id: "partners-rivalry-15",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "deep",
    focus: "private_retreat",
    question: "If we disappeared somewhere private for a week with no one expecting anything from us, where would you want us to go and who would we become there?",
  },
  {
    id: "partners-rivalry-16",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "reflective",
    focus: "public_pride",
    question: "What part of our connection would make you proud to stop hiding and let the world see?",
  },
  {
    id: "partners-rivalry-17",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "deep",
    focus: "support",
    question: "What goal of yours do you most want to feel me behind you on, in a way that leaves no doubt I’m yours?",
  },
  {
    id: "partners-rivalry-18",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "light",
    focus: "domestic_romance",
    question: "What simple, everyday thing we do together feels weirdly romantic even when it should be ordinary?",
  },
  {
    id: "partners-rivalry-19",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "deep",
    focus: "reunion",
    question: "If we had been forced to keep our hands off each other for far too long, what would be the first thing you’d want from me the second we were finally alone?",
  },
  {
    id: "partners-rivalry-20",
    deckId: "partners",
    deckLabel: "Partners",
    depth: "light",
    focus: "reward",
    question: "If you won this round and got to choose the prize, what kind of reward would you want us to cash in together?",
  },
];

const PARTNER_INTIMACY_FOCUSES = [
  "initiating intimacy without pressure",
  "what kind of touch feels grounding",
  "feeling wanted in quiet ways",
  "rebuilding intimacy after distance",
  "what makes desire feel emotionally safe",
  "private flirting and tension between us",
  "what helps us relax into each other",
  "what kind of reassurance deepens intimacy",
];

const PARTNER_INTIMACY_TEMPLATES = {
  light: [
    (focus) => `What is one small, low-pressure thing around ${focus} that would make you light up faster than I might expect?`,
    (focus) => `When it comes to ${focus}, what feels playful, inviting, and unmistakably us?`,
  ],
  reflective: [
    (focus) => `What do you wish I understood more clearly about ${focus} so it feels easier for you to open up?`,
    (focus) => `When ${focus} goes well between us, what am I doing that helps your body and mind both feel at ease?`,
  ],
  deep: [
    (focus) => `What fear, hope, or longing around ${focus} feels hardest to say directly, even if it matters a lot to you?`,
    (focus) => `If we wanted ${focus} to become more honest, more connected, and more healing between us, what would need to change first?`,
  ],
};

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

function buildIntimacyCards(deckId, label, focuses, templates) {
  const cards = [];
  DEPTH_ORDER.forEach((depth) => {
    templates[depth].forEach((builder, builderIndex) => {
      focuses.forEach((focus, focusIndex) => {
        cards.push({
          id: `${deckId}-intimacy-${depth}-${builderIndex + 1}-${focusIndex + 1}`,
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
      ...buildIntimacyCards("partners", "Partners", PARTNER_INTIMACY_FOCUSES, PARTNER_INTIMACY_TEMPLATES),
      ...PARTNER_INTIMACY_STORY_CARDS,
      ...PARTNER_INTIMACY_CONNECTION_CARDS,
      ...PARTNER_INTIMACY_RIVALRY_CARDS,
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

const PARTNER_PRIORITY_CARD_IDS = [
  "partners-story-light-1",
  "partners-story-light-2",
  "partners-story-light-3",
  "partners-story-light-4",
  "partners-story-light-5",
  "partners-story-light-6",
  "partners-rivalry-1",
  "partners-rivalry-2",
  "partners-rivalry-3",
  "partners-rivalry-4",
];

export function getPlayLabIIDeck(deckId) {
  return PLAY_LAB_II_DECKS[deckId] || PLAY_LAB_II_DECKS.partners;
}

function pickPriorityCard(deckId, deckCards, usedIds = []) {
  if (deckId !== "partners") return null;
  const used = new Set(usedIds);
  const nextPriorityId = PARTNER_PRIORITY_CARD_IDS.find((cardId) => !used.has(cardId));
  return deckCards.find((card) => card.id === nextPriorityId) || null;
}

export function buildPlayLabIIRoundCards(deckId, usedIds = []) {
  const deck = getPlayLabIIDeck(deckId);
  const workingUsed = [...usedIds];

  return DEPTH_ORDER.map((depth) => {
    const priorityCard = pickPriorityCard(deckId, deck.cards, workingUsed);
    const card = priorityCard || pickCard(cardsForDepth(deck.cards, depth), workingUsed);
    if (card) {
      workingUsed.push(card.id);
    }
    return card;
  }).filter(Boolean);
}

export function drawReplacementPlayLabIICard(deckId, depth, usedIds = []) {
  const deck = getPlayLabIIDeck(deckId);
  const priorityCard = pickPriorityCard(deckId, deck.cards, usedIds);
  if (priorityCard) return priorityCard;
  return pickCard(cardsForDepth(deck.cards, depth), usedIds);
}

export function getDeckCardCount(deckId) {
  return getPlayLabIIDeck(deckId).cards.length;
}
