/**
 * Coach.jsx — AI Coach: "Start a Conversation" Experience
 * Context-aware guidance with smart suggestions, multi-output modes, and predictive layer.
 * Routes through pipelineEngine → deterministic pattern analysis → AI Coach
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import { api } from "@/api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { pipelineEngine } from "@/lib/pipelineEngine";
import { handleError, validateInput, ERROR_TYPES } from "@/lib/errorBoundary";
import { globalState } from "@/lib/globalState";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Sparkles,
  MessageCircle,
  Copy,
  AlertTriangle,
  Wrench,
  MapPin,
  Search,
  Pencil,
  Trash2,
  Waves,
  RefreshCw,
  MessageSquare,
  Clock3,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { buildCoachPrompt } from "@/lib/prompts";
import { safeInvokeLLM, buildFallbackCoachResponse, validateCoachOutput, CreditLimitError } from "@/lib/aiSafe";
import AILoadingState from "@/components/ui/AILoadingState";
import { serializeTriggers } from "@/lib/triggerService";
import CreditLimitBanner from "@/components/ui/CreditLimitBanner";
import DataSourceBadge from "@/components/ui/DataSourceBadge";
import PrivacyBanner from "@/components/ui/PrivacyBanner";
import { toast } from "sonner";
import CoachSuggestionPills from "@/components/coach/CoachSuggestionPills";
import CoachOutputModes from "@/components/coach/CoachOutputModes";
import PredictiveOutcomeBlock from "@/components/coach/PredictiveOutcomeBlock";
import { computePatternProfile } from "@/lib/patternEngine";
import TracePanel from "@/components/trace/TracePanel";
import ErrorFallback from "@/components/errors/ErrorFallback";
import ResponseExportBar from "@/components/export/ResponseExportBar";
import NotesPanel from "@/components/notes/NotesPanel";
import { enforceCoachStructure, deriveCoachModes } from "@/lib/coachStructureEnforcer";
import { useRelationshipAuth } from "@/context/RelationshipAuthContext";
import {
  buildActiveConnectionContext,
  buildActiveConnectionContextBlock,
  buildParticipantData,
  getForeignParticipantNames,
  getPartnerName,
  getRelationshipTerms,
  isTextVisibleForRelationshipContext,
  presentRelationshipText,
  validateOutputScope,
} from "@/lib/relationshipParticipants";

const SUGGESTION_PILLS = [
  { id: "handling_conflict", label: "Handling Conflict", icon: AlertTriangle, description: "Get grounded guidance before a hard conversation escalates." },
  { id: "repair_after_tension", label: "Repair After Tension", icon: Wrench, description: "Find the cleanest way to reconnect after friction or distance." },
  { id: "feel_misunderstood", label: "I Feel Misunderstood", icon: MessageSquare, description: "Clarify what landed wrong and how to say it more clearly." },
  { id: "they_feel_distant", label: "They Feel Distant", icon: MapPin, description: "Respond when the other person feels emotionally farther away." },
  { id: "something_felt_off", label: "Something Felt Off", icon: Search, description: "Make sense of a subtle moment that felt tense or unclear." },
  { id: "say_this_better", label: "I Want to Say This Better", icon: Pencil, description: "Rewrite a thought into language that is steadier and easier to receive." },
  { id: "overwhelmed_triggered", label: "I'm Overwhelmed / Triggered", icon: Waves, description: "Slow down and regulate before the next move." },
  { id: "repeating_pattern", label: "We Keep Repeating This Pattern", icon: RefreshCw, description: "Name the cycle and interrupt it with a better response." },
];

function cleanSituationText(value) {
  if (!value || typeof value !== "string") return "";
  return value
    .replace(/\[[^\]]+\]\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildCoachEntryText(entry) {
  return Object.values(entry || {})
    .filter((value) => typeof value === "string")
    .join("\n");
}

function sanitizeCoachEntry(entry, participants, activeRelationship) {
  return Object.fromEntries(
    Object.entries(entry || {}).map(([key, value]) => [
      key,
      typeof value === "string" ? presentRelationshipText(value, participants, activeRelationship) : value,
    ]),
  );
}

function summarizeCoachSession(session) {
  const rawText = cleanSituationText(session?.situation);
  const text = rawText.length > 140 ? `${rawText.slice(0, 137)}...` : rawText;
  const lower = rawText.toLowerCase();

  let title = "Recent Coaching Request";
  let description = text || "A recent request for connection guidance.";

  if (lower.includes("repair") || lower.includes("reconnect")) {
    title = "Reconnection Support";
  } else if (lower.includes("misunderstood") || lower.includes("misheard") || lower.includes("dismissed")) {
    title = "Feeling Misunderstood";
  } else if (lower.includes("conflict") || lower.includes("tension")) {
    title = "Conflict Navigation";
  } else if (lower.includes("trigger") || lower.includes("overwhelmed")) {
    title = "Regulation Support";
  } else if (lower.includes("say") || lower.includes("phrase") || lower.includes("word")) {
    title = "Wording Support";
  } else if (session?.situation?.includes("[Questionnaire")) {
    title = "Questionnaire Follow-Up";
    description = rawText && rawText.toLowerCase() !== "hi"
      ? text
      : `A short follow-up started from ${session.speaker}'s questionnaire context.`;
  }

  if (!rawText || rawText.toLowerCase() === "hi") {
    description = `A brief coaching prompt was opened for ${session.speaker} speaking to ${session.speaking_to}.`;
  }

  return { title, description };
}

function normalizeParticipantSelection(value, participants, fallback) {
  if (typeof value === "string" && participants.includes(value)) return value;
  if (typeof value === "string") {
    const normalizedValue = value.trim().toLowerCase();
    const match = participants.find((participant) => participant.toLowerCase() === normalizedValue);
    if (match) return match;
  }
  return fallback;
}

function resolveCoachTarget(speakerValue, targetValue, participants) {
  const normalizedParticipants = [...new Set((participants || []).map((person) => String(person || "").trim()).filter(Boolean))].slice(0, 2);
  const normalizedSpeaker = normalizeParticipantSelection(speakerValue, normalizedParticipants, normalizedParticipants[0] || "");
  const fallbackTarget = normalizedParticipants.length === 2 ? getPartnerName(normalizedSpeaker, normalizedParticipants) : "";
  const normalizedTarget = normalizeParticipantSelection(targetValue, normalizedParticipants, fallbackTarget);

  if (!normalizedSpeaker) {
    return { speaker: "", speakingTo: "" };
  }

  if (normalizedParticipants.length < 2) {
    return { speaker: normalizedSpeaker, speakingTo: "" };
  }

  if (!normalizedTarget || normalizedTarget === normalizedSpeaker) {
    return { speaker: normalizedSpeaker, speakingTo: fallbackTarget };
  }

  return { speaker: normalizedSpeaker, speakingTo: normalizedTarget };
}

export default function Coach() {
  const { activeRelationshipId, activeRelationship, participants, relationships } = useRelationshipAuth();
  const activeParticipants = useMemo(
    () => [...new Set((participants || []).map((person) => String(person || "").trim()).filter(Boolean))].slice(0, 2),
    [participants],
  );
  const participantA = activeParticipants[0] || "";
  const participantB = activeParticipants[1] || "";
  const hiddenParticipantNames = useMemo(
    () => getForeignParticipantNames(relationships, activeParticipants),
    [relationships, activeParticipants],
  );
  const [speaker, setSpeaker] = useState(activeParticipants[0] || "");
  const [speakingTo, setSpeakingTo] = useState(activeParticipants[1] || "");
  const [situation, setSituation] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [outputMode, setOutputMode] = useState("full");
  const [baseResponse, setBaseResponse] = useState(null);
  const [coachModes, setCoachModes] = useState(null);
  const [creditError, setCreditError] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [predictiveOutput, setPredictiveOutput] = useState(null);
  const [selectedPill, setSelectedPill] = useState(null);
  const [pipelineTrace, setPipelineTrace] = useState(null);
  const [error, setError] = useState(null);
  const [editingSessionId, setEditingSessionId] = useState(null);
  const responseRef = useRef(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (activeParticipants.length < 2) {
      setSpeaker(activeParticipants[0] || "");
      setSpeakingTo("");
      return;
    }

    setSpeaker(activeParticipants[0]);
    setSpeakingTo(activeParticipants[1]);
  }, [activeParticipants, activeRelationshipId]);

  useEffect(() => {
    const normalizedSpeaker = normalizeParticipantSelection(speaker, activeParticipants, activeParticipants[0]);
    if (normalizedSpeaker !== speaker) setSpeaker(normalizedSpeaker);

    const normalizedTarget = normalizeParticipantSelection(
      speakingTo,
      activeParticipants,
      getPartnerName(normalizedSpeaker, activeParticipants),
    );
    if (normalizedTarget !== speakingTo || normalizedTarget === normalizedSpeaker) {
      setSpeakingTo(getPartnerName(normalizedSpeaker, activeParticipants));
    }
  }, [activeParticipants, speaker, speakingTo]);

  const currentSelection = resolveCoachTarget(speaker, speakingTo, activeParticipants);
  const currentSpeaker = currentSelection.speaker;
  const currentSpeakingTo = currentSelection.speakingTo;
  const canSubmitCoach =
    activeParticipants.length >= 2 &&
    Boolean(currentSpeaker) &&
    Boolean(currentSpeakingTo) &&
    currentSpeaker !== currentSpeakingTo &&
    situation.trim().length >= 10;

  const { data: triggers = [] } = useQuery({
    queryKey: ["triggers-coach", activeRelationshipId],
    queryFn: () => api.entities.TriggerEntry.list(),
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-coach", activeRelationshipId],
    queryFn: () => api.entities.UserProfile.list(),
  });

  const { data: pastSessions = [] } = useQuery({
    queryKey: ["coach-sessions", activeRelationshipId],
    queryFn: () => api.entities.CoachSession.list("-created_date", 20),
  });

  const { data: recentCheckIns = [] } = useQuery({
    queryKey: ["coach-checkins", activeRelationshipId],
    queryFn: () => api.entities.CheckIn.list("-created_date", 20),
  });

  const { data: tonyResponses = [] } = useQuery({
    queryKey: ["responses-coach-person-a", activeRelationshipId, participantA],
    queryFn: () => (participantA ? api.entities.QuestionnaireResponse.filter({ person_name: participantA }) : Promise.resolve([])),
    enabled: Boolean(participantA),
  });

  const { data: drewResponses = [] } = useQuery({
    queryKey: ["responses-coach-person-b", activeRelationshipId, participantB],
    queryFn: () => (participantB ? api.entities.QuestionnaireResponse.filter({ person_name: participantB }) : Promise.resolve([])),
    enabled: Boolean(participantB),
  });

  const { legacySlots } = buildParticipantData(
    participants,
    profiles,
    tonyResponses,
    drewResponses,
  );

  const safePastSessions = useMemo(
    () =>
      pastSessions
        .filter((entry) => isTextVisibleForRelationshipContext(buildCoachEntryText(entry), hiddenParticipantNames, activeRelationship))
        .map((entry) => sanitizeCoachEntry(entry, activeParticipants, activeRelationship))
        .filter((entry) => isTextVisibleForRelationshipContext(buildCoachEntryText(entry), hiddenParticipantNames, activeRelationship)),
    [pastSessions, hiddenParticipantNames, activeRelationship, activeParticipants],
  );

  const safeRecentCheckIns = useMemo(
    () =>
      recentCheckIns
        .filter((entry) => isTextVisibleForRelationshipContext(buildCoachEntryText(entry), hiddenParticipantNames, activeRelationship))
        .map((entry) => sanitizeCoachEntry(entry, activeParticipants, activeRelationship))
        .filter((entry) => isTextVisibleForRelationshipContext(buildCoachEntryText(entry), hiddenParticipantNames, activeRelationship)),
    [recentCheckIns, hiddenParticipantNames, activeRelationship, activeParticipants],
  );

  // Sync data to global state
  useEffect(() => {
    globalState.setState({
      tony: legacySlots.tony,
      drew: legacySlots.drew,
      tonyResponses: legacySlots.tonyResponses,
      drewResponses: legacySlots.drewResponses,
      triggers,
      checkIns: safeRecentCheckIns,
      coachSessions: safePastSessions,
    });
  }, [legacySlots, triggers, safeRecentCheckIns, safePastSessions]);

  const speakerProfile = profiles.find((p) => p.person_name === currentSpeaker);
  const targetProfile = profiles.find((p) => p.person_name === currentSpeakingTo);
  const speakerResponses = currentSpeaker === participantA ? tonyResponses : drewResponses;
  const targetResponses = currentSpeakingTo === participantA ? tonyResponses : drewResponses;
  const terms = getRelationshipTerms(activeRelationship);

  const runCoachCall = async (situationText, overrides = {}) => {
    setError(null);
    setPipelineTrace(null);
    const normalizedParticipants = activeParticipants;
    const requestedSpeaker =
      overrides.speakerOverride ??
      currentSpeaker ??
      speaker;
    const requestedTarget =
      overrides.speakingToOverride ??
      currentSpeakingTo ??
      speakingTo;
    const repairedSelection = resolveCoachTarget(requestedSpeaker, requestedTarget, normalizedParticipants);
    const normalizedSpeaker = repairedSelection.speaker;
    const resolvedTarget = repairedSelection.speakingTo;

    if (normalizedSpeaker !== speaker) setSpeaker(normalizedSpeaker);
    if (resolvedTarget !== speakingTo) setSpeakingTo(resolvedTarget);

    try {
      if (normalizedParticipants.length < 2) {
        throw new Error(`We need both people in this ${terms.bond} before AI Coach can generate guidance.`);
      }
      if (!normalizedSpeaker || !resolvedTarget) {
        throw new Error("Please choose both people in this connection before asking AI Coach for guidance.");
      }
      if (normalizedSpeaker === resolvedTarget) {
        throw new Error(`The speaker and ${terms.counterpart} cannot be the same person.`);
      }
      validateInput({
        speaker: String(normalizedSpeaker),
        speakingTo: String(resolvedTarget),
        situation: situationText,
      });
    } catch (err) {
      const fallback = handleError(err, ERROR_TYPES.INVALID_INPUT);
      if (err instanceof Error && err.message) {
        fallback.message = err.message;
      }
      setError(fallback);
      return;
    }

    if (!normalizedSpeaker || !resolvedTarget || !situationText.trim()) return;

    setLoading(true);
    setResponse(null);
    setBaseResponse(null);
    setPredictiveOutput(null);
    setCreditError(false);

    try {
      const pipelineResult = await pipelineEngine.executePipeline({
        speaker: normalizedSpeaker,
        speakingTo: resolvedTarget,
        situation: situationText,
      });

      if (pipelineResult?.trace) {
        setPipelineTrace(pipelineResult.trace);
      }
      if (pipelineResult?.error) {
        console.warn("[Coach] deterministic pipeline error", pipelineResult.error);
      }
    } catch (err) {
      console.warn("[Coach] continuing without deterministic pipeline", err);
    }

    const triggerCtx = [
      serializeTriggers(triggers, normalizedSpeaker),
      serializeTriggers(triggers, resolvedTarget),
    ]
      .filter(Boolean)
      .join("\n\n");

    const prompt = buildCoachPrompt({
      speaker: normalizedSpeaker,
      speakingTo: resolvedTarget,
      situation: situationText,
      speakerProfile: profiles.find((p) => p.person_name === normalizedSpeaker),
      targetProfile: profiles.find((p) => p.person_name === resolvedTarget),
      speakerResponses: normalizedSpeaker === activeParticipants[0] ? tonyResponses : drewResponses,
      targetResponses: resolvedTarget === activeParticipants[0] ? tonyResponses : drewResponses,
      pastSessions: safePastSessions
        .filter((s) => s.speaker === normalizedSpeaker || s.speaking_to === normalizedSpeaker)
        .slice(0, 10),
    }) + (triggerCtx ? `\n\nTRIGGER MEMORY:\n${triggerCtx}` : "");

    const scopeContext = buildActiveConnectionContext({
      pairId: activeRelationshipId,
      activeConnectionId: activeRelationshipId,
      activeRelationship,
      actorUser: normalizedSpeaker,
      targetUser: resolvedTarget,
      allowedPeople: activeParticipants,
      forbiddenPeople: hiddenParticipantNames,
      availableDataSources: [
        speakerProfile ? "speakerProfile" : "",
        targetProfile ? "targetProfile" : "",
        speakerResponses.length ? "speakerResponses" : "",
        targetResponses.length ? "targetResponses" : "",
        safePastSessions.length ? "coachSessions" : "",
      ].filter(Boolean),
    });

    if ((scopeContext.availableDataSources || []).length === 0) {
      setLoading(false);
      setResponse("Not enough information is available for this connection yet.");
      setBaseResponse("Not enough information is available for this connection yet.");
      setCoachModes(deriveCoachModes("Not enough information is available for this connection yet."));
      return;
    }

    const scopedPrompt = `${buildActiveConnectionContextBlock(scopeContext)}\n\n${prompt}`;

    let result;
    try {
      result = await safeInvokeLLM(
        {
          prompt: scopedPrompt,
          model: "claude_sonnet_4_6",
          partnerLanguage: { personName: normalizedSpeaker, partnerName: resolvedTarget },
        },
        35000,
        null,
        validateCoachOutput
      );
    } catch (err) {
      if (err instanceof CreditLimitError) {
        setCreditError(true);
        setLoading(false);
        return;
      }
      throw err;
    }

    if (!result) {
      result = buildFallbackCoachResponse(normalizedSpeaker, resolvedTarget, situationText);
    }

    let validation = validateOutputScope(result, scopeContext);
    if (!validation.ok) {
      const strictRetry = await safeInvokeLLM(
        {
          prompt: `${scopedPrompt}\n\nSTRICT REGENERATION RULES:\nA prior output was rejected for: ${validation.violations.join(", ")}.\nOnly mention allowedPeople and follow relationshipStatus language rules exactly.`,
          model: "claude_sonnet_4_6",
          partnerLanguage: { personName: normalizedSpeaker, partnerName: resolvedTarget },
        },
        35000,
        null,
        validateCoachOutput
      );
      validation = validateOutputScope(strictRetry, scopeContext);
      if (validation.ok) {
        result = strictRetry;
      } else {
        result = "This response could not be safely generated for the active connection. Please try again.";
      }
    }

    // ENFORCE STRUCTURE
    const structuredOutput = enforceCoachStructure(result, situationText);
    const modes = deriveCoachModes(structuredOutput);

    // Save session with structured output
    const session = await api.entities.CoachSession.create({
      speaker: normalizedSpeaker,
      speaking_to: resolvedTarget,
      situation: situationText,
      ai_response: modes.full, // Store full mode by default
      tool_type: "coach",
    });
    setSessionId(session?.id || null);

    setBaseResponse(result);
    setCoachModes(modes);
    setResponse(modes.full);
    setOutputMode("full");
    setLoading(false);
    queryClient.invalidateQueries({ queryKey: ["coach-sessions", activeRelationshipId] });
  };

  const handleSuggestionPill = (pillId) => {
    setSelectedPill(pillId);

    // Convert pill to situation text
    const situationMap = {
      handling_conflict: `We're having or heading into a conflict. I need help navigating this conversation and knowing how to approach it.`,
      repair_after_tension: `We had tension/conflict and now I need to repair. Help me know what to say and how to reconnect.`,
      feel_misunderstood: `I feel like ${currentSpeakingTo} isn't really understanding me. I feel misheard or dismissed.`,
      they_feel_distant: `${currentSpeakingTo} seems distant or withdrawn. I'm concerned and don't know how to reconnect.`,
      something_felt_off: `Something felt off in our interaction but I can't quite place what. Help me understand what might have happened.`,
      say_this_better: `I want to say something but I'm worried it will come out wrong. Help me phrase it in a way that won't trigger them.`,
      overwhelmed_triggered: `I'm feeling overwhelmed or triggered right now. Help me understand what's happening and how to navigate this state.`,
      repeating_pattern: `We keep repeating the same conflict or miscommunication. Help me understand the pattern and how to break it.`,
    };

    const text = situationMap[pillId];
    setSituation(text);
    setTimeout(
      () =>
        runCoachCall(text, {
          speakerOverride: currentSpeaker,
          speakingToOverride: currentSpeakingTo,
        }),
      100,
    );
  };

  const handleModeSwitch = (mode) => {
    setOutputMode(mode);
    if (coachModes?.[mode]) {
      setResponse(coachModes[mode]);
      return;
    }
    // Legacy fallback for older stored sessions
    if (baseResponse) {
      const structuredOutput = enforceCoachStructure(baseResponse);
      const modes = deriveCoachModes(structuredOutput);
      setCoachModes(modes);
      setResponse(modes[mode] || modes.full);
    }
  };

  const handleCopyResponse = () => {
    if (!response) return;
    navigator.clipboard.writeText(response);
    toast.success("Response copied to clipboard");
  };

  const loadSessionIntoComposer = (session) => {
    const cleanedSituation = cleanSituationText(session.situation);
    const repairedSelection = resolveCoachTarget(session.speaker, session.speaking_to, activeParticipants);
    setSpeaker(repairedSelection.speaker);
    setSpeakingTo(repairedSelection.speakingTo);
    setSituation(cleanedSituation);
    const structured = enforceCoachStructure(session.ai_response, cleanedSituation);
    const modes = deriveCoachModes(structured);
    setBaseResponse(session.ai_response);
    setCoachModes(modes);
    setOutputMode("full");
    setResponse(modes.full);
    setEditingSessionId(session.id);
    setSessionId(session.id);
  };

  const handleDeleteSession = async (targetId) => {
    await api.entities.CoachSession.delete(targetId);
    if (editingSessionId === targetId || sessionId === targetId) {
      setEditingSessionId(null);
      setSessionId(null);
    }
    queryClient.invalidateQueries({ queryKey: ["coach-sessions", activeRelationshipId] });
    toast.success("Conversation deleted");
  };

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-3 pt-4"
      >
        <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
          Start a Conversation
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Get context-aware guidance based on your {terms.bond} patterns, emotional dynamics, and real situations.
        </p>
      </motion.div>

      <PrivacyBanner />

      {creditError && <CreditLimitBanner />}

      {error && (
        <ErrorFallback error={error} onRetry={() => setError(null)} />
      )}

      {/* Input Section */}
      <Card className="enterprise-panel border-2">
        <CardContent className="p-6 space-y-4">
          {/* Directional Mode */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              This is me → I'm speaking to
            </p>
            <div className="flex gap-2 flex-wrap">
              {activeParticipants.map((person) => (
                <Button
                  key={person}
                  variant={currentSpeaker === person ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setSpeaker(person);
                    setSpeakingTo(getPartnerName(person, activeParticipants));
                  }}
                  className="text-xs"
                >
                  {person}
                </Button>
              ))}
              {currentSpeaker && (
                <>
                  <span className="text-xs text-muted-foreground px-2">→</span>
                  {activeParticipants.map((person) => {
                    if (person === currentSpeaker) return null;
                    return (
                      <Button
                        key={person}
                        variant={currentSpeakingTo === person ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSpeakingTo(person)}
                        className="text-xs"
                      >
                        {person}
                      </Button>
                    );
                  })}
                </>
              )}
            </div>
            {activeParticipants.length < 2 && (
              <p className="text-xs text-amber-700">
                We need both people in this {terms.bond} before AI Coach can tailor guidance correctly.
              </p>
            )}
          </div>

          {/* Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">What do you need help with right now?</label>
            <Textarea
              placeholder="Describe the situation, feeling, or conversation you need guidance on..."
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              className="min-h-[90px] resize-none bg-background/50 text-sm"
            />
          </div>

          {/* Suggestion Pills */}
          {currentSpeaker && currentSpeakingTo && situation.length < 10 && (
            <CoachSuggestionPills pills={SUGGESTION_PILLS} onSelect={handleSuggestionPill} loading={loading} />
          )}

          {/* Submit Button */}
          <Button
            onClick={() =>
              runCoachCall(situation, {
                speakerOverride: currentSpeaker,
                speakingToOverride: currentSpeakingTo,
              })
            }
            disabled={loading || !canSubmitCoach}
            className="w-full sm:w-auto gap-2"
            size="lg"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "Analyzing..." : "Get Guidance"}
          </Button>
        </CardContent>
      </Card>

      <AILoadingState active={loading} mode="coach" />

      {/* Response Section */}
      <AnimatePresence>
        {response && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Output Mode Selector */}
            <CoachOutputModes mode={outputMode} onModeChange={handleModeSwitch} />

            {/* Main Response */}
            <Card className="bg-card border border-primary/15" ref={responseRef}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Guidance for {currentSpeaker} → {currentSpeakingTo}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary">
                  <ReactMarkdown>{response}</ReactMarkdown>
                </div>

                {/* Data Source Badge */}
                <div className="pt-3 border-t border-border/40 space-y-3">
                  <DataSourceBadge
                    sources={[
                      { label: "profile fields", count: speakerProfile ? 8 : 0 },
                      { label: "questionnaire answers", count: speakerResponses.length + targetResponses.length },
                      { label: "past sessions", count: safePastSessions.filter((s) => s.tool_type === "coach").length },
                    ]}
                  />
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="ghost" onClick={handleCopyResponse} className="gap-1.5">
                      <Copy className="w-3.5 h-3.5" />
                      Copy Response
                    </Button>
                    <ResponseExportBar
                      contentRef={responseRef}
                      content={response}
                      filename={`coach-guidance-${currentSpeaker}-${currentSpeakingTo}.pdf`}
                      title={`Guidance: ${currentSpeaker} → ${currentSpeakingTo}`}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes Panel */}
            <NotesPanel
              section="coach"
              relatedItemId={sessionId}
              personName={currentSpeaker}
            />

            {/* Predictive Outcomes */}
            {baseResponse && (
              <PredictiveOutcomeBlock
                speaker={currentSpeaker}
                speakingTo={currentSpeakingTo}
                situation={situation}
                speakerProfile={speakerProfile}
                targetProfile={targetProfile}
              />
            )}

            {/* Trace Panel */}
            {pipelineTrace && (
              <TracePanel
                trace={pipelineTrace}
                metadata={{
                  perspective: `${currentSpeaker}→${currentSpeakingTo}`,
                  patterns: speakerProfile?.trait_weights || {},
                  frameworks: ["EFT", "GOTTMAN", "CBT"],
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recent Sessions */}
      {safePastSessions.filter((s) => s.tool_type === "coach").length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold">Recent Conversations</h2>
          <div className="space-y-3">
            {safePastSessions
              .filter((s) => s.tool_type === "coach")
              .slice(0, 8)
              .map((session) => {
                const summary = summarizeCoachSession(session);
                return (
                  <Card
                    key={session.id}
                    className="cursor-pointer border-2 border-primary/15 bg-white transition-all hover:border-primary/30 hover:shadow-sm"
                    onClick={() => loadSessionIntoComposer(session)}
                  >
                    <CardContent className="p-4 flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-[#eef7f8]">
                        <MessageCircle className="w-4 h-4 text-[#0e6f72]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <p className="text-sm font-semibold text-foreground">{summary.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {session.speaker} → {session.speaking_to}
                          </p>
                          <span className="hidden text-muted-foreground/40 sm:inline">•</span>
                          <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock3 className="h-3 w-3" />
                            {new Date(session.created_date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <p className="mt-1 text-sm text-[#14263f]">
                          {summary.description}
                        </p>
                      </div>
                      <div className="ml-auto flex shrink-0 items-center gap-1">
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 rounded-full border border-[#0e6f72]/15 bg-[#eef8f7] text-[#0e6f72] hover:bg-[#d9f4f1]"
                          onClick={(event) => {
                            event.stopPropagation();
                            loadSessionIntoComposer(session);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="delete-action-button h-8 w-8 rounded-full border border-[#c03b3b]/15 bg-[#fff6f6]"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteSession(session.id);
                          }}
                        >
                          <Trash2 className="delete-action-icon h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </div>
      )}
    </div>
  );
}
