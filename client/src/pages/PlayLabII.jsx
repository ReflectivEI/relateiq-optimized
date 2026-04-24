import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  Compass,
  Gauge,
  HeartHandshake,
  Layers3,
  MessagesSquare,
  RefreshCw,
  Sparkles,
  TimerReset,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useRelationshipAuth } from "@/context/RelationshipAuthContext";

const TOTAL_ROUNDS = 3;
const QUICK_REACTION_SECONDS = 5;

const INTENTS = [
  {
    id: "understand",
    title: "Understand Each Other",
    description: "Explore how you both think and feel beneath the surface",
    teaser: "Spot the subtle places where understanding is already strong and where assumptions drift.",
    icon: Brain,
    mode: "perception_gap",
    prompts: [
      "What do you most want your partner to understand about your current week?",
      "What helps you feel emotionally supported when you seem fine on the outside?",
      "What topic do you wish felt easier for the two of you to talk about right now?",
    ],
  },
  {
    id: "resolve",
    title: "Resolve Something",
    description: "Work through tension or misalignment in a structured way",
    teaser: "Turn friction into a cleaner map of concern, need, and the next repair move.",
    icon: HeartHandshake,
    mode: "structured_conflict",
    prompts: [
      "What’s bothering you most about this situation?",
      "What do you need in order to feel steadier here?",
      "What do you think your partner needs in order to re-engage well?",
    ],
  },
  {
    id: "connect",
    title: "Just Connect",
    description: "Light, engaging prompts to reconnect and have fun",
    teaser: "Keep it quick, instinctive, and warm so connection feels easy instead of heavy.",
    icon: Sparkles,
    mode: "quick_reaction",
    prompts: [
      "What is one tiny thing that would make tonight feel better together?",
      "What’s something your partner does that makes you soften fast?",
      "What is one thing you want more of from this connection this week?",
    ],
  },
  {
    id: "deeper",
    title: "Go Deeper",
    description: "More introspective, emotionally rich exploration",
    teaser: "Step into each other’s perspective and surface the emotional meaning underneath the facts.",
    icon: Layers3,
    mode: "switch_perspective",
    prompts: [
      "Answer as your partner would: what are they protecting when they get quiet?",
      "Answer as your partner would: what helps them feel safest in a hard conversation?",
      "Answer as your partner would: what do they most want you to notice without asking twice?",
    ],
  },
];

const toneWords = [
  "safe",
  "clarity",
  "space",
  "listening",
  "soft",
  "repair",
  "warmth",
  "calm",
  "honest",
  "time",
  "support",
  "reassurance",
];

