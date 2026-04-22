import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  PLAY_LAB_MODULES,
  PLAY_LAB_SCOPE_OPTIONS,
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
  submitPlayLabAnswer,
} from "@/lib/playLabService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
} from "lucide-react";

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
  currentNeed: "",
  predictedNeed: "",
  stressSource: "",
  situation: "",
  unresolved: "",
  selectedMisread: "",
};

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
      className={`rounded-[1.5rem] border p-5 text-left transition-all ${
        active
          ? "border-[#0e6f72]/45 bg-[#eef8f7] shadow-[0_14px_32px_rgba(20,38,63,0.08)]"
          : "border-border/70 bg-white hover:-translate-y-0.5 hover:border-[#0e6f72]/30 hover:shadow-[0_14px_32px_rgba(20,38,63,0.08)]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#0e6f72]/20 bg-[#eef8f7]">
            <Icon className="h-5 w-5 text-[#0e6f72]" />
          </div>
          <div>
            <p className="text-base font-semibold text-[#14263f]">{module.title}</p>
            <p className="mt-1 text-sm leading-6 text-[#5c6b80]">{module.shortDescription}</p>
          </div>
        </div>
        <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-[#0e6f72]" />
      </div>
      <p className="mt-4 text-sm leading-6 text-[#4e6077]">{module.whyItMatters}</p>
    </button>
  );
}

function ResultSectionCard({ title, body, onSummarize, summary, loading }) {
  return (
    <div className="rounded-[1.35rem] border border-[#0e6f72]/18 bg-white p-5">
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
      <p className="mt-3 text-sm leading-7 text-[#22324a]">{body}</p>
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

export default function PlayLab() {
  const queryClient = useQueryClient();
  const [moduleType, setModuleType] = useState("guess_my_inner_world");
  const [scope, setScope] = useState("Tony+Drew");
  const [initiatedBy, setInitiatedBy] = useState("Tony");
  const [answeringPerson, setAnsweringPerson] = useState("Tony");
  const [session, setSession] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [result, setResult] = useState(null);
  const [ahaCard, setAhaCard] = useState(null);
  const [explainText, setExplainText] = useState("");
  const [elaborateText, setElaborateText] = useState("");
  const [sectionSummary, setSectionSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [outcomeSubmitting, setOutcomeSubmitting] = useState(false);
  const [outcomeForm, setOutcomeForm] = useState({
    attempted: true,
    helped: true,
    tensionChange: 1,
    connectionChange: 1,
    feltNatural: true,
    notes: "",
  });

  const activeModule = getPlayLabModule(moduleType);

  const { data: historyData = { sessions: [], results: [] }, refetch: refetchHistory } = useQuery({
    queryKey: ["play-lab-history", scope],
    queryFn: () => fetchPlayLabHistory({ scope, limit: 16 }),
  });

  const { data: ahaData = { cards: [] }, refetch: refetchAha } = useQuery({
    queryKey: ["play-lab-aha-cards", scope],
    queryFn: () => fetchAhaCards({ scope }),
  });

  const { data: questData = { quests: [] }, refetch: refetchQuests } = useQuery({
    queryKey: ["play-lab-side-quests", scope],
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
    setForm(DEFAULT_FORM);
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

  const handleRunModule = async () => {
    setLoading(true);
    try {
      const activeSession = await ensureSession();
      const answerValue = form.actualAnswer || form.currentNeed || form.situation;
      const guessValue = form.guessedAnswer || form.predictedNeed || form.selectedMisread;

      if (answerValue) {
        await submitPlayLabAnswer({
          sessionId: activeSession.id,
          userId: answeringPerson,
          roleInSession: "answerer",
          responseType: moduleType,
          responseValue: answerValue,
        });
      }

      if (guessValue && moduleType !== "side_quest" && moduleType !== "aha_cards" && moduleType !== "repair_quest") {
        await submitPlayLabAnswer({
          sessionId: activeSession.id,
          userId: initiatedBy === "Tony" ? "Drew" : "Tony",
          roleInSession: "guesser",
          responseType: "guess",
          responseValue: guessValue,
        });
      }

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
        predictedNeed: form.predictedNeed,
        stressSource: form.stressSource,
        situation: form.situation,
        unresolved: form.unresolved,
        selectedMisread: form.selectedMisread,
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
      await queryClient.invalidateQueries({ queryKey: ["play-lab-history"] });
    } catch (error) {
      console.error(error);
      toast.error("Unable to save outcome right now.");
    } finally {
      setOutcomeSubmitting(false);
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
            <Textarea
              value={form.currentNeed}
              onChange={(event) => setForm((current) => ({ ...current, currentNeed: event.target.value }))}
              className="min-h-24"
              placeholder="Listening, affection, reassurance, space, one concrete task, lighter energy..."
            />
          </div>
          <div className="grid gap-2">
            <Label>What does the other partner predict is needed?</Label>
            <Textarea
              value={form.predictedNeed}
              onChange={(event) => setForm((current) => ({ ...current, predictedNeed: event.target.value }))}
              className="min-h-24"
              placeholder="What do you think your partner most needs from you right now?"
            />
          </div>
        </div>
      );
    }

    if (moduleType === "two_truths_and_a_misread") {
      return (
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Describe a recent tense or confusing moment</Label>
            <Textarea
              value={form.situation}
              onChange={(event) => setForm((current) => ({ ...current, situation: event.target.value }))}
              className="min-h-28"
              placeholder="Paste or summarize the exchange, shutdown, distance, or friction."
            />
          </div>
          <div className="grid gap-2">
            <Label>What do you think may have been misread?</Label>
            <Input
              value={form.selectedMisread}
              onChange={(event) => setForm((current) => ({ ...current, selectedMisread: event.target.value }))}
              placeholder="Ex: His silence meant he didn’t care."
            />
          </div>
        </div>
      );
    }

    if (moduleType === "side_quest" || moduleType === "aha_cards") {
      return (
        <div className="rounded-[1.35rem] border border-[#0e6f72]/18 bg-[#f6fbfb] p-5 text-sm leading-7 text-[#4e6077]">
          {moduleType === "side_quest"
            ? "This module assigns one tiny weekly experiment based on what the app has already learned. Start it and the worker will generate the challenge plus what success looks like."
            : "This module turns stored patterns into a reusable Aha card. Start it and the worker will save a fresh insight card tied to recent relationship data."}
        </div>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label>{answeringPerson}'s real answer</Label>
          <Textarea
            value={form.actualAnswer}
            onChange={(event) => setForm((current) => ({ ...current, actualAnswer: event.target.value }))}
            className="min-h-28"
            placeholder={session?.prompt_text || "Start the round to generate a prompt."}
          />
        </div>
        <div className="grid gap-2">
          <Label>{answeringPerson === "Tony" ? "Drew" : "Tony"}'s guess</Label>
          <Textarea
            value={form.guessedAnswer}
            onChange={(event) => setForm((current) => ({ ...current, guessedAnswer: event.target.value }))}
            className="min-h-28"
            placeholder="What do you think your partner would actually say?"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.75fr)]">
        <Card className="enterprise-panel border-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <Gamepad2 className="h-5 w-5 text-[#0e6f72]" />
              Gamified relationship learning that still feeds real intelligence
            </CardTitle>
            <p className="text-sm leading-7 text-[#5c6b80]">
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
          <CardContent className="space-y-3 text-sm leading-7 text-[#4e6077]">
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
            active={moduleType === module.id}
            onSelect={(nextModule) => {
              setModuleType(nextModule);
              resetRun();
            }}
          />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(300px,0.8fr)]">
        <Card className="enterprise-panel border-2">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-2xl">{activeModule.title}</CardTitle>
                <p className="mt-2 text-sm leading-7 text-[#5c6b80]">{activeModule.shortDescription}</p>
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
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="grid gap-2">
                <Label>Scope</Label>
                <Select value={scope} onValueChange={setScope}>
                  <SelectTrigger className="rounded-2xl border-[#0e6f72]/20 bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PLAY_LAB_SCOPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                    ))}
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
                    <SelectItem value="Tony">Tony</SelectItem>
                    <SelectItem value="Drew">Drew</SelectItem>
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
                    <SelectItem value="Tony">Tony</SelectItem>
                    <SelectItem value="Drew">Drew</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-[1.35rem] border border-[#0e6f72]/18 bg-[#f6fbfb] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0e6f72]/80">Current Prompt</p>
                  <p className="mt-2 text-base font-semibold text-[#14263f]">
                    {session?.prompt_text || "Start a round to pull a fresh prompt from the Play Lab prompt bank."}
                  </p>
                </div>
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
              </div>
            </div>

            <div className="rounded-[1.35rem] border border-[#0e6f72]/18 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0e6f72]/80">How This Module Works</p>
              <ul className="mt-4 space-y-2 text-sm leading-7 text-[#4e6077]">
                {activeModule.instructions.map((step) => (
                  <li key={step} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-[#0e6f72]" />
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>

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
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="enterprise-panel border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Recent Aha Cards</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentAhaCards.length === 0 ? (
                <p className="text-sm leading-7 text-[#5c6b80]">No Aha cards saved yet. The first few rounds will start generating them automatically.</p>
              ) : (
                recentAhaCards.slice(0, 4).map((card) => (
                  <div key={card.id} className="rounded-[1.25rem] border border-[#0e6f72]/15 bg-[#f6fbfb] p-4">
                    <p className="font-semibold text-[#14263f]">{card.title}</p>
                    <p className="mt-2 text-sm leading-6 text-[#4e6077]">{card.body}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="enterprise-panel border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Current Side Quests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentSideQuests.length === 0 ? (
                <p className="text-sm leading-7 text-[#5c6b80]">No weekly micro-challenges assigned yet.</p>
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
            </CardContent>
          </Card>
        </div>
      </section>

      {result ? (
        <section className="space-y-6">
          <Card className="enterprise-panel border-2">
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">{result.moduleLabel || activeModule.title}</CardTitle>
                  <p className="mt-2 text-sm leading-7 text-[#5c6b80]">{result.summary || result.ai_summary}</p>
                </div>
                <div className="rounded-[1.25rem] border border-[#0e6f72]/20 bg-[#eef8f7] px-5 py-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0e6f72]/80">Match / confidence</p>
                  <p className="mt-2 font-display text-3xl font-bold text-[#14263f]">{result.matchScore || result.match_score || 0}%</p>
                  <p className="text-sm text-[#4e6077]">{result.confidenceLevel || result.confidence_level || "emerging"}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
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
                <div className="rounded-[1.35rem] border border-[#0e6f72]/18 bg-white p-5">
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
                    <p className="mt-2 text-sm leading-7 text-[#22324a]">{result.suggestedAction?.description || result.suggested_action?.description}</p>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button type="button" variant="outline" onClick={handleExplain} className="rounded-full border-[#0e6f72]/35 bg-[#eef8f7] text-[#14263f] hover:bg-[#d8f2ef]">
                      <Sparkles className="mr-2 h-4 w-4 text-[#0e6f72]" />
                      Explain
                    </Button>
                    <Button type="button" variant="outline" onClick={handleElaborate} className="rounded-full border-[#0e6f72]/35 bg-[#eef8f7] text-[#14263f] hover:bg-[#d8f2ef]">
                      <WandSparkles className="mr-2 h-4 w-4 text-[#0e6f72]" />
                      Elaborate
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
                <div className="rounded-[1.35rem] border border-[#0e6f72]/18 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0e6f72]/85">Explain</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#22324a]">{explainText}</p>
                </div>
              ) : null}

              {elaborateText ? (
                <div className="rounded-[1.35rem] border border-[#0e6f72]/18 bg-white p-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#0e6f72]/85">Elaborate</p>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-[#22324a]">{elaborateText}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {ahaCard ? (
            <Card className="enterprise-panel border-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Sparkles className="h-5 w-5 text-[#0e6f72]" />
                  Aha unlocked
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-[1.35rem] border border-[#0e6f72]/18 bg-[#f6fbfb] p-5">
                  <p className="font-semibold text-[#14263f]">{ahaCard.title}</p>
                  <p className="mt-3 text-sm leading-7 text-[#4e6077]">{ahaCard.body}</p>
                </div>
              </CardContent>
            </Card>
          ) : null}

          <Card className="enterprise-panel border-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">Outcome tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-sm leading-7 text-[#5c6b80]">
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
            </CardContent>
          </Card>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(280px,0.9fr)]">
        <Card className="enterprise-panel border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl">Recent Play Lab activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentSessions.length === 0 ? (
              <p className="text-sm leading-7 text-[#5c6b80]">No Play Lab history yet. The first run will start building session memory right away.</p>
            ) : (
              recentSessions.slice(0, 6).map((item) => {
                const related = recentResults.find((resultItem) => resultItem.session_id === item.id);
                return <HistoryCard key={item.id} session={item} result={related} />;
              })
            )}
          </CardContent>
        </Card>

        <Card className="enterprise-panel border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl">How Play Lab improves the rest of RelateIQ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-[#4e6077]">
            <div className="rounded-[1.25rem] border border-[#0e6f72]/14 bg-[#f6fbfb] p-4">
              <p className="font-semibold text-[#14263f]">AI Coach</p>
              <p className="mt-2">Recent mismatch data can sharpen what the coach suggests when one partner feels misunderstood or unsupported.</p>
            </div>
            <div className="rounded-[1.25rem] border border-[#0e6f72]/14 bg-[#f6fbfb] p-4">
              <p className="font-semibold text-[#14263f]">Insights</p>
              <p className="mt-2">Repeated matches, misses, and outcome logs can deepen support mapping, repair predictions, and blind-spot detection over time.</p>
            </div>
            <div className="rounded-[1.25rem] border border-[#0e6f72]/14 bg-[#f6fbfb] p-4">
              <p className="font-semibold text-[#14263f]">Repair + Support Matching</p>
              <p className="mt-2">The app can learn what actually works in real life instead of treating all support moves as equally useful.</p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
