import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  PLAY_LAB_MODULES,
  assignSideQuest,
  buildPlayLabExportContent,
  createPlayLabSession,
  elaboratePlayLabResult,
  evaluatePlayLab,
  explainPlayLabResult,
  exportPlayLabSummary,
  fetchAhaCards,
  fetchPlayLabHistory,
  fetchSideQuests,
  generateAhaCard,
  generateRepairPlan,
  getPlayLabModule,
  logPlayLabOutcome,
  refreshPlayLabPrompt,
  submitPlayLabAnswer,
} from "@/lib/playLabService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import ResponseExportBar from "@/components/export/ResponseExportBar";
import {
  Gamepad2,
  Sparkles,
  Brain,
  HeartHandshake,
  Waves,
  SearchCheck,
  MapPinned,
  ArrowRightLeft,
  Trophy,
  Loader2,
  WandSparkles,
  Lightbulb,
  Copy,
  ArrowUpRight,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
} from "lucide-react";
import { useRelationshipAuth } from "@/context/RelationshipAuthContext";
import { getPartnerName, getRelationshipTerms } from "@/lib/relationshipParticipants";

const MODULE_ICONS = {
  guess_my_inner_world: Brain,
  repair_quest: HeartHandshake,
  stress_decoder: Waves,
  two_truths_and_a_misread: SearchCheck,
  aha_cards: Sparkles,
  side_quest: Trophy,
  love_map_sprint: MapPinned,
};

const DEFAULT_FORM = {
  actualAnswer: "",
  guessedAnswer: "",
  answerConfidence: 3,
  guessConfidence: 3,
  currentNeed: "",
  currentNeedType: "",
  predictedNeed: "",
  predictedNeedType: "",
  stressSource: "",
  situation: "",
  unresolved: "",
  unresolvedTag: "",
  emotionalState: "",
  selectedMisread: "",
  selectedMisreadWhy: "",
  ahaAccurate: "",
  ahaNote: "",
};

const NEED_OPTIONS = [
  "Listening",
  "Affection",
  "Reassurance",
  "Space",
  "Help Solving",
  "Check In Later",
  "One Concrete Task",
  "Distraction / Lightness",
];

const EMOTION_OPTIONS = ["Frustrated", "Hurt", "Overwhelmed", "Dismissed", "Anxious", "Disconnected"];

const UNRESOLVED_TAG_OPTIONS = ["Unheard", "No Follow-Through", "Harsh Tone", "Shutdown", "Distance", "Mismatched Repair"];

const MISREAD_OPTIONS = [
  "Silence meant indifference",
  "Questions meant criticism",
  "Withdrawal meant rejection",
  "Intensity meant lack of care",
];

function SoftMetric({ label, value, helper }) {
  return (
    <div className="enterprise-panel-muted rounded-2xl border border-[#0e6f72]/15 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0e6f72]/80">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold text-[#14263f]">{value}</p>
      {helper ? <p className="mt-2 text-sm text-[#5c6b80]">{helper}</p> : null}
    </div>
  );
}

function ModuleCard({ module, active, onSelect }) {
  const Icon = MODULE_ICONS[module.id] || Gamepad2;
  return (
    <button
      type="button"
      onClick={() => onSelect(module.id)}
      className={`rounded-[1.5rem] border px-4 py-4 text-left transition-all ${
        active
          ? "border-[#0e6f72]/45 bg-[#eef8f7] shadow-[0_14px_32px_rgba(20,38,63,0.08)]"
          : "border-border/70 bg-white hover:-translate-y-0.5 hover:border-[#0e6f72]/30 hover:shadow-[0_14px_32px_rgba(20,38,63,0.08)]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#0e6f72]/20 bg-[#eef8f7]">
            <Icon className="h-5 w-5 text-[#0e6f72]" />
          </div>
          <div className="min-w-0">
            <p className="text-base font-semibold text-[#14263f]">{module.title}</p>
            <p className="mt-1.5 text-[15px] leading-6 text-[#4e6077]">{module.teaserDescription || module.shortDescription}</p>
          </div>
        </div>
        <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-[#0e6f72]" />
      </div>
    </button>
  );
}

function CollapsiblePanel({ title, icon: Icon, description, open, onToggle, children, defaultOpen = false }) {
  const isOpen = open ?? defaultOpen;
  return (
    <div className="rounded-[1.35rem] border border-[#0e6f72]/18 bg-white">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left"
      >
        <div className="flex min-w-0 items-start gap-3">
          {Icon ? (
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#0e6f72]/18 bg-[#eef8f7]">
              <Icon className="h-4.5 w-4.5 text-[#0e6f72]" />
            </div>
          ) : null}
          <div className="min-w-0">
            <p className="text-xl font-semibold text-[#14263f]">{title}</p>
            {description ? <p className="mt-1.5 text-[15px] leading-6 text-[#4e6077]">{description}</p> : null}
          </div>
        </div>
        <ChevronDown className={`mt-1 h-5 w-5 shrink-0 text-[#0e6f72] transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen ? <div className="border-t border-[#0e6f72]/12 px-4 pb-4">{children}</div> : null}
    </div>
  );
}

function ResultSectionCard({ title, body, onSummarize, summary, loading }) {
  return (
    <div className="rounded-[1.35rem] border border-[#0e6f72]/18 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0e6f72]/85">{title}</p>
        {onSummarize ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSummarize}
            disabled={loading}
            className="rounded-full border-[#0e6f72]/35 bg-[#eef8f7] text-[#14263f] hover:bg-[#d8f2ef]"
          >
            {loading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <WandSparkles className="mr-2 h-3.5 w-3.5 text-[#0e6f72]" />}
            Summarize
          </Button>
        ) : null}
      </div>
      <p className="mt-2.5 text-[15px] leading-6 text-[#22324a]">{body}</p>
      {summary ? (
        <div className="mt-4 rounded-2xl border border-[#0e6f72]/18 bg-[#f6fbfb] p-4 text-sm leading-6 text-[#415065]">
          {summary}
        </div>
      ) : null}
    </div>
  );
}

function HistoryCard({ session, result }) {
  const title = result?.moduleLabel || session?.module_label || "Play Lab Session";
  const summary = result?.ai_summary || result?.summary || session?.prompt_text || "Recent Play Lab activity.";
  return (
    <div className="rounded-[1.35rem] border border-[#0e6f72]/14 bg-white p-4 shadow-[0_12px_24px_rgba(15,23,42,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <p className="font-semibold text-[#14263f]">{title}</p>
        <p className="text-xs text-[#6b7b91]">{new Date(session?.updated_date || result?.updated_date || Date.now()).toLocaleDateString()}</p>
      </div>
      <p className="mt-2 text-sm leading-6 text-[#4e6077]">{summary}</p>
    </div>
  );
}

function OptionChips({ options, value, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = value === option;
        return (
          <Button
            key={option}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onSelect(active ? "" : option)}
            className={`rounded-full ${
              active
                ? "border-[#0e6f72]/40 bg-[#eef8f7] text-[#14263f]"
                : "border-[#0e6f72]/20 bg-white text-[#4e6077] hover:bg-[#eef8f7]"
            }`}
          >
            {option}
          </Button>
        );
      })}
    </div>
  );
}

