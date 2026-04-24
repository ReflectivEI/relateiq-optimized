import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Heart,
  MessageCircleHeart,
  Mic,
  RefreshCw,
  Shuffle,
  SkipForward,
  Sparkles,
  Users2,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import VoiceRecorder from "@/components/reflection/VoiceRecorder";
import { useRelationshipAuth } from "@/context/RelationshipAuthContext";
import {
  createPlayLabSession,
  evaluatePlayLab,
  submitPlayLabAnswer,
} from "@/lib/playLabService";
import {
  buildPlayLabIIRoundCards,
  drawReplacementPlayLabIICard,
  getDeckCardCount,
  getPlayLabIIDeck,
} from "@/lib/playLabIIDecks";

const TOTAL_ROUNDS = 3;
const MAX_USED_CARD_HISTORY = 240;

const DECK_THEMES = {
  partners: {
    accent: "#e8b7c6",
    accentStrong: "#ef9b6a",
    surface: "#fdf5f8",
    glow: "0 32px 64px rgba(239, 155, 106, 0.18)",
    badge: "Romantic, supportive, deeper",
    icon: Heart,
  },
  friends: {
    accent: "#9ed9f4",
    accentStrong: "#4da3df",
    surface: "#f3fbff",
    glow: "0 32px 64px rgba(77, 163, 223, 0.18)",
    badge: "Funny, reflective, light-to-deep",
    icon: Users2,
  },
};

function tokenize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function similarityScore(left, right) {
  const leftTokens = new Set(tokenize(left));
  const rightTokens = new Set(tokenize(right));
  if (!leftTokens.size || !rightTokens.size) return 0;
  const overlap = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  return overlap / Math.max(leftTokens.size, rightTokens.size);
}

function getUsedCardStorageKey(relationshipId, deckId) {
  return `playlabii-used-cards:${relationshipId || "global"}:${deckId}`;
}