function normalizeAnswer(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function overlapScore(left, right) {
  const leftTokens = normalizeAnswer(left);
  const rightTokens = normalizeAnswer(right);
  if (!leftTokens.length || !rightTokens.length) return 0;
  const leftSet = new Set(leftTokens);
  const rightSet = new Set(rightTokens);
  const shared = [...leftSet].filter((token) => rightSet.has(token)).length;
  return shared / Math.max(leftSet.size, rightSet.size);
}

function pullHighlightedWords(...values) {
  const tokens = new Set(values.flatMap((value) => normalizeAnswer(value)));
  return toneWords.filter((word) => tokens.has(word)).slice(0, 3);
}

function buildPerceptionInsight(yourAnswer, partnerAnswer) {
  const score = overlapScore(yourAnswer, partnerAnswer);
  const sharedWords = pullHighlightedWords(yourAnswer, partnerAnswer);
  const status = score >= 0.45 ? "Aligned" : "Perception Gap";
  const insight =
    status === "Aligned"
      ? `Insight: You're already reading similar emotional priorities here${sharedWords.length ? ` — especially around ${sharedWords.join(", ")}` : ""}.`
      : `Insight: There's a meaningful interpretation gap here${sharedWords.length ? ` around ${sharedWords.join(", ")}` : ""}, which is exactly where curiosity helps most.`;
  return { status, score, insight };
}

function buildSwitchPerspectiveInsight(yourAnswer, partnerAnswer) {
  const score = overlapScore(yourAnswer, partnerAnswer);
  return {
    status: score >= 0.35 ? "Close Read" : "Perspective Divergence",
    score,
    insight:
      score >= 0.35
        ? "Insight: You’re already tracking parts of your partner’s inner world with nuance. A little more specificity could make this feel even more accurate."
        : "Insight: Your answers point to different emotional stories, which usually means there’s richer context still waiting to be named.",
  };
}

function buildQuickReactionInsight(yourAnswer, partnerAnswer, countdown) {
  const score = overlapScore(yourAnswer, partnerAnswer);
  return {
    status: countdown <= 1 ? "Instinctive" : "Warm-Up",
    score,
    insight:
      score >= 0.35
        ? "Insight: Even under time pressure, you both moved toward a similar instinct. That usually signals a solid connection baseline."
        : "Insight: Fast answers surfaced different instincts. That doesn’t mean you’re off-track — it gives you a quick way to ask, not assume.",
  };
}

function buildConflictInsight(roundIndex, yourAnswer, partnerAnswer, responses) {
  if (roundIndex === 2) {
    const concern = responses[0]?.yourAnswer || "the concern";
    const need = responses[1]?.yourAnswer || "the need";
    const partnerNeed = partnerAnswer || responses[2]?.yourAnswer || "their need";
    return {
      status: "Conflict Map",
      score: overlapScore(need, partnerNeed),
      insight: `Insight: You’ve now mapped the concern (${concern}), the stabilizing need (${need}), and the perceived partner need (${partnerNeed}). That usually lowers reactivity fast.`,
    };
  }
  return {
    status: "Clarifying",
    score: overlapScore(yourAnswer, partnerAnswer),
    insight:
      roundIndex === 0
        ? "Insight: Naming the friction clearly is the first reset. The cleaner this is, the easier repair becomes."
        : "Insight: Needs language usually softens blame. This step is where the conversation starts getting more usable.",
  };
}

function evaluateRound(intent, roundIndex, yourAnswer, partnerAnswer, responses, countdown) {
  if (intent.mode === "perception_gap") {
    return buildPerceptionInsight(yourAnswer, partnerAnswer);
  }
  if (intent.mode === "switch_perspective") {
    return buildSwitchPerspectiveInsight(yourAnswer, partnerAnswer);
  }
  if (intent.mode === "quick_reaction") {
    return buildQuickReactionInsight(yourAnswer, partnerAnswer, countdown);
  }
  return buildConflictInsight(roundIndex, yourAnswer, partnerAnswer, responses);
}

function suggestionForIntent(intentId) {
  if (intentId === "resolve") return "Suggested next step: reflect the concern back in one sentence before moving into problem-solving.";
  if (intentId === "connect") return "Suggested next step: keep the momentum light and send one small follow-up that matches what felt warm here.";
  if (intentId === "deeper") return "Suggested next step: ask one clarifying question about the place where your perspectives diverged most.";
  return "Suggested next step: name the one part you got right and the one part you still want to understand better.";
}

function SessionHeader({ intent, currentRound }) {
  const progressValue = (currentRound / TOTAL_ROUNDS) * 100;
  return (
    <div className="rounded-[1.75rem] border border-[#0e6f72]/18 bg-white p-5 shadow-[0_18px_38px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0e6f72]/80">{intent.title}</p>
          <h2 className="text-2xl font-semibold text-[#14263f]">Round {currentRound} of {TOTAL_ROUNDS}</h2>
          <p className="max-w-2xl text-[15px] leading-6 text-[#4e6077]">{intent.teaser}</p>
        </div>
        <div className="min-w-[220px] space-y-2">
          <div className="flex items-center justify-between text-sm text-[#4e6077]">
            <span>Session Progress</span>
            <span>{currentRound}/{TOTAL_ROUNDS}</span>
          </div>
          <Progress value={progressValue} className="h-2.5 bg-[#d8ecea]" />
        </div>
      </div>
    </div>
  );
}

function IntentCard({ intent, onSelect }) {
  const Icon = intent.icon;
  return (
    <button
      type="button"
      onClick={() => onSelect(intent)}
      className="group rounded-[1.75rem] border border-white/10 bg-[#13233b]/88 p-6 text-left shadow-[0_24px_50px_rgba(8,15,29,0.42)] transition-all hover:-translate-y-1 hover:border-[#39c8c2]/45 hover:bg-[#162a46]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#39c8c2]/20 bg-[#0f3042] text-[#6ce0d9]">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-white">{intent.title}</h3>
            <p className="mt-2 text-[15px] leading-6 text-slate-300">{intent.description}</p>
          </div>
        </div>
        <ArrowRight className="mt-1 h-5 w-5 shrink-0 text-[#6ce0d9] transition-transform group-hover:translate-x-0.5" />
      </div>
    </button>
  );
}

function SessionReview({ roundResult, onContinue, isLastRound, intent, responses, participants }) {
  const conflictSummary =
    intent.mode === "structured_conflict" && responses.length >= 3
      ? [
          { label: "Concern", value: responses[0]?.yourAnswer || "—" },
          { label: "Need", value: responses[1]?.yourAnswer || "—" },
          { label: "Perceived Partner Need", value: responses[2]?.partnerAnswer || responses[2]?.yourAnswer || "—" },
        ]
      : [];

  return (
    <motion.div
      key={`review-${roundResult.round}`}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="space-y-5"
    >
      <div className="rounded-[1.75rem] border border-[#0e6f72]/20 bg-[#eef8f7] p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0e6f72]/80">Round Insight</p>
            <h3 className="mt-2 text-2xl font-semibold text-[#14263f]">{roundResult.status}</h3>
          </div>
          <div className="rounded-full border border-[#0e6f72]/20 bg-white px-4 py-2 text-sm font-medium text-[#0e6f72]">
            Similarity {(roundResult.score * 100).toFixed(0)}%
          </div>
        </div>
        <p className="mt-4 text-[16px] leading-7 text-[#25354a]">{roundResult.insight}</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[1.5rem] border border-[#0e6f72]/16 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0e6f72]/80">{participants.primary}</p>
          <p className="mt-3 whitespace-pre-wrap text-[16px] leading-7 text-[#22324a]">{roundResult.yourAnswer}</p>
        </div>
        <div className="rounded-[1.5rem] border border-[#0e6f72]/16 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0e6f72]/80">{participants.secondary}</p>
          <p className="mt-3 whitespace-pre-wrap text-[16px] leading-7 text-[#22324a]">{roundResult.partnerAnswer}</p>
        </div>
      </div>

      {conflictSummary.length ? (
        <div className="rounded-[1.5rem] border border-[#0e6f72]/16 bg-white p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0e6f72]/80">Structured Summary</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {conflictSummary.map((item) => (
              <div key={item.label} className="rounded-2xl border border-[#0e6f72]/14 bg-[#f8fbfb] p-4">
                <p className="text-sm font-semibold text-[#14263f]">{item.label}</p>
                <p className="mt-2 text-sm leading-6 text-[#4e6077]">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button onClick={onContinue} className="gap-2">
          {isLastRound ? "View Session Summary" : "Continue"}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}

export default function PlayLabII() {
  const { primaryPerson, secondaryPerson, relationshipLabel } = useRelationshipAuth();
  const participants = useMemo(
    () => ({
      primary: primaryPerson || "You",
      secondary: secondaryPerson || "Your Partner",
    }),
    [primaryPerson, secondaryPerson],
  );

  const [currentState, setCurrentState] = useState("entry");
  const [selectedIntentId, setSelectedIntentId] = useState("");
  const [currentRound, setCurrentRound] = useState(1);
  const [responses, setResponses] = useState([]);
  const [sessionPhase, setSessionPhase] = useState("active");
  const [yourAnswer, setYourAnswer] = useState("");
  const [partnerAnswer, setPartnerAnswer] = useState("");
  const [roundResult, setRoundResult] = useState(null);
  const [quickCountdown, setQuickCountdown] = useState(QUICK_REACTION_SECONDS);

  const selectedIntent = useMemo(
    () => INTENTS.find((intent) => intent.id === selectedIntentId) || null,
    [selectedIntentId],
  );

  const currentPrompt = useMemo(() => {
    if (!selectedIntent) return "";
    return selectedIntent.prompts[currentRound - 1] || selectedIntent.prompts[0];
  }, [selectedIntent, currentRound]);

  useEffect(() => {
    if (currentState !== "session" || sessionPhase !== "active" || selectedIntent?.mode !== "quick_reaction") {
      setQuickCountdown(QUICK_REACTION_SECONDS);
      return;
    }

    setQuickCountdown(QUICK_REACTION_SECONDS);
    const startedAt = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      const nextValue = Math.max(0, QUICK_REACTION_SECONDS - elapsed);
      setQuickCountdown(nextValue);
      if (nextValue === 0) {
        window.clearInterval(interval);
      }
    }, 250);

    return () => window.clearInterval(interval);
  }, [currentState, sessionPhase, currentRound, selectedIntent]);

  const startSession = () => {
    setCurrentState("intent");
    setSelectedIntentId("");
    setCurrentRound(1);
    setResponses([]);
    setSessionPhase("active");
    setRoundResult(null);
    setYourAnswer("");
    setPartnerAnswer("");
  };

  const handleIntentSelect = (intent) => {
    setSelectedIntentId(intent.id);
    setCurrentRound(1);
    setResponses([]);
    setSessionPhase("active");
    setRoundResult(null);
    setYourAnswer("");
    setPartnerAnswer("");
    setCurrentState("session");
  };

  const handleSubmit = () => {
    if (!selectedIntent) return;

    const response = {
      round: currentRound,
      prompt: currentPrompt,
      mode: selectedIntent.mode,
      yourAnswer: yourAnswer.trim() || "Skipped",
      partnerAnswer: partnerAnswer.trim() || "Skipped",
    };
    const nextResponses = [...responses, response];
    const evaluation = evaluateRound(
      selectedIntent,
      currentRound - 1,
      response.yourAnswer,
      response.partnerAnswer,
      nextResponses,
      quickCountdown,
    );

    setResponses(nextResponses);
    setRoundResult({ ...response, ...evaluation });
    setSessionPhase("review");
  };

  const continueSession = () => {
    if (currentRound >= TOTAL_ROUNDS) {
      setCurrentState("summary");
      return;
    }
    setCurrentRound((round) => round + 1);
    setYourAnswer("");
    setPartnerAnswer("");
    setRoundResult(null);
    setSessionPhase("active");
  };

  const startAnotherSession = () => {
    setCurrentState("intent");
    setSelectedIntentId("");
    setCurrentRound(1);
    setResponses([]);
    setSessionPhase("active");
    setRoundResult(null);
    setYourAnswer("");
    setPartnerAnswer("");
  };

  const alignmentHighlights = useMemo(
    () => responses.filter((response) => overlapScore(response.yourAnswer, response.partnerAnswer) >= 0.4),
    [responses],
  );

  const differencesObserved = useMemo(
    () => responses.filter((response) => overlapScore(response.yourAnswer, response.partnerAnswer) < 0.4),
    [responses],
  );

  const activeLabels = useMemo(() => {
    if (!selectedIntent) {
      return { your: "Your Answer", partner: `${participants.secondary}'s Answer` };
    }

    if (selectedIntent.mode === "perception_gap") {
      return {
        your: "Your Answer",
        partner: `What you think ${participants.secondary} would say`,
      };
    }
    if (selectedIntent.mode === "switch_perspective") {
      return {
        your: `Answer as ${participants.secondary}`,
        partner: `Now answer as ${participants.primary}`,
      };
    }
    if (selectedIntent.mode === "quick_reaction") {
      return {
        your: "Your Fast Answer",
        partner: `${participants.secondary}'s Fast Answer`,
      };
    }
    return {
      your: currentRound === 3 ? "What you think your partner needs" : "Your Answer",
      partner:
        currentRound === 1
          ? `What you think is bothering ${participants.secondary}`
          : currentRound === 2
          ? `What you think ${participants.secondary} needs`
          : "What you hope they understand",
    };
  }, [selectedIntent, participants, currentRound]);

  return (
    <div className="space-y-8">
      <AnimatePresence mode="wait">
        {currentState === "entry" ? (
          <motion.section
            key="playlabii-entry"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="rounded-[2rem] border border-[#0e6f72]/18 bg-[linear-gradient(145deg,#13233b_0%,#17304e_48%,#0d6f72_100%)] p-8 text-white shadow-[0_30px_70px_rgba(15,23,42,0.28)] sm:p-12"
          >
            <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-white/15 bg-white/10">
                <Compass className="h-7 w-7 text-[#8af2ea]" />
              </div>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-teal-200/70">{relationshipLabel}</p>
              <h1 className="mt-4 font-display text-5xl font-bold tracking-tight sm:text-6xl">Play Lab II</h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-200">
                Guided experiences to better understand each other, resolve tension, or simply connect.
              </p>
              <div className="mt-8 flex flex-col items-center gap-3">
                <Button onClick={startSession} size="lg" className="gap-2 px-8">
                  Start Session
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <p className="text-sm text-slate-300">No setup. Just start.</p>
              </div>
            </div>
          </motion.section>
        ) : null}

        {currentState === "intent" ? (
          <motion.section
            key="playlabii-intent"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-6"
          >
            <div className="rounded-[1.75rem] border border-[#0e6f72]/18 bg-white p-6 shadow-[0_18px_38px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0e6f72]/80">Intent Selection</p>
              <h2 className="mt-3 text-3xl font-semibold text-[#14263f]">Choose the kind of session you want right now</h2>
              <p className="mt-2 max-w-2xl text-[15px] leading-7 text-[#4e6077]">
                Pick the direction that fits the moment. Play Lab II will shape the session flow around that intent.
              </p>
            </div>
            <div className="grid gap-5 xl:grid-cols-2">
              {INTENTS.map((intent) => (
                <IntentCard key={intent.id} intent={intent} onSelect={handleIntentSelect} />
              ))}
            </div>
          </motion.section>
        ) : null}

        {currentState === "session" && selectedIntent ? (
          <motion.section
            key={`playlabii-session-${selectedIntent.id}-${currentRound}-${sessionPhase}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-6"
          >
            <SessionHeader intent={selectedIntent} currentRound={currentRound} />

            {sessionPhase === "active" ? (
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_360px]">
                <Card className="border border-[#0e6f72]/18 bg-white shadow-[0_18px_38px_rgba(15,23,42,0.06)]">
                  <CardHeader className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0e6f72]/80">Main Prompt</p>
                        <CardTitle className="mt-3 text-[1.95rem] leading-tight text-[#14263f]">{currentPrompt}</CardTitle>
                      </div>
                      {selectedIntent.mode === "quick_reaction" ? (
                        <div className="rounded-full border border-[#0e6f72]/18 bg-[#eef8f7] px-4 py-2 text-sm font-medium text-[#0e6f72]">
                          {quickCountdown}s
                        </div>
                      ) : null}
                    </div>
                    <p className="text-[15px] leading-6 text-[#4e6077]">
                      {selectedIntent.mode === "quick_reaction"
                        ? "Answer quickly. The point is to catch instinct before you over-edit it."
                        : "Keep it honest and natural. You’re building a cleaner read of what each of you really means."}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-[#14263f]">{activeLabels.your}</label>
                        <Textarea
                          value={yourAnswer}
                          onChange={(event) => setYourAnswer(event.target.value)}
                          placeholder="Keep it short, specific, and real."
                          className="min-h-[160px] rounded-[1.25rem] border-[#c9dfe0] bg-[#fbfdfd] px-4 py-3 text-[15px] leading-6"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-[#14263f]">{activeLabels.partner}</label>
                        <Textarea
                          value={partnerAnswer}
                          onChange={(event) => setPartnerAnswer(event.target.value)}
                          placeholder="Write the answer you expect, imagine, or hope would be true."
                          className="min-h-[160px] rounded-[1.25rem] border-[#c9dfe0] bg-[#fbfdfd] px-4 py-3 text-[15px] leading-6"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <Button onClick={handleSubmit} className="gap-2">
                        Submit & Continue
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" onClick={startAnotherSession} className="gap-2">
                        <TimerReset className="h-4 w-4" />
                        Reset Session
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <Card className="border border-[#0e6f72]/18 bg-white shadow-[0_18px_38px_rgba(15,23,42,0.06)]">
                    <CardHeader>
                      <CardTitle className="text-xl text-[#14263f]">Mode</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-[15px] leading-6 text-[#4e6077]">
                      <p className="font-semibold text-[#14263f]">{selectedIntent.title}</p>
                      <p>{selectedIntent.description}</p>
                    </CardContent>
                  </Card>

                  <Card className="border border-[#0e6f72]/18 bg-white shadow-[0_18px_38px_rgba(15,23,42,0.06)]">
                    <CardHeader>
                      <CardTitle className="text-xl text-[#14263f]">Session Notes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-[15px] leading-6 text-[#4e6077]">
                      <p>{participants.primary} and {participants.secondary} are moving through a guided three-round read of this connection.</p>
                      <p>
                        {/* TODO: Replace this local note with a backend AI Coach session summary once Play Lab II is wired into the worker. */}
                        Future AI integration will use these responses to generate more specific coaching and follow-up prompts.
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <SessionReview
                roundResult={roundResult}
                onContinue={continueSession}
                isLastRound={currentRound === TOTAL_ROUNDS}
                intent={selectedIntent}
                responses={responses}
                participants={participants}
              />
            )}
          </motion.section>
        ) : null}

        {currentState === "summary" && selectedIntent ? (
          <motion.section
            key="playlabii-summary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-6"
          >
            <div className="rounded-[1.75rem] border border-[#0e6f72]/18 bg-white p-7 shadow-[0_18px_38px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0e6f72]/80">Session Complete</p>
              <h2 className="mt-3 text-4xl font-semibold text-[#14263f]">Session Complete</h2>
              <p className="mt-3 max-w-3xl text-[16px] leading-7 text-[#4e6077]">
                You’ve completed a three-round {selectedIntent.title.toLowerCase()} session for {relationshipLabel}. Here’s the clearest read of what surfaced.
              </p>
            </div>

            <div className="grid gap-5 xl:grid-cols-3">
              <Card className="border border-[#0e6f72]/18 bg-white shadow-[0_18px_38px_rgba(15,23,42,0.06)]">
                <CardHeader>
                  <CardTitle className="text-2xl text-[#14263f]">Alignment Highlights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-[15px] leading-6 text-[#4e6077]">
                  {alignmentHighlights.length ? alignmentHighlights.map((entry) => (
                    <div key={`aligned-${entry.round}`} className="rounded-2xl border border-[#0e6f72]/14 bg-[#f8fbfb] p-4">
                      <p className="font-semibold text-[#14263f]">Round {entry.round}</p>
                      <p className="mt-2">{entry.prompt}</p>
                    </div>
                  )) : <p>Nothing was perfectly matched, which still gives the app useful learning signal.</p>}
                </CardContent>
              </Card>

              <Card className="border border-[#0e6f72]/18 bg-white shadow-[0_18px_38px_rgba(15,23,42,0.06)]">
                <CardHeader>
                  <CardTitle className="text-2xl text-[#14263f]">Differences Observed</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-[15px] leading-6 text-[#4e6077]">
                  {differencesObserved.length ? differencesObserved.map((entry) => (
                    <div key={`difference-${entry.round}`} className="rounded-2xl border border-[#0e6f72]/14 bg-[#f8fbfb] p-4">
                      <p className="font-semibold text-[#14263f]">Round {entry.round}</p>
                      <p className="mt-2">{entry.prompt}</p>
                    </div>
                  )) : <p>You stayed more aligned than not. That usually means tone and follow-through matter more than content here.</p>}
                </CardContent>
              </Card>

              <Card className="border border-[#0e6f72]/18 bg-white shadow-[0_18px_38px_rgba(15,23,42,0.06)]">
                <CardHeader>
                  <CardTitle className="text-2xl text-[#14263f]">Suggested Next Step</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-[15px] leading-6 text-[#4e6077]">
                  <div className="rounded-2xl border border-[#0e6f72]/14 bg-[#eef8f7] p-4 text-[#22324a]">
                    {/* TODO: Replace with AI Coach / worker-generated next-step text after Play Lab II integrates with backend sessions. */}
                    {suggestionForIntent(selectedIntent.id)}
                  </div>
                  <Button onClick={startAnotherSession} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Start Another Session
                  </Button>
                </CardContent>
              </Card>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