export default function PlayLab() {
  const { activeRelationshipId, activeRelationship, participants, relationshipLabel } = useRelationshipAuth();
  const queryClient = useQueryClient();
  const [moduleType, setModuleType] = useState("guess_my_inner_world");
  const [scope, setScope] = useState("Tony+Drew");
  const [initiatedBy, setInitiatedBy] = useState(participants[0]);
  const [answeringPerson, setAnsweringPerson] = useState(participants[0]);
  const [session, setSession] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [result, setResult] = useState(null);
  const [ahaCard, setAhaCard] = useState(null);
  const [explainText, setExplainText] = useState("");
  const [elaborateText, setElaborateText] = useState("");
  const [sectionSummary, setSectionSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [outcomeSubmitting, setOutcomeSubmitting] = useState(false);
  const [refreshingPrompt, setRefreshingPrompt] = useState(false);
  const [selectedRepairAction, setSelectedRepairAction] = useState("");
  const [moduleWorkspaceOpen, setModuleWorkspaceOpen] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [recentAhaOpen, setRecentAhaOpen] = useState(false);
  const [sideQuestOpen, setSideQuestOpen] = useState(false);
  const [resultOpen, setResultOpen] = useState(true);
  const [outcomeOpen, setOutcomeOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [systemImpactOpen, setSystemImpactOpen] = useState(false);
  const lastSavedRef = useRef({});
  const [outcomeForm, setOutcomeForm] = useState({
    attempted: true,
    helped: true,
    tensionChange: 1,
    connectionChange: 1,
    feltNatural: true,
    notes: "",
  });
  useEffect(() => {
    setInitiatedBy((current) => (participants.includes(current) ? current : participants[0]));
    setAnsweringPerson((current) => (participants.includes(current) ? current : participants[0]));
  }, [participants]);

  const activeModule = getPlayLabModule(moduleType);
  const terms = getRelationshipTerms(activeRelationship);

  const { data: historyData = { sessions: [], results: [] }, refetch: refetchHistory } = useQuery({
    queryKey: ["play-lab-history", activeRelationshipId, scope],
    queryFn: () => fetchPlayLabHistory({ scope, limit: 16 }),
  });

  const { data: ahaData = { cards: [] }, refetch: refetchAha } = useQuery({
    queryKey: ["play-lab-aha-cards", activeRelationshipId, scope],
    queryFn: () => fetchAhaCards({ scope }),
  });

  const { data: questData = { quests: [] }, refetch: refetchQuests } = useQuery({
    queryKey: ["play-lab-side-quests", activeRelationshipId, scope],
    queryFn: () => fetchSideQuests({ scope }),
  });

  const recentSessions = historyData.sessions || [];
  const recentResults = historyData.results || [];
  const recentAhaCards = ahaData.cards || [];
  const recentSideQuests = questData.quests || [];

  const participationStats = useMemo(() => {
    const completed = recentSessions.filter((item) => item.status === "completed").length;
    const ahaUnlocked = recentAhaCards.length;
    const sideQuestCount = recentSideQuests.length;
    return { completed, ahaUnlocked, sideQuestCount };
  }, [recentSessions, recentAhaCards, recentSideQuests]);

  const refreshAll = async () => {
    await Promise.all([refetchHistory(), refetchAha(), refetchQuests()]);
  };

  const resetRun = () => {
    setSession(null);
    setResult(null);
    setAhaCard(null);
    setExplainText("");
    setElaborateText("");
    setSectionSummary({});
    setSelectedRepairAction("");
    setForm(DEFAULT_FORM);
    setResultOpen(true);
    setOutcomeOpen(false);
  };

  const selectModule = (nextModule) => {
    setModuleType((current) => {
      if (current === nextModule) {
        setModuleWorkspaceOpen((open) => !open);
        return current;
      }
      return nextModule;
    });
    if (moduleType !== nextModule) {
      setModuleWorkspaceOpen(true);
      setHowItWorksOpen(false);
      setResultOpen(true);
      setOutcomeOpen(false);
      resetRun();
    }
  };

  const ensureSession = async () => {
    if (session?.id) return session;
    const created = await createPlayLabSession({
      moduleType,
      scope,
      initiatedBy,
      answeringPerson,
      createdFrom: "play_lab_page",
    });
    setSession(created.session);
    return created.session;
  };

  const buildResponsesFromForm = () => {
    const otherPerson = getPartnerName(answeringPerson, participants);
    switch (moduleType) {
      case "guess_my_inner_world":
      case "love_map_sprint":
        return [
          {
            responseType: "actual_answer",
            responseLabel: `${answeringPerson} answer`,
            responseValue: form.actualAnswer,
            userId: answeringPerson,
            roleInSession: "answerer",
            confidence: Number(form.answerConfidence || 3),
            tags: ["answer", "inner_world"],
          },
          {
            responseType: "guessed_answer",
            responseLabel: `${otherPerson} guess`,
            responseValue: form.guessedAnswer,
            userId: otherPerson,
            roleInSession: "guesser",
            confidence: Number(form.guessConfidence || 3),
            tags: ["guess", "match_attempt"],
          },
        ];
      case "repair_quest":
        return [
          {
            responseType: "situation",
            responseLabel: "What happened",
            responseValue: form.situation,
            userId: initiatedBy,
            roleInSession: "participant",
            tags: ["repair", "conflict_context"],
          },
          {
            responseType: "unresolved",
            responseLabel: "What still feels unresolved",
            responseValue: form.unresolved,
            userId: initiatedBy,
            roleInSession: "participant",
            tags: ["repair", form.unresolvedTag || "", form.emotionalState || ""].filter(Boolean),
            metadata: { unresolvedTag: form.unresolvedTag, emotionalState: form.emotionalState },
          },
        ];
      case "stress_decoder":
        return [
          {
            responseType: "stress_source",
            responseLabel: "Stress source",
            responseValue: form.stressSource,
            userId: answeringPerson,
            roleInSession: "answerer",
            tags: ["stress_source"],
          },
          {
            responseType: "actual_need",
            responseLabel: "What is actually needed",
            responseValue: form.currentNeed || form.currentNeedType,
            userId: answeringPerson,
            roleInSession: "answerer",
            tags: ["support_need", form.currentNeedType].filter(Boolean),
            metadata: { needType: form.currentNeedType },
          },
          {
            responseType: "guessed_need",
            responseLabel: `What the other ${terms.counterpart} predicts is needed`,
            responseValue: form.predictedNeed || form.predictedNeedType,
            userId: otherPerson,
            roleInSession: "guesser",
            tags: ["support_guess", form.predictedNeedType].filter(Boolean),
            metadata: { needType: form.predictedNeedType },
          },
        ];
      case "two_truths_and_a_misread":
        return [
          {
            responseType: "selected_misread",
            responseLabel: "Selected likely misread",
            responseValue: form.selectedMisread,
            userId: initiatedBy,
            roleInSession: "participant",
            tags: ["misread_selection"],
          },
          {
            responseType: "why_selected",
            responseLabel: "Why this was chosen",
            responseValue: form.selectedMisreadWhy,
            userId: initiatedBy,
            roleInSession: "participant",
            tags: ["misread_reason"],
          },
        ];
      case "aha_cards":
        return [
          {
            responseType: "accuracy_check",
            responseLabel: "Does this feel accurate",
            responseValue: form.ahaAccurate,
            userId: initiatedBy,
            roleInSession: "participant",
            tags: ["aha_feedback"],
          },
          {
            responseType: "reflection_note",
            responseLabel: "Reflection note",
            responseValue: form.ahaNote,
            userId: initiatedBy,
            roleInSession: "participant",
            tags: ["aha_reflection"],
          },
        ];
      default:
        return [];
    }
  };

  const persistStructuredInputs = async (activeSession) => {
    const responses = buildResponsesFromForm();
    for (const response of responses) {
      const value = String(response.responseValue || "").trim();
      if (!value) continue;
      const cacheKey = `${activeSession.id}:${response.responseType}:${response.userId}`;
      const fingerprint = JSON.stringify({
        value,
        confidence: response.confidence ?? null,
        tags: response.tags || [],
        metadata: response.metadata || null,
      });
      if (lastSavedRef.current[cacheKey] === fingerprint) continue;
      await submitPlayLabAnswer({
        sessionId: activeSession.id,
        ...response,
        responseValue: value,
      });
      lastSavedRef.current[cacheKey] = fingerprint;
    }
  };

  const hasAnyInput = useMemo(() => {
    switch (moduleType) {
      case "guess_my_inner_world":
      case "love_map_sprint":
        return Boolean(form.actualAnswer.trim() || form.guessedAnswer.trim());
      case "repair_quest":
        return Boolean(form.situation.trim() || form.unresolved.trim() || form.unresolvedTag || form.emotionalState);
      case "stress_decoder":
        return Boolean(
          form.stressSource.trim() ||
          form.currentNeed.trim() ||
          form.currentNeedType ||
          form.predictedNeed.trim() ||
          form.predictedNeedType,
        );
      case "two_truths_and_a_misread":
        return Boolean(form.selectedMisread || form.selectedMisreadWhy.trim());
      case "aha_cards":
        return Boolean(form.ahaAccurate || form.ahaNote.trim());
      default:
        return false;
    }
  }, [form, moduleType]);

  useEffect(() => {
    if (!hasAnyInput) return;
    const timeout = window.setTimeout(async () => {
      try {
        const activeSession = await ensureSession();
        await persistStructuredInputs(activeSession);
      } catch (error) {
        console.error(error);
      }
    }, 500);

    return () => window.clearTimeout(timeout);
  }, [form, hasAnyInput, moduleType, scope, initiatedBy, answeringPerson, participants]);

  const handleRunModule = async () => {
    setLoading(true);
    try {
      const activeSession = await ensureSession();
      await persistStructuredInputs(activeSession);

      let payload;
      if (moduleType === "side_quest") {
        const assigned = await assignSideQuest({
          scope,
          userId: initiatedBy,
          focusTags: recentResults.slice(0, 3).flatMap((item) => item.inferred_tags || []),
        });
        setResult({
          moduleLabel: activeModule.title,
          scope,
          summary: assigned.sideQuest.why_chosen,
          interpretation: assigned.sideQuest.description,
          sections: [
            { title: "Why This Was Chosen", body: assigned.sideQuest.why_chosen },
            { title: "What Success Looks Like", body: assigned.sideQuest.success_definition },
          ],
          suggestedAction: {
            title: assigned.sideQuest.title,
            description: assigned.sideQuest.description,
            backups: [],
          },
          context_object: assigned.sideQuest.context_object,
          id: assigned.sideQuest.id,
        });
        setAhaCard(null);
        await refreshAll();
        return;
      }

      if (moduleType === "aha_cards") {
        const created = await generateAhaCard({
          scope,
          relatedSessionId: activeSession.id,
          savedByUser: initiatedBy,
          title: "Aha unlocked",
        });
        setAhaCard(created.ahaCard);
        setResult({
          moduleLabel: activeModule.title,
          scope,
          summary: created.ahaCard.body,
          interpretation: created.ahaCard.body,
          sections: [
            { title: "Aha Card", body: created.ahaCard.body },
          ],
          suggestedAction: {
            title: "Use This In Real Life",
            description: "Reuse this line inside AI Coach, a repair moment, or a weekly check-in.",
            backups: [],
          },
          id: created.ahaCard.id,
        });
        await refreshAll();
        return;
      }

      payload = {
        sessionId: activeSession.id,
        moduleType,
        scope,
        initiatedBy,
        promptText: activeSession.prompt_text,
        actualAnswer: form.actualAnswer,
        guessedAnswer: form.guessedAnswer,
        currentNeed: form.currentNeed,
        currentNeedType: form.currentNeedType,
        predictedNeed: form.predictedNeed,
        predictedNeedType: form.predictedNeedType,
        stressSource: form.stressSource,
        situation: form.situation,
        unresolved: form.unresolved,
        unresolvedTag: form.unresolvedTag,
        emotionalState: form.emotionalState,
        selectedMisread: form.selectedMisread,
        selectedMisreadWhy: form.selectedMisreadWhy,
        answerConfidence: form.answerConfidence,
        guessConfidence: form.guessConfidence,
      };

      const evaluated =
        moduleType === "repair_quest"
          ? await generateRepairPlan(payload)
          : await evaluatePlayLab(payload);

      setResult(evaluated.result);
      setAhaCard(evaluated.ahaCard || null);
      await refreshAll();
    } catch (error) {
      toast.error("Unable to run Play Lab right now.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionSummary = async (section) => {
    if (!result?.context_object) return;
    const cacheKey = section.title;
    setSectionSummary((current) => ({ ...current, [cacheKey]: "loading" }));
    try {
      const explained = await explainPlayLabResult({
        resultId: result.id,
        contextObject: {
          ...result.context_object,
          originalOutput: {
            ...result,
            sections: [section],
            summary: section.body,
          },
        },
      });
      setSectionSummary((current) => ({ ...current, [cacheKey]: explained.text || "" }));
    } catch (error) {
      console.error(error);
      setSectionSummary((current) => ({ ...current, [cacheKey]: "Unable to summarize this section right now." }));
    }
  };

  const handleExplain = async () => {
    if (!result?.context_object) return;
    try {
      const response = await explainPlayLabResult({
        resultId: result.id,
        contextObject: result.context_object,
      });
      setExplainText(response.text || "");
    } catch (error) {
      console.error(error);
      toast.error("Unable to explain this result right now.");
    }
  };

  const handleElaborate = async () => {
    if (!result?.context_object) return;
    try {
      const response = await elaboratePlayLabResult({
        resultId: result.id,
        contextObject: result.context_object,
      });
      setElaborateText(response.text || "");
    } catch (error) {
      console.error(error);
      toast.error("Unable to elaborate on this result right now.");
    }
  };

  const handleCopy = async () => {
    try {
      const exportPayload = result?.context_object
        ? await exportPlayLabSummary({ resultId: result?.id, contextObject: result.context_object })
        : null;
      await navigator.clipboard.writeText(exportPayload?.text || result?.summary || "");
      toast.success("Play Lab result copied");
    } catch (error) {
      console.error(error);
      toast.error("Unable to copy this result right now.");
    }
  };

  const handleOutcomeSave = async () => {
    if (!result?.id) return;
    setOutcomeSubmitting(true);
    try {
      await logPlayLabOutcome({
        sourceType: "play_lab",
        relatedId: result.id,
        scope,
        attempted: outcomeForm.attempted,
        helped: outcomeForm.helped,
        tensionChange: outcomeForm.tensionChange,
        connectionChange: outcomeForm.connectionChange,
        feltNatural: outcomeForm.feltNatural,
        notes: outcomeForm.notes,
      });
      toast.success("Outcome saved");
      await queryClient.invalidateQueries({ queryKey: ["play-lab-history", activeRelationshipId] });
    } catch (error) {
      console.error(error);
      toast.error("Unable to save outcome right now.");
    } finally {
      setOutcomeSubmitting(false);
    }
  };

  const handleRefreshPrompt = async () => {
    const hasPartialInput = hasAnyInput && !result;
    if (hasPartialInput) {
      const shouldContinue = window.confirm("You have started this round. Refreshing will start a new prompt and keep the current session history saved. Continue?");
      if (!shouldContinue) return;
    }

    setRefreshingPrompt(true);
    try {
      const refreshed = await refreshPlayLabPrompt({
        moduleType,
        scope,
        initiatedBy,
        answeringPerson,
        currentContextObject: result?.context_object || session?.context_object || null,
        relatedSessionId: session?.id || null,
      });
      setSession(refreshed.session);
      setResult(null);
      setAhaCard(null);
      setExplainText("");
      setElaborateText("");
      setSectionSummary({});
      setForm(DEFAULT_FORM);
      toast.success("New prompt ready");
    } catch (error) {
      console.error(error);
      toast.error("Unable to refresh this module right now.");
    } finally {
      setRefreshingPrompt(false);
    }
  };

  const renderModuleInputs = () => {
    if (moduleType === "repair_quest") {
      return (
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>What happened?</Label>
            <Textarea
              value={form.situation}
              onChange={(event) => setForm((current) => ({ ...current, situation: event.target.value }))}
              className="min-h-28"
              placeholder="Name the moment that still feels tense, unresolved, or unfinished."
            />
          </div>
          <div className="grid gap-2">
            <Label>What still feels unresolved?</Label>
            <Textarea
              value={form.unresolved}
              onChange={(event) => setForm((current) => ({ ...current, unresolved: event.target.value }))}
              className="min-h-24"
              placeholder="What still stings, feels unfinished, or needs repair?"
            />
          </div>
          <div className="grid gap-2">
            <Label>What feels most unresolved?</Label>
            <OptionChips
              options={UNRESOLVED_TAG_OPTIONS}
              value={form.unresolvedTag}
              onSelect={(value) => setForm((current) => ({ ...current, unresolvedTag: value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label>Current emotional state</Label>
            <OptionChips
              options={EMOTION_OPTIONS}
              value={form.emotionalState}
              onSelect={(value) => setForm((current) => ({ ...current, emotionalState: value }))}
            />
          </div>
        </div>
      );
    }

    if (moduleType === "stress_decoder") {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2 md:col-span-2">
            <Label>Stress source</Label>
            <Input
              value={form.stressSource}
              onChange={(event) => setForm((current) => ({ ...current, stressSource: event.target.value }))}
              placeholder="What is the stress coming from right now?"
            />
          </div>
          <div className="grid gap-2">
            <Label>What is actually needed right now?</Label>
            <OptionChips
              options={NEED_OPTIONS}
              value={form.currentNeedType}
              onSelect={(value) => setForm((current) => ({ ...current, currentNeedType: value }))}
            />
            <Textarea
              value={form.currentNeed}
              onChange={(event) => setForm((current) => ({ ...current, currentNeed: event.target.value }))}
              className="min-h-24"
              placeholder="Optional detail: what does that support look like in real life?"
            />
          </div>
          <div className="grid gap-2">
            <Label>{`What does the other ${terms.counterpart} predict is needed?`}</Label>
            <OptionChips
              options={NEED_OPTIONS}
              value={form.predictedNeedType}
              onSelect={(value) => setForm((current) => ({ ...current, predictedNeedType: value }))}
            />
            <Textarea
              value={form.predictedNeed}
              onChange={(event) => setForm((current) => ({ ...current, predictedNeed: event.target.value }))}
              className="min-h-24"
              placeholder="Optional detail: what do you think would land best right now?"
            />
          </div>
        </div>
      );
    }

    if (moduleType === "two_truths_and_a_misread") {
      return (
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Which misread feels most likely?</Label>
            <OptionChips
              options={MISREAD_OPTIONS}
              value={form.selectedMisread}
              onSelect={(value) => setForm((current) => ({ ...current, selectedMisread: value }))}
            />
          </div>
          <div className="grid gap-2">
            <Label>Why did you choose this? (optional)</Label>
            <Input
              value={form.selectedMisreadWhy}
              onChange={(event) => setForm((current) => ({ ...current, selectedMisreadWhy: event.target.value }))}
              placeholder="Optional: what made this feel most likely?"
            />
          </div>
        </div>
      );
    }

    if (moduleType === "side_quest" || moduleType === "aha_cards") {
      return (
        <div className="space-y-4">
          <div className="rounded-[1.35rem] border border-[#0e6f72]/18 bg-[#f6fbfb] p-4 text-[15px] leading-6 text-[#4e6077]">
            {moduleType === "side_quest"
              ? "This module assigns one tiny weekly experiment based on what the app has already learned. Start it and the worker will generate the challenge plus what success looks like."
              : `This module turns stored patterns into a reusable Aha card. Start it and the worker will save a fresh insight card tied to recent ${terms.bond} data.`}
          </div>
          {moduleType === "aha_cards" ? (
            <div className="grid gap-3 rounded-[1.35rem] border border-[#0e6f72]/18 bg-white p-4">
              <div className="grid gap-2">
                <Label>When the card appears, does it feel accurate?</Label>
                <OptionChips
                  options={["Yes", "Partly", "Not yet"]}
                  value={form.ahaAccurate}
                  onSelect={(value) => setForm((current) => ({ ...current, ahaAccurate: value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Add a note (optional)</Label>
                <Textarea
                  value={form.ahaNote}
                  onChange={(event) => setForm((current) => ({ ...current, ahaNote: event.target.value }))}
                  className="min-h-20"
                  placeholder="Optional: what landed, what felt off, or what this reminds you of."
                />
              </div>
            </div>
          ) : null}
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
          <Label>{answeringPerson}'s real answer</Label>
          <Textarea
            value={form.actualAnswer}
            onChange={(event) => setForm((current) => ({ ...current, actualAnswer: event.target.value }))}
            className="min-h-28"
            placeholder={session?.prompt_text || "Start the round to generate a prompt."}
          />
            <div className="grid gap-2">
              <div className="flex items-center justify-between text-xs font-medium text-[#5c6b80]">
                <span>How sure is {answeringPerson} about this answer?</span>
                <span>{form.answerConfidence}/5</span>
              </div>
              <Slider
                value={[form.answerConfidence]}
                max={5}
                min={1}
                step={1}
                onValueChange={(value) => setForm((current) => ({ ...current, answerConfidence: value[0] || 3 }))}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>{getPartnerName(answeringPerson, participants)}'s guess</Label>
            <Textarea
              value={form.guessedAnswer}
              onChange={(event) => setForm((current) => ({ ...current, guessedAnswer: event.target.value }))}
              className="min-h-28"
              placeholder={`What do you think your ${terms.counterpart} would actually say?`}
            />
            <div className="grid gap-2">
              <div className="flex items-center justify-between text-xs font-medium text-[#5c6b80]">
                <span>How sure is the guesser?</span>
                <span>{form.guessConfidence}/5</span>
              </div>
              <Slider
                value={[form.guessConfidence]}
                max={5}
                min={1}
                step={1}
                onValueChange={(value) => setForm((current) => ({ ...current, guessConfidence: value[0] || 3 }))}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)]">
        <Card className="enterprise-panel border-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Gamepad2 className="h-5 w-5 text-[#0e6f72]" />
              Gamified learning for this {terms.bond} that still feeds real intelligence
            </CardTitle>
            <p className="text-[15px] leading-6 text-[#5c6b80]">
              Play Lab turns curiosity, repair, support matching, and perspective-taking into short structured experiences that strengthen closeness while improving the app’s memory and future guidance.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <SoftMetric label="Completed Rounds" value={participationStats.completed} helper="Short modules that build deeper understanding." />
            <SoftMetric label="Aha Unlocked" value={participationStats.ahaUnlocked} helper="Reusable insight cards saved from app activity." />
            <SoftMetric label="Active Side Quests" value={participationStats.sideQuestCount} helper="One realistic behavior shift at a time." />
          </CardContent>
        </Card>

        <Card className="enterprise-panel border-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Lightbulb className="h-5 w-5 text-[#0e6f72]" />
              Why this belongs inside RelateIQ
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-[15px] leading-6 text-[#4e6077]">
            <p>Every answer, guess, mismatch, repair attempt, and outcome becomes stored learning that the worker can reuse later.</p>
            <p>That means AI Coach, Insights, triggers, support mapping, and future repair suggestions all get better over time.</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PLAY_LAB_MODULES.map((module) => (
          <ModuleCard
            key={module.id}
            module={module}
            active={moduleType === module.id && moduleWorkspaceOpen}
            onSelect={selectModule}
          />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.8fr)]">
        <div className="space-y-6">
        <CollapsiblePanel
          title={activeModule.title}
          icon={MODULE_ICONS[activeModule.id] || Gamepad2}
          description={activeModule.teaserDescription || activeModule.shortDescription}
          open={moduleWorkspaceOpen}
          onToggle={() => setModuleWorkspaceOpen((current) => !current)}
        >
          <div className="space-y-4 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[15px] leading-6 text-[#5c6b80]">{activeModule.shortDescription}</p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={resetRun}
                className="rounded-full border-[#0e6f72]/35 bg-[#eef8f7] text-[#14263f] hover:bg-[#d8f2ef]"
              >
                Reset
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label>Scope</Label>
                <Select value={scope} onValueChange={setScope}>
                  <SelectTrigger className="rounded-2xl border-[#0e6f72]/20 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tony">{participants[0]}</SelectItem>
                    <SelectItem value="Drew">{participants[1]}</SelectItem>
                    <SelectItem value="Tony+Drew">{relationshipLabel}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Initiated by</Label>
                <Select value={initiatedBy} onValueChange={setInitiatedBy}>
                  <SelectTrigger className="rounded-2xl border-[#0e6f72]/20 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tony">{participants[0]}</SelectItem>
                    <SelectItem value="Drew">{participants[1]}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Who answers first</Label>
                <Select value={answeringPerson} onValueChange={setAnsweringPerson}>
                  <SelectTrigger className="rounded-2xl border-[#0e6f72]/20 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tony">{participants[0]}</SelectItem>
                    <SelectItem value="Drew">{participants[1]}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-[1.35rem] border border-[#0e6f72]/18 bg-[#f6fbfb] p-4">
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0e6f72]/80">Current Prompt</p>
                  <p className="mt-2 max-w-3xl text-[17px] font-semibold leading-6 text-[#14263f]">
                    {session?.prompt_text || "Start a round to pull a fresh prompt from the Play Lab prompt bank."}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                  <Button
                    type="button"
                    onClick={async () => {
                      try {
                        const created = await createPlayLabSession({
                          moduleType,
                          scope,
                          initiatedBy,
                          answeringPerson,
                          createdFrom: "play_lab_page",
                        });
                        setSession(created.session);
                        toast.success("Fresh round ready");
                      } catch (error) {
                        console.error(error);
                        toast.error("Unable to start a new round right now.");
                      }
                    }}
                    className="rounded-full border-2 border-teal-500 bg-[#14263f] px-5 text-white hover:bg-[#0f1d31]"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Start Round
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRefreshPrompt}
                    disabled={refreshingPrompt}
                    className="rounded-full border-[#0e6f72]/35 bg-[#eef8f7] text-[#14263f] hover:bg-[#d8f2ef]"
                  >
                    {refreshingPrompt ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4 text-[#0e6f72]" />}
                    Try another
                  </Button>
                </div>
              </div>
            </div>

            <CollapsiblePanel
              title="How This Module Works"
              icon={CheckCircle2}
              description="Open the steps if you want the flow spelled out before you start."
              open={howItWorksOpen}
              onToggle={() => setHowItWorksOpen((current) => !current)}
            >
              <ul className="mt-3 space-y-2 text-[15px] leading-6 text-[#4e6077]">
                {activeModule.instructions.map((step) => (
                  <li key={step} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#0e6f72]" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </CollapsiblePanel>

            {renderModuleInputs()}

            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                onClick={handleRunModule}
                disabled={loading}
                className="rounded-full border-2 border-teal-500 bg-[#14263f] px-6 text-white hover:bg-[#0f1d31]"
              >
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Gamepad2 className="mr-2 h-4 w-4" />}
                Run {activeModule.title}
              </Button>
              {result ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCopy}
                  className="rounded-full border-[#0e6f72]/35 bg-[#eef8f7] text-[#14263f] hover:bg-[#d8f2ef]"
                >
                  <Copy className="mr-2 h-4 w-4 text-[#0e6f72]" />
                  Copy Result
                </Button>
              ) : null}
            </div>
          </div>
        </CollapsiblePanel>

      {result ? (
        <CollapsiblePanel
          title={result.moduleLabel || activeModule.title}
          icon={Sparkles}
          description={result.summary || result.ai_summary}
          open={resultOpen}
          onToggle={() => setResultOpen((current) => !current)}
        >
            <div className="space-y-4 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="rounded-[1.25rem] border border-[#0e6f72]/20 bg-[#eef8f7] px-5 py-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0e6f72]/80">Match / confidence</p>
                  <p className="mt-2 font-display text-3xl font-bold text-[#14263f]">{result.matchScore || result.match_score || 0}%</p>
                  <p className="text-sm text-[#4e6077]">{result.confidenceLevel || result.confidence_level || "emerging"}</p>
                </div>
              </div>
              {(result.sections || []).map((section) => (
                <ResultSectionCard
                  key={`${section.title}-${section.body}`}
                  title={section.title}
                  body={section.body}
                  summary={sectionSummary[section.title] && sectionSummary[section.title] !== "loading" ? sectionSummary[section.title] : ""}
                  onSummarize={() => handleSectionSummary(section)}
                  loading={sectionSummary[section.title] === "loading"}
                />
              ))}

              {Array.isArray(result.statements) && result.statements.length > 0 ? (
                <div className="rounded-[1.35rem] border border-[#0e6f72]/18 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0e6f72]/85">Two truths and a misread</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {result.statements.map((statement) => (
                      <div key={`${statement.label}-${statement.body}`} className="rounded-[1.15rem] border border-[#0e6f72]/14 bg-[#f6fbfb] p-4">
                        <p className="text-sm font-semibold text-[#14263f]">{statement.label}</p>
                        <p className="mt-2 text-sm leading-6 text-[#4e6077]">{statement.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="space-y-3">
                  <div className="rounded-[1.25rem] border border-[#0e6f72]/15 bg-[#f6fbfb] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0e6f72]/80">{result.suggestedAction?.title || "Next Step"}</p>
                    <p className="mt-2 text-[15px] leading-6 text-[#22324a]">{result.suggestedAction?.description || result.suggested_action?.description}</p>
                  </div>
                  {moduleType === "repair_quest" ? (
                    <div className="rounded-[1.25rem] border border-[#0e6f72]/15 bg-white p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0e6f72]/80">Choose the repair move you want to try</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {[result.suggestedAction?.description, ...(result.suggestedAction?.backups || [])]
                          .filter(Boolean)
                          .map((option) => (
                            <Button
                              key={option}
                              type="button"
                              variant="outline"
                              onClick={async () => {
                                setSelectedRepairAction(option);
                                if (result?.id) {
                                  await submitPlayLabAnswer({
                                    sessionId: session?.id,
                                    userId: initiatedBy,
                                    roleInSession: "participant",
                                    responseType: "chosen_repair_action",
                                    responseLabel: "Chosen repair action",
                                    responseValue: option,
                                    tags: ["repair_action_choice"],
                                    metadata: { resultId: result.id },
                                  });
                                }
                              }}
                              className={`rounded-full ${selectedRepairAction === option ? "border-[#0e6f72]/40 bg-[#eef8f7] text-[#14263f]" : "border-[#0e6f72]/20 bg-white text-[#4e6077] hover:bg-[#eef8f7]"}`}
                            >
                              {option}
                            </Button>
                          ))}
                      </div>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-3">
                    <Button type="button" variant="outline" onClick={handleExplain} className="rounded-full border-[#0e6f72]/35 bg-[#eef8f7] text-[#14263f] hover:bg-[#d8f2ef]">
                      <Sparkles className="mr-2 h-4 w-4 text-[#0e6f72]" />
                      Explain
                    </Button>
                    <Button type="button" variant="outline" onClick={handleElaborate} className="rounded-full border-[#0e6f72]/35 bg-[#eef8f7] text-[#14263f] hover:bg-[#d8f2ef]">
                      <WandSparkles className="mr-2 h-4 w-4 text-[#0e6f72]" />
                      Elaborate
                    </Button>
                    <Button type="button" variant="outline" onClick={handleRefreshPrompt} className="rounded-full border-[#0e6f72]/35 bg-[#eef8f7] text-[#14263f] hover:bg-[#d8f2ef]">
                      <RefreshCw className="mr-2 h-4 w-4 text-[#0e6f72]" />
                      New prompt
                    </Button>
                  </div>
                </div>
                <ResponseExportBar
                  content={buildPlayLabExportContent(result, activeModule.title)}
                  filename={`play-lab-${moduleType}-${new Date().toISOString().slice(0, 10)}.pdf`}
                  title={`${activeModule.title} — Play Lab`}
                />
              </div>

              {explainText ? (
                <div className="rounded-[1.35rem] border border-[#0e6f72]/18 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0e6f72]/85">Explain</p>
                  <p className="mt-2.5 whitespace-pre-wrap text-[15px] leading-6 text-[#22324a]">{explainText}</p>
                </div>
              ) : null}

              {elaborateText ? (
                <div className="rounded-[1.35rem] border border-[#0e6f72]/18 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0e6f72]/85">Elaborate</p>
                  <p className="mt-2.5 whitespace-pre-wrap text-[15px] leading-6 text-[#22324a]">{elaborateText}</p>
                </div>
              ) : null}
            </div>
        </CollapsiblePanel>
      ) : null}

      {ahaCard ? (
        <Card className="enterprise-panel border-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-xl">
              <Sparkles className="h-5 w-5 text-[#0e6f72]" />
              Aha unlocked
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-[1.35rem] border border-[#0e6f72]/18 bg-[#f6fbfb] p-4">
              <p className="font-semibold text-[#14263f]">{ahaCard.title}</p>
              <p className="mt-2.5 text-[15px] leading-6 text-[#4e6077]">{ahaCard.body}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {result ? (
        <CollapsiblePanel
          title="Outcome tracking"
          icon={ArrowRightLeft}
          description="Log what happened after you tried the suggestion so Play Lab can learn what actually helps."
          open={outcomeOpen}
          onToggle={() => setOutcomeOpen((current) => !current)}
        >
            <div className="space-y-5 pt-5">
              <p className="text-[15px] leading-6 text-[#5c6b80]">
                If you try the suggested move later, log the outcome here so the app can learn which approaches actually reduce tension and improve connection.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Did you try it?</Label>
                  <Select value={String(outcomeForm.attempted)} onValueChange={(value) => setOutcomeForm((current) => ({ ...current, attempted: value === "true" }))}>
                    <SelectTrigger className="rounded-2xl border-[#0e6f72]/20 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">Not yet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Did it help?</Label>
                  <Select value={String(outcomeForm.helped)} onValueChange={(value) => setOutcomeForm((current) => ({ ...current, helped: value === "true" }))}>
                    <SelectTrigger className="rounded-2xl border-[#0e6f72]/20 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Yes</SelectItem>
                      <SelectItem value="false">Not really</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Tension change (-3 to +3)</Label>
                  <Input type="number" min="-3" max="3" value={outcomeForm.tensionChange} onChange={(event) => setOutcomeForm((current) => ({ ...current, tensionChange: Number(event.target.value || 0) }))} />
                </div>
                <div className="grid gap-2">
                  <Label>Connection change (-3 to +3)</Label>
                  <Input type="number" min="-3" max="3" value={outcomeForm.connectionChange} onChange={(event) => setOutcomeForm((current) => ({ ...current, connectionChange: Number(event.target.value || 0) }))} />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Notes</Label>
                <Textarea value={outcomeForm.notes} onChange={(event) => setOutcomeForm((current) => ({ ...current, notes: event.target.value }))} className="min-h-24" placeholder="What happened when you tried it? Did it feel natural, helpful, awkward, or surprisingly effective?" />
              </div>
              <Button
                type="button"
                onClick={handleOutcomeSave}
                disabled={outcomeSubmitting}
                className="rounded-full border-2 border-teal-500 bg-[#14263f] px-6 text-white hover:bg-[#0f1d31]"
              >
                {outcomeSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRightLeft className="mr-2 h-4 w-4" />}
                Save Outcome
              </Button>
            </div>
        </CollapsiblePanel>
      ) : null}
        </div>

        <div className="space-y-6">
          <CollapsiblePanel
            title="Recent Aha Cards"
            icon={Lightbulb}
            description="Saved insight cards that keep the most useful patterns easy to revisit."
            open={recentAhaOpen}
            onToggle={() => setRecentAhaOpen((current) => !current)}
          >
            <div className="space-y-3 pt-5">
              {recentAhaCards.length === 0 ? (
                <p className="text-[15px] leading-6 text-[#5c6b80]">No Aha cards saved yet. The first few rounds will start generating them automatically.</p>
              ) : (
                recentAhaCards.slice(0, 4).map((card) => (
                  <div key={card.id} className="rounded-[1.25rem] border border-[#0e6f72]/15 bg-[#f6fbfb] p-4">
                    <p className="font-semibold text-[#14263f]">{card.title}</p>
                    <p className="mt-2 text-sm leading-6 text-[#4e6077]">{card.body}</p>
                  </div>
                ))
              )}
            </div>
          </CollapsiblePanel>

          <CollapsiblePanel
            title="Current Side Quests"
            icon={Trophy}
            description="Open the small weekly experiments that are currently active."
            open={sideQuestOpen}
            onToggle={() => setSideQuestOpen((current) => !current)}
          >
            <div className="space-y-3 pt-5">
              {recentSideQuests.length === 0 ? (
                <p className="text-[15px] leading-6 text-[#5c6b80]">No weekly micro-challenges assigned yet.</p>
              ) : (
                recentSideQuests.slice(0, 3).map((quest) => (
                  <div key={quest.id} className="rounded-[1.25rem] border border-[#0e6f72]/15 bg-white p-4">
                    <p className="font-semibold text-[#14263f]">{quest.title}</p>
                    <p className="mt-2 text-sm leading-6 text-[#4e6077]">{quest.description}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-[#0e6f72]/80">Success looks like</p>
                    <p className="mt-1 text-sm leading-6 text-[#4e6077]">{quest.success_definition}</p>
                  </div>
                ))
              )}
            </div>
          </CollapsiblePanel>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
        <CollapsiblePanel
          title="Recent Play Lab Activity"
          icon={Gamepad2}
          description="Open recent rounds, prompts, and outputs when you want to revisit what the app is learning."
          open={historyOpen}
          onToggle={() => setHistoryOpen((current) => !current)}
        >
          <div className="space-y-4 pt-5">
            {recentSessions.length === 0 ? (
              <p className="text-[15px] leading-6 text-[#5c6b80]">No Play Lab history yet. The first run will start building session memory right away.</p>
            ) : (
              recentSessions.slice(0, 6).map((item) => {
                const related = recentResults.find((resultItem) => resultItem.session_id === item.id);
                return <HistoryCard key={item.id} session={item} result={related} />;
              })
            )}
          </div>
        </CollapsiblePanel>

        <CollapsiblePanel
          title="How Play Lab Improves the Rest of RelateIQ"
          icon={Lightbulb}
          description="Open the system view if you want to see how matches, misses, and outcomes feed coaching and insights."
          open={systemImpactOpen}
          onToggle={() => setSystemImpactOpen((current) => !current)}
        >
          <div className="space-y-4 pt-4 text-[15px] leading-6 text-[#4e6077]">
            <div className="rounded-[1.25rem] border border-[#0e6f72]/14 bg-[#f6fbfb] p-4">
              <p className="font-semibold text-[#14263f]">AI Coach</p>
              <p className="mt-2">{`Recent mismatch data can sharpen what the coach suggests when one ${terms.counterpart} feels misunderstood or unsupported.`}</p>
            </div>
            <div className="rounded-[1.25rem] border border-[#0e6f72]/14 bg-[#f6fbfb] p-4">
              <p className="font-semibold text-[#14263f]">Insights</p>
              <p className="mt-2">Repeated matches, misses, and outcome logs can deepen support mapping, repair predictions, and blind-spot detection over time.</p>
            </div>
            <div className="rounded-[1.25rem] border border-[#0e6f72]/14 bg-[#f6fbfb] p-4">
              <p className="font-semibold text-[#14263f]">Repair + Support Matching</p>
              <p className="mt-2">The app can learn what actually works in real life instead of treating all support moves as equally useful.</p>
            </div>
          </div>
        </CollapsiblePanel>
      </section>
    </div>
  );
}