function readUsedCards(relationshipId, deckId) {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(getUsedCardStorageKey(relationshipId, deckId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeUsedCards(relationshipId, deckId, usedIds) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    getUsedCardStorageKey(relationshipId, deckId),
    JSON.stringify(usedIds.slice(-MAX_USED_CARD_HISTORY)),
  );
}

function buildFallbackInsight(card, score, hasPrediction, partnerLabel) {
  if (!hasPrediction) {
    return {
      status: "Captured",
      insight: `You captured ${partnerLabel}'s real answer. The next round can add more prediction data if you want to test how closely you read each other.`,
      nextStep: "Try adding your guess before they answer on the next card so the app can compare both sides.",
    };
  }

  if (score >= 0.48) {
    return {
      status: "Aligned",
      insight: `You were tracking this well. On a ${card.depth} card, that usually means your read of each other is current, not just familiar.`,
      nextStep: "Name the part you got right out loud so the other person feels accurately seen.",
    };
  }

  if (score >= 0.2) {
    return {
      status: "Partly Aligned",
      insight: `You caught part of the emotional shape, but there is still a gap between what you expected and what was actually said.`,
      nextStep: "Ask one follow-up question about the part that surprised you most instead of assuming you already understand it.",
    };
  }

  return {
    status: "Learning Gap",
    insight: `This card surfaced a real difference between your prediction and what was actually true. That is useful learning, not failure.`,
    nextStep: "Reflect back their real answer in your own words before moving on to the next card.",
  };
}

function buildRoundRecord({
  round,
  card,
  prediction,
  actual,
  evaluation,
  nextStep,
  status,
  sessionId,
  voiceMeta,
  skipped,
}) {
  const score = typeof evaluation?.result?.match_score === "number"
    ? Math.max(0, Math.min(1, evaluation.result.match_score / 100))
    : similarityScore(prediction, actual);

  return {
    round,
    card,
    prediction,
    actual,
    skipped: Boolean(skipped),
    score,
    status,
    insight: evaluation?.result?.summary || "",
    nextStep: evaluation?.result?.suggestedAction?.description || nextStep || "",
    interpretation: evaluation?.result?.interpretation || "",
    sessionId: sessionId || evaluation?.session?.id || "",
    voiceMeta: voiceMeta || null,
  };
}

function DeckSelectionCard({ deckId, recommended, onSelect }) {
  const deck = getPlayLabIIDeck(deckId);
  const theme = DECK_THEMES[deckId];
  const Icon = theme.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect(deckId)}
      className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#13233b]/88 p-6 text-left shadow-[0_24px_50px_rgba(8,15,29,0.42)] transition-all hover:-translate-y-1 hover:border-[#39c8c2]/45 hover:bg-[#162a46]"
    >
      {recommended ? (
        <span className="absolute right-5 top-5 rounded-full border border-[#39c8c2]/25 bg-[#0f3042] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7ce6df]">
          Recommended
        </span>
      ) : null}
      <div className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border"
          style={{ borderColor: theme.accent, backgroundColor: `${theme.accent}22`, color: theme.accentStrong }}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="space-y-3">
          <div>
            <h3 className="text-2xl font-semibold text-white">{deck.title}</h3>
            <p className="mt-2 text-[15px] leading-6 text-slate-300">{deck.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
            <span
              className="rounded-full border px-3 py-1"
              style={{ borderColor: theme.accent, color: theme.accentStrong, backgroundColor: `${theme.accent}18` }}
            >
              {theme.badge}
            </span>
            <span>{getDeckCardCount(deckId)} cards</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function PromptDeckVisual({ card, deckId }) {
  const theme = DECK_THEMES[deckId];

  return (
    <div className="mx-auto flex w-full max-w-[980px] items-center justify-center gap-4 px-1 py-1 sm:gap-6 sm:px-3">
      <div
        className="hidden aspect-[0.68] w-[170px] rotate-[-9deg] rounded-[2rem] border-[10px] border-[#111827] bg-white shadow-[0_18px_38px_rgba(15,23,42,0.12)] md:block lg:w-[188px]"
        style={{ boxShadow: theme.glow }}
      >
        <div className="relative h-full rounded-[1.2rem] border-[4px]" style={{ borderColor: theme.accent, backgroundColor: "#ffffff" }}>
          <div
            className="absolute left-1/2 top-[-18px] h-9 w-9 -translate-x-1/2 rounded-full border-[5px] border-[#111827]"
            style={{ backgroundColor: theme.accentStrong }}
          />
          <div className="absolute inset-0 opacity-40">
            <div className="absolute left-8 top-8 h-3 w-3 rounded-full border border-[#111827]" />
            <div className="absolute right-10 top-16 h-2 w-2 rounded-full bg-[#111827]" />
            <div className="absolute left-10 bottom-20 h-2 w-2 rounded-full bg-[#111827]" />
            <div className="absolute right-12 bottom-12 h-3 w-3 rounded-full border border-[#111827]" />
          </div>
        </div>
      </div>
      <motion.div
        key={card.id}
        initial={{ opacity: 0, y: 16, rotate: 1 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="aspect-[0.68] w-full max-w-[430px] rounded-[2rem] border-[10px] border-[#111827] bg-white shadow-[0_18px_38px_rgba(15,23,42,0.12)] sm:max-w-[450px]"
        style={{ boxShadow: theme.glow }}
      >
        <div
          className="relative flex h-full flex-col justify-between rounded-[1.2rem] border-[4px] px-4 py-5 sm:px-6 sm:py-6"
          style={{ borderColor: theme.accent, backgroundColor: "#ffffff" }}
        >
          <div
            className="absolute left-1/2 top-[-18px] h-9 w-9 -translate-x-1/2 rounded-full border-[5px] border-[#111827]"
            style={{ backgroundColor: theme.accentStrong }}
          />
          <div
            className="absolute bottom-[-18px] left-1/2 h-9 w-9 -translate-x-1/2 rounded-full border-[5px] border-[#111827]"
            style={{ backgroundColor: theme.accentStrong }}
          />
          <div className="flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#5d6e84] sm:text-[11px]">
            <span>{card.deckLabel}</span>
            <span>{card.depth}</span>
          </div>
          <div className="flex flex-1 items-center justify-center px-1 sm:px-3">
            <p className="max-w-[15.5ch] text-center text-[0.96rem] font-semibold leading-[1.24] text-[#14263f] sm:text-[1.08rem] md:text-[1.2rem] lg:text-[1.28rem]">
              {card.question}
            </p>
          </div>
          <p className="text-center text-[13px] leading-5 text-[#5d6e84] sm:text-sm sm:leading-6">
            Read the card aloud, then capture the real answer below.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function ReviewPanel({ review, onContinue, isLastRound, partnerLabel }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      className="space-y-6"
    >
      <div className="rounded-[1.75rem] border border-[#0e6f72]/18 bg-[#eef8f7] p-6 shadow-[0_18px_38px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0e6f72]/80">Round Insight</p>
            <h2 className="mt-2 text-3xl font-semibold text-[#14263f]">{review.status}</h2>
          </div>
          <div className="rounded-full border border-[#0e6f72]/18 bg-white px-4 py-2 text-sm font-medium text-[#0e6f72]">
            Similarity {(review.score * 100).toFixed(0)}%
          </div>
        </div>
        <p className="mt-4 text-[16px] leading-7 text-[#25354a]">{review.insight}</p>
        {review.nextStep ? (
          <div className="mt-4 rounded-2xl border border-[#0e6f72]/14 bg-white px-4 py-3 text-[15px] leading-6 text-[#4e6077]">
            <span className="font-semibold text-[#14263f]">Suggested next step:</span> {review.nextStep}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[1.5rem] border border-[#0e6f72]/16 bg-white p-5 shadow-[0_18px_38px_rgba(15,23,42,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0e6f72]/80">Your Prediction</p>
          <p className="mt-3 whitespace-pre-wrap text-[16px] leading-7 text-[#22324a]">{review.prediction || "Skipped prediction"}</p>
        </div>
        <div className="rounded-[1.5rem] border border-[#0e6f72]/16 bg-white p-5 shadow-[0_18px_38px_rgba(15,23,42,0.04)]">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0e6f72]/80">{partnerLabel}'s Real Answer</p>
          <p className="mt-3 whitespace-pre-wrap text-[16px] leading-7 text-[#22324a]">{review.actual || "Skipped"}</p>
        </div>
      </div>

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
  const { activeRelationship, activeRelationshipId, primaryPerson, relationshipLabel, secondaryPerson, user } = useRelationshipAuth();
  const participants = useMemo(
    () => ({
      primary: primaryPerson || "You",
      secondary: secondaryPerson || "Your Partner",
    }),
    [primaryPerson, secondaryPerson],
  );
  const normalizedRelationshipType = String(activeRelationship?.type || "").toLowerCase();
  const recommendedDeckId = normalizedRelationshipType === "friendship" ? "friends" : "partners";

  const [currentState, setCurrentState] = useState("entry");
  const [selectedDeckId, setSelectedDeckId] = useState("");
  const [currentRound, setCurrentRound] = useState(1);
  const [roundCards, setRoundCards] = useState([]);
  const [responses, setResponses] = useState([]);
  const [sessionPhase, setSessionPhase] = useState("capture");
  const [predictionAnswer, setPredictionAnswer] = useState("");
  const [actualAnswer, setActualAnswer] = useState("");
  const [voiceMeta, setVoiceMeta] = useState(null);
  const [review, setReview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usedCardIds, setUsedCardIds] = useState([]);

  const selectedDeck = useMemo(() => getPlayLabIIDeck(selectedDeckId || recommendedDeckId), [selectedDeckId, recommendedDeckId]);
  const currentCard = roundCards[currentRound - 1] || null;

  const progressValue = (currentRound / TOTAL_ROUNDS) * 100;

  useEffect(() => {
    setUsedCardIds(readUsedCards(activeRelationship?.id || activeRelationshipId || "", selectedDeck.id));
  }, [activeRelationship?.id, activeRelationshipId, selectedDeck.id]);

  const resetComposer = () => {
    setPredictionAnswer("");
    setActualAnswer("");
    setVoiceMeta(null);
  };

  const startSession = () => {
    setCurrentState("intent");
    setSelectedDeckId("");
    setCurrentRound(1);
    setRoundCards([]);
    setResponses([]);
    setSessionPhase("capture");
    setReview(null);
    resetComposer();
  };

  const handleDeckSelect = (deckId) => {
    setSelectedDeckId(deckId);
    const relationshipId = activeRelationship?.id || activeRelationshipId || "";
    const previouslyUsed = readUsedCards(relationshipId, deckId);
    setUsedCardIds(previouslyUsed);
    setRoundCards(buildPlayLabIIRoundCards(deckId, previouslyUsed));
    setCurrentRound(1);
    setResponses([]);
    setSessionPhase("capture");
    setReview(null);
    resetComposer();
    setCurrentState("session");
  };

  const handleDrawAnother = () => {
    if (!currentCard || isSubmitting) return;
    const usedIds = [
      ...usedCardIds,
      ...responses.map((response) => response.card.id),
      ...roundCards.map((card) => card?.id).filter(Boolean),
    ];
    const replacement = drawReplacementPlayLabIICard(selectedDeck.id, currentCard.depth, usedIds);
    if (!replacement || replacement.id === currentCard.id) {
      toast.info("No fresh card was available in that depth band.");
      return;
    }
    setRoundCards((previous) => {
      const next = [...previous];
      next[currentRound - 1] = replacement;
      return next;
    });
    resetComposer();
  };

  const handleVoiceCaptured = (payload) => {
    setVoiceMeta(payload);
    setActualAnswer(payload?.text || "");
  };

  const persistRound = async ({ prediction, actual, card }) => {
    const relationshipId = activeRelationship?.id || activeRelationshipId || "";
    const scope = `${participants.primary}+${participants.secondary}`;
    const initiatedBy = user?.name || participants.primary;
    // TODO: Replace this fixed module mapping with a dedicated Play Lab II worker mode when the
    // backend starts generating prompts and insights specifically for the card-deck experience.
    const sessionPayload = await createPlayLabSession({
      relationshipId,
      moduleType: "love_map_sprint",
      scope,
      initiatedBy,
      answeringPerson: participants.secondary,
      createdFrom: "play_lab_ii_card_deck",
    });

    const sessionId = sessionPayload?.session?.id;
    if (!sessionId) {
      throw new Error("play_lab_session_create_failed");
    }

    if (prediction) {
      await submitPlayLabAnswer({
        relationshipId,
        sessionId,
        userId: initiatedBy,
        roleInSession: "guesser",
        responseType: "text",
        responseValue: prediction,
        responseLabel: "predicted_answer",
        tags: [selectedDeck.id, card.depth, "play_lab_ii"],
        metadata: {
          experience: "card_deck",
          deckId: selectedDeck.id,
          promptId: card.id,
          round: currentRound,
        },
      });
    }

    await submitPlayLabAnswer({
      relationshipId,
      sessionId,
      userId: participants.secondary,
      roleInSession: "answerer",
      responseType: voiceMeta?.file_url ? "voice_text" : "text",
      responseValue: actual,
      responseLabel: "actual_answer",
      tags: [selectedDeck.id, card.depth, "play_lab_ii"],
      metadata: {
        experience: "card_deck",
        deckId: selectedDeck.id,
        promptId: card.id,
        round: currentRound,
        voiceCapture: voiceMeta
          ? {
              fileUrl: voiceMeta.file_url || "",
              emotion: voiceMeta.emotion || "",
              topics: voiceMeta.topics || [],
              summary: voiceMeta.summary || "",
            }
          : null,
      },
    });

    const evaluation = await evaluatePlayLab({
      relationshipId,
      sessionId,
      moduleType: "love_map_sprint",
      scope,
      initiatedBy,
      promptText: card.question,
      actualAnswer: actual,
      guessedAnswer: prediction,
    });

    return { evaluation, sessionId };
  };

  const handleSkip = () => {
    if (!currentCard || isSubmitting) return;
    const skippedReview = buildRoundRecord({
      round: currentRound,
      card: currentCard,
      prediction: predictionAnswer.trim(),
      actual: "",
      evaluation: null,
      nextStep: "Move to the next card when you are ready. A skipped round does not count against the session.",
      status: "Skipped",
      voiceMeta,
      skipped: true,
    });
    setResponses((previous) => [...previous, skippedReview]);
    const relationshipId = activeRelationship?.id || activeRelationshipId || "";
    const nextUsed = [...usedCardIds, currentCard.id];
    setUsedCardIds(nextUsed);
    writeUsedCards(relationshipId, selectedDeck.id, nextUsed);
    setReview(skippedReview);
    setSessionPhase("review");
    resetComposer();
  };

  const handleSubmit = async () => {
    if (!currentCard || isSubmitting) return;
    const prediction = predictionAnswer.trim();
    const actual = actualAnswer.trim();
    if (!actual) {
      toast.error("Capture their real answer before you submit the card.");
      return;
    }

    setIsSubmitting(true);
    try {
      let persisted = null;
      try {
        persisted = await persistRound({ prediction, actual, card: currentCard });
      } catch (error) {
        console.error(error);
        toast.error("The card was captured, but backend memory did not confirm. The round will still continue.");
      }

      const fallback = buildFallbackInsight(currentCard, similarityScore(prediction, actual), Boolean(prediction), participants.secondary);
      const nextReview = buildRoundRecord({
        round: currentRound,
        card: currentCard,
        prediction,
        actual,
        evaluation: persisted?.evaluation,
        nextStep: fallback.nextStep,
        status: persisted?.evaluation?.result?.match_score != null ? (persisted.evaluation.result.match_score >= 50 ? "Aligned" : "Perception Gap") : fallback.status,
        sessionId: persisted?.sessionId,
        voiceMeta,
      });

      nextReview.insight = persisted?.evaluation?.result?.summary || fallback.insight;
      nextReview.nextStep = persisted?.evaluation?.result?.suggestedAction?.description || fallback.nextStep;

      setResponses((previous) => [...previous, nextReview]);
      const relationshipId = activeRelationship?.id || activeRelationshipId || "";
      const nextUsed = [...usedCardIds, currentCard.id];
      setUsedCardIds(nextUsed);
      writeUsedCards(relationshipId, selectedDeck.id, nextUsed);
      setReview(nextReview);
      setSessionPhase("review");
      resetComposer();
    } finally {
      setIsSubmitting(false);
    }
  };

  const continueSession = () => {
    if (currentRound >= TOTAL_ROUNDS) {
      setCurrentState("summary");
      return;
    }
    setCurrentRound((previous) => previous + 1);
    setSessionPhase("capture");
    setReview(null);
    resetComposer();
  };

  const startAnotherSession = () => {
    const nextDeckId = selectedDeck.id;
    setRoundCards(buildPlayLabIIRoundCards(nextDeckId, usedCardIds));
    setCurrentRound(1);
    setResponses([]);
    setSessionPhase("capture");
    setReview(null);
    resetComposer();
    setCurrentState("session");
  };

  const alignedRounds = responses.filter((response) => !response.skipped && response.score >= 0.48);
  const learningRounds = responses.filter((response) => !response.skipped && response.score < 0.48);
  const latestNextStep = [...responses].reverse().find((response) => response.nextStep)?.nextStep;

  const instructions = selectedDeck.instructions;
  const theme = DECK_THEMES[selectedDeck.id];

  return (
    <div className="space-y-8">
      <AnimatePresence mode="wait">
        {currentState === "entry" ? (
          <motion.section
            key="play-lab-ii-entry"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="rounded-[2rem] border border-[#0e6f72]/18 bg-[linear-gradient(145deg,#13233b_0%,#17304e_48%,#0d6f72_100%)] p-8 text-white shadow-[0_30px_70px_rgba(15,23,42,0.28)] sm:p-12"
          >
            <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-white/15 bg-white/10">
                <MessageCircleHeart className="h-7 w-7 text-[#8af2ea]" />
              </div>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-teal-200/70">{relationshipLabel}</p>
              <h1 className="mt-4 font-display text-5xl font-bold tracking-tight sm:text-6xl">Play Lab II</h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-200">
                A guided card experience that helps you learn each other in real time, capture what was actually said,
                and feed every answer back into RelateIQ's memory.
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
            key="play-lab-ii-deck-select"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-6"
          >
            <div className="rounded-[1.75rem] border border-[#0e6f72]/18 bg-white p-6 shadow-[0_18px_38px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0e6f72]/80">Choose a Deck</p>
              <h2 className="mt-3 text-3xl font-semibold text-[#14263f]">Separate decks for partners and friends</h2>
              <p className="mt-2 max-w-3xl text-[15px] leading-7 text-[#4e6077]">
                Each deck has its own question bank, tone, and learning path. Read the card aloud, let the other person
                answer, then capture what they really said by typing or voice memo.
              </p>
            </div>
            <div className="grid gap-5 xl:grid-cols-2">
              <DeckSelectionCard deckId="partners" recommended={recommendedDeckId === "partners"} onSelect={handleDeckSelect} />
              <DeckSelectionCard deckId="friends" recommended={recommendedDeckId === "friends"} onSelect={handleDeckSelect} />
            </div>
          </motion.section>
        ) : null}

        {currentState === "session" && currentCard ? (
          <motion.section
            key={`play-lab-ii-session-${selectedDeck.id}-${currentRound}-${sessionPhase}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-6"
          >
            <div className="rounded-[1.75rem] border border-[#0e6f72]/18 bg-white p-6 shadow-[0_18px_38px_rgba(15,23,42,0.06)]">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em]" style={{ borderColor: theme.accent, backgroundColor: `${theme.accent}18`, color: theme.accentStrong }}>
                      {selectedDeck.title}
                    </span>
                    <span className="text-sm text-[#4e6077]">Round {currentRound} of {TOTAL_ROUNDS}</span>
                  </div>
                  <h2 className="text-3xl font-semibold text-[#14263f]">How well do you know your {selectedDeck.id === "friends" ? "friend" : "partner"}?</h2>
                  <p className="max-w-3xl text-[15px] leading-7 text-[#4e6077]">
                    One person reads the card, the other answers. Capture the real response, compare it to your instinct,
                    and let the app learn from both.
                  </p>
                </div>
                <div className="min-w-[240px] space-y-2">
                  <div className="flex items-center justify-between text-sm text-[#4e6077]">
                    <span>Session Progress</span>
                    <span>{currentRound}/{TOTAL_ROUNDS}</span>
                  </div>
                  <Progress value={progressValue} className="h-2.5 bg-[#d8ecea]" />
                </div>
              </div>
            </div>

            {sessionPhase === "capture" ? (
              <div className="space-y-6">
                <Card className="border border-[#0e6f72]/18 bg-white shadow-[0_18px_38px_rgba(15,23,42,0.06)]">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-2xl text-[#14263f]">How to play</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid gap-3 md:grid-cols-2">
                      {instructions.map((instruction) => (
                        <div key={instruction} className="flex min-h-[70px] items-start gap-3 rounded-[1.2rem] border border-[#0e6f72]/14 bg-[#f8fbfb] px-4 py-3 text-[14px] leading-5 text-[#4e6077] sm:text-[15px]">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0e6f72]" />
                          <p className="max-w-none">{instruction}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-[#0e6f72]/18 bg-white shadow-[0_18px_38px_rgba(15,23,42,0.06)]">
                  <CardContent className="space-y-6 p-6 sm:p-8">
                    <div className="rounded-[1.5rem] border border-[#0e6f72]/14 bg-[#fbfefe] p-4 sm:p-6">
                      <PromptDeckVisual card={currentCard} deckId={selectedDeck.id} />
                    </div>

                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_360px] xl:items-start">
                      <div className="space-y-4">
                        <div className="rounded-[1.25rem] border border-[#0e6f72]/14 bg-[#f8fbfb] p-5">
                          <h3 className="text-[1.2rem] font-semibold text-[#14263f]">
                            What you thought {participants.secondary} might say (optional)
                          </h3>
                          <p className="mt-2 text-[14px] leading-5 text-[#5a6c82]">
                            Type your instinct before or after they answer.
                          </p>
                          <Textarea
                            value={predictionAnswer}
                            onChange={(event) => setPredictionAnswer(event.target.value)}
                            placeholder="Type your instinct before or after they answer."
                            className="mt-4 min-h-[128px] rounded-[1.25rem] border-[#c9dfe0] bg-white px-4 py-3 text-[15px] leading-6"
                          />
                        </div>

                        <div className="rounded-[1.25rem] border border-[#0e6f72]/14 bg-[#f8fbfb] p-5">
                          <h3 className="text-[1.2rem] font-semibold text-[#14263f]">{participants.secondary}'s real answer</h3>
                          <p className="mt-2 text-[14px] leading-5 text-[#5a6c82]">
                            Type what {participants.secondary} actually said, or capture it by voice.
                          </p>
                          <Textarea
                            value={actualAnswer}
                            onChange={(event) => setActualAnswer(event.target.value)}
                            placeholder={`Type what ${participants.secondary} actually said, or capture it by voice.`}
                            className="mt-4 min-h-[150px] rounded-[1.25rem] border-[#c9dfe0] bg-white px-4 py-3 text-[15px] leading-6"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-[1.25rem] border border-[#0e6f72]/14 bg-[#f8fbfb] p-4">
                          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#14263f]">
                            <Mic className="h-4 w-4 text-[#0e6f72]" />
                            Voice capture
                          </div>
                          <VoiceRecorder
                            onTranscribed={handleVoiceCaptured}
                            saveDestinationLabel={`${participants.secondary}'s real answer for this round`}
                            instructions={{
                              title: "Use voice if they answer out loud",
                              bullets: [
                                "Tap record, let them answer naturally, then stop.",
                                "The transcript opens in an editable review panel before it is saved.",
                                `Save Transcript stores the final text in ${participants.secondary}'s real-answer field.`,
                                "That saved text is what this round sends into Play Lab memory when you press Submit.",
                              ],
                            }}
                          />
                        </div>

                        <div className="rounded-[1.25rem] border border-[#0e6f72]/14 bg-[#f8fbfb] p-4">
                          <p className="text-sm leading-6 text-[#5a6c82]">
                            Save Transcript keeps the edited text inside this round. When you press <span className="font-semibold text-[#14263f]">Submit</span>,
                            RelateIQ stores the final answer to this connection's Play Lab memory.
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-3">
                          <Button type="button" variant="outline" onClick={handleDrawAnother} className="gap-2">
                            <Shuffle className="h-4 w-4" />
                            Draw Another Card
                          </Button>
                          <Button type="button" variant="outline" onClick={handleSkip} className="gap-2">
                            <SkipForward className="h-4 w-4" />
                            Skip
                          </Button>
                          <Button type="button" onClick={handleSubmit} disabled={isSubmitting} className="gap-2">
                            {isSubmitting ? "Submitting..." : "Submit"}
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <ReviewPanel
                review={review}
                onContinue={continueSession}
                isLastRound={currentRound === TOTAL_ROUNDS}
                partnerLabel={participants.secondary}
              />
            )}
          </motion.section>
        ) : null}

        {currentState === "summary" ? (
          <motion.section
            key="play-lab-ii-summary"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="space-y-6"
          >
            <div className="rounded-[1.75rem] border border-[#0e6f72]/18 bg-white p-7 shadow-[0_18px_38px_rgba(15,23,42,0.06)]">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0e6f72]/80">Session Complete</p>
              <h2 className="mt-3 text-4xl font-semibold text-[#14263f]">Session Complete</h2>
              <p className="mt-3 max-w-3xl text-[16px] leading-7 text-[#4e6077]">
                You completed a three-card {selectedDeck.title.toLowerCase()} session for {relationshipLabel}. Here is the clearest read of what surfaced.
              </p>
            </div>

            <div className="grid gap-5 xl:grid-cols-3">
              <Card className="border border-[#0e6f72]/18 bg-white shadow-[0_18px_38px_rgba(15,23,42,0.06)]">
                <CardHeader>
                  <CardTitle className="text-2xl text-[#14263f]">Alignment Highlights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-[15px] leading-6 text-[#4e6077]">
                  {alignedRounds.length ? alignedRounds.map((response) => (
                    <div key={response.card.id} className="rounded-2xl border border-[#0e6f72]/14 bg-[#f8fbfb] p-4">
                      <p className="font-semibold text-[#14263f]">Round {response.round}</p>
                      <p className="mt-2">{response.card.question}</p>
                    </div>
                  )) : (
                    <p>No rounds landed as fully aligned this time, which still gives the app useful learning signal for later.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-[#0e6f72]/18 bg-white shadow-[0_18px_38px_rgba(15,23,42,0.06)]">
                <CardHeader>
                  <CardTitle className="text-2xl text-[#14263f]">Differences Observed</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-[15px] leading-6 text-[#4e6077]">
                  {learningRounds.length ? learningRounds.map((response) => (
                    <div key={response.card.id} className="rounded-2xl border border-[#0e6f72]/14 bg-[#f8fbfb] p-4">
                      <p className="font-semibold text-[#14263f]">Round {response.round}</p>
                      <p className="mt-2">{response.card.question}</p>
                    </div>
                  )) : (
                    <p>You stayed more aligned than not. That usually means you are keeping a pretty current read of each other.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border border-[#0e6f72]/18 bg-white shadow-[0_18px_38px_rgba(15,23,42,0.06)]">
                <CardHeader>
                  <CardTitle className="text-2xl text-[#14263f]">Suggested Next Step</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-[15px] leading-6 text-[#4e6077]">
                  <div className="rounded-2xl border border-[#0e6f72]/14 bg-[#eef8f7] p-4 text-[#22324a]">
                    {latestNextStep || "Pick one answer that surprised you and ask one warm follow-up question before ending the session."}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button onClick={startAnotherSession} className="gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Start Another Session
                    </Button>
                    <Button variant="outline" onClick={() => setCurrentState("intent")} className="gap-2">
                      <Sparkles className="h-4 w-4" />
                      Switch Deck
                    </Button>
                  </div>
                  <p className="text-sm text-[#6b7c92]">
                    {/* TODO: Replace this summary copy with worker-generated follow-up coaching once Play Lab II gets
                    a dedicated AI session endpoint. */}
                    RelateIQ is already saving these rounds to the current connection, and future AI follow-ups can build on them.
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.section>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
