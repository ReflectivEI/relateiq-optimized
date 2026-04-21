/**
 * ANALYSIS ENGINE PAGE — Multi-Perspective, Multi-Mode
 * Perspective switching ALWAYS recomputes with distinct inputs.
 * Delta detection shows exact differences between perspective runs.
 */
import React, { useState, useRef } from "react";
import { api } from "@/api/client";
import { useQuery } from "@tanstack/react-query";
import { generateAnalysis, computeAnalysisDelta } from "@/lib/analysisEngine";
import { applyMode, assertBaseExists } from "@/lib/analysisTransforms";
import { format } from "date-fns";
import { computePatternProfile, detectMisalignments } from "@/lib/patternEngine";
import { predictOutcome } from "@/lib/predictiveEngine";
import { CreditLimitError } from "@/lib/aiSafe";
import CreditLimitBanner from "@/components/ui/CreditLimitBanner";
import AnalysisModeSelector from "@/components/analysis/AnalysisModeSelector";
import PerspectiveToggle from "@/components/analysis/PerspectiveToggle";
import AnalysisOutputCard from "@/components/analysis/AnalysisOutputCard";
import PatternScoreCard from "@/components/analysis/PatternScoreCard";
import PredictionCard from "@/components/analysis/PredictionCard";
import DeltaCard from "@/components/analysis/DeltaCard";
import { Loader2, Sparkles, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AskAIButton from "@/components/askAI/AskAIButton";
import { buildContext } from "@/lib/contextBuilder";
import ResponseExportBar from "@/components/export/ResponseExportBar";

const PERSPECTIVES = ["Tony", "Drew", "Tony→Drew", "Drew→Tony"];

export default function AnalysisEngine() {
  const [perspective, setPerspective] = useState("Tony→Drew");
  const [mode, setMode] = useState("deep");
  const [baseAnalysis, setBaseAnalysis] = useState(null);
  const [displayAnalysis, setDisplayAnalysis] = useState(null);
  const [delta, setDelta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [perspectiveSwitching, setPerspectiveSwitching] = useState(false);
  const [creditError, setCreditError] = useState(false);
  const [scenario, setScenario] = useState("");
  const [prediction, setPrediction] = useState(null);
  const [activeTab, setActiveTab] = useState("analysis");
  const prevAnalysisRef = useRef(null);
  const prevPerspectiveRef = useRef(null);
  const analysisRef = useRef(null);

  const { data: tonyResponses = [] } = useQuery({
    queryKey: ["tony-responses-engine"],
    queryFn: () => api.entities.QuestionnaireResponse.filter({ person_name: "Tony" }),
  });
  const { data: drewResponses = [] } = useQuery({
    queryKey: ["drew-responses-engine"],
    queryFn: () => api.entities.QuestionnaireResponse.filter({ person_name: "Drew" }),
  });
  const { data: profiles = [] } = useQuery({
    queryKey: ["profiles-engine"],
    queryFn: () => api.entities.UserProfile.list(),
  });
  const { data: sessions = [] } = useQuery({
    queryKey: ["sessions-engine"],
    queryFn: () => api.entities.CoachSession.list("-created_date", 20),
  });
  const { data: triggers = [] } = useQuery({
    queryKey: ["triggers-engine"],
    queryFn: () => api.entities.TriggerEntry.list(),
  });

  const tonyProfile = profiles.find((p) => p.person_name === "Tony");
  const drewProfile = profiles.find((p) => p.person_name === "Drew");
  const tonyPatterns = computePatternProfile("Tony", tonyResponses);
  const drewPatterns = computePatternProfile("Drew", drewResponses);
  const misalignments = detectMisalignments(tonyPatterns, "Tony", drewPatterns, "Drew");

  const runGenerate = async (activePerspective, previousPerspective) => {
    setCreditError(false);
    try {
      const result = await generateAnalysis({
        perspective: activePerspective,
        analysis_type: "deep", // Always deep — modes are display transforms only, not AI variants
        tonyResponses,
        drewResponses,
        tonyProfile,
        drewProfile,
        triggers,
        sessions,
        scenario: scenario.trim() || null,
        previousPerspective,
      });

      // Compute delta if we have a previous run from a different perspective
      if (prevAnalysisRef.current && prevAnalysisRef.current.perspective !== activePerspective) {
        const d = computeAnalysisDelta(prevAnalysisRef.current, result);
        setDelta(d);
      } else {
        setDelta(null);
      }

      prevAnalysisRef.current = result;
      setBaseAnalysis(result);
      // Always apply deep as default first — mode transforms applied on top
      setDisplayAnalysis(applyMode(result, mode));

      // Auto-save to Insight Library
      api.entities.InsightEntry.create({
        perspective: activePerspective,
        mode: mode,
        core_insight: result.core_insight,
        behavioral_patterns: result.behavioral_patterns,
        relationship_dynamics: result.relationship_dynamics,
        risk_flags: result.risk_flags,
        strengths: result.strengths,
        recommended_actions: result.recommended_actions,
        confidence_score: result.confidence_score,
        frameworks_used: result.frameworks_used,
        scenario: scenario.trim() || null,
        week_label: `Week of ${format(new Date(), "MMM d")}`,
        full_output_json: JSON.stringify(result),
      }).catch(() => {}); // fire-and-forget, non-blocking
    } catch (err) {
      if (err instanceof CreditLimitError) setCreditError(true);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    prevPerspectiveRef.current = null; // fresh run
    await runGenerate(perspective, null);
    setLoading(false);
  };

  const handleModeSwitch = (newMode) => {
    setMode(newMode);
    // GUARD: non-deep modes require base output to exist — no AI re-call ever
    if (newMode !== "deep" && !baseAnalysis) return; // silently block — button is disabled anyway
    if (baseAnalysis) {
      assertBaseExists(baseAnalysis, newMode); // throws if violated
      setDisplayAnalysis(applyMode(baseAnalysis, newMode));
      console.log("[AnalysisEngine page] Mode switched (NO AI call)", { from: mode, to: newMode, base_generated_at: baseAnalysis.generated_at });
    }
  };

  const handlePerspectiveSwitch = async (newPerspective) => {
    const prevPerspective = perspective;
    setPerspective(newPerspective);
    // Always clear — force visual feedback of state reset
    setPerspectiveSwitching(true);
    setBaseAnalysis(null);
    setDisplayAnalysis(null);

    // Short visual pause so user sees the state cleared
    await new Promise((r) => setTimeout(r, 120));
    setPerspectiveSwitching(false);
    prevPerspectiveRef.current = prevPerspective;
  };

  const handlePredict = () => {
    if (!scenario.trim()) return;
    const isDir = perspective.includes("→");
    const [actor, tgt] = isDir
      ? perspective.split("→").map((s) => s.trim())
      : [perspective, perspective === "Tony" ? "Drew" : "Tony"];
    const actorTraits = actor === "Tony" ? tonyPatterns.traits : drewPatterns.traits;
    const targetTraits = tgt === "Tony" ? tonyPatterns.traits : drewPatterns.traits;
    setPrediction(predictOutcome({ actor, target: tgt, scenarioText: scenario, actorTraits, targetTraits }));
  };

  const isDirectional = perspective === "Tony→Drew" || perspective === "Drew→Tony";

  const askAIContext = buildContext({
    section: "Analysis Engine",
    perspective,
    currentAnalysis: baseAnalysis,
    patternScores: { traits: { ...tonyPatterns.traits, ...drewPatterns.traits } },
    predictiveOutput: prediction,
    profiles: [tonyProfile, drewProfile].filter(Boolean),
    checkIns: [],
    triggers,
    sessions,
  });

  return (
    <div className="space-y-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Analysis Engine</h1>
          <p className="mt-2 text-base text-muted-foreground">
            Structured intelligence — {tonyResponses.length + drewResponses.length} data points loaded
          </p>
        </div>
        <AskAIButton context={askAIContext} modalTitle="Analysis Engine" />
      </div>

      {creditError && <CreditLimitBanner />}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="analysis">Multi-Perspective Analysis</TabsTrigger>
          <TabsTrigger value="patterns">Pattern Scores</TabsTrigger>
          <TabsTrigger value="predict">Predictive Layer</TabsTrigger>
        </TabsList>

        {/* ── ANALYSIS TAB ── */}
        <TabsContent value="analysis" className="space-y-5 mt-4">
          <div className="grid gap-4 xl:grid-cols-2">
            <div className="enterprise-control-surface p-5 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Perspective</p>
              <PerspectiveToggle value={perspective} onChange={handlePerspectiveSwitch} options={PERSPECTIVES} />
              {/* Active perspective label */}
              <div className="flex items-center gap-2 mt-1">
                {perspectiveSwitching ? (
                  <span className="flex items-center gap-1.5 text-xs text-primary/70">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Switching perspective — clearing previous state...
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Active: <span className="font-semibold text-foreground">{perspective}</span>
                    {isDirectional && (
                      <span className="ml-2 text-primary/70">
                        — directional analysis (distinct inputs per side)
                      </span>
                    )}
                  </span>
                )}
              </div>
            </div>
            <div className="enterprise-control-surface p-5 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Output Mode</p>
              <AnalysisModeSelector value={mode} onChange={handleModeSwitch} disabled={!baseAnalysis} />
            </div>
          </div>

          <div className="enterprise-control-surface p-5 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Scenario (optional)
            </p>
            <Textarea
              placeholder="e.g. Drew brings up a sensitive topic unexpectedly after a long day at work..."
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className="min-h-[92px] resize-none bg-background/50 text-base"
            />
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <Button onClick={handleGenerate} disabled={loading || perspectiveSwitching} className="enterprise-pill gap-2 h-11 px-5">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? `Generating ${perspective} analysis...` : `Generate Analysis`}
            </Button>
            {baseAnalysis && !loading && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={loading}
                className="enterprise-option-pill gap-1.5"
              >
                <RefreshCw className="w-3 h-3" />
                Re-run
              </Button>
            )}
          </div>

          {baseAnalysis && !loading && (
            <p className="text-xs text-muted-foreground/60">
              Switch output mode above to transform instantly — no new AI call. Switch perspective to force full recompute with different inputs.
            </p>
          )}

          {/* Delta card — shows differences when perspective was switched */}
          {delta && <DeltaCard delta={delta} />}

          {perspectiveSwitching && (
            <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              State cleared — ready to generate {perspective} analysis with fresh inputs
            </div>
          )}

          {displayAnalysis && !perspectiveSwitching && (
            <div className="space-y-3">
              <ResponseExportBar
                contentRef={analysisRef}
                filename={`analysis-${perspective.replace(/\\s+/g, "-")}.pdf`}
                title={`${perspective} Analysis`}
                showEmail={false}
              />
              <div ref={analysisRef}>
                <AnalysisOutputCard analysis={displayAnalysis} />
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── PATTERN SCORES TAB ── */}
        <TabsContent value="patterns" className="space-y-5 mt-4">
          <p className="text-sm text-muted-foreground">
            Deterministic rule-based scores. Same questionnaire data always produces the same scores.
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            <PatternScoreCard profile={tonyPatterns} person="Tony" />
            <PatternScoreCard profile={drewPatterns} person="Drew" />
          </div>
          {misalignments.misalignments.length > 0 && (
            <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
              <h3 className="font-semibold text-sm">Detected Misalignments</h3>
              <div className="space-y-2">
                {misalignments.misalignments.map((m) => (
                  <div key={m.trait} className={`p-3 rounded-lg border text-xs ${m.severity === "high" ? "bg-red-500/10 border-red-400/30 text-red-300" : "bg-yellow-500/10 border-yellow-400/30 text-yellow-300"}`}>
                    <span className="font-semibold">{m.label}</span> — {m.description}
                  </div>
                ))}
              </div>
              {misalignments.alignments.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Alignments</h4>
                  {misalignments.alignments.map((a) => (
                    <div key={a.trait} className="p-3 rounded-lg border bg-green-500/10 border-green-400/30 text-green-300 text-xs">
                      {a.description}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ── PREDICTIVE LAYER TAB ── */}
        <TabsContent value="predict" className="space-y-5 mt-4">
          <div className="rounded-xl bg-muted/30 border border-border/50 px-4 py-3 space-y-1">
            <p className="text-xs font-semibold text-foreground">Fully deterministic · Zero AI · Same input → identical output</p>
            <p className="text-xs text-muted-foreground">
              Matches your text against 12 predefined scenarios, applies explicit rule chains to pattern scores, and produces a fully traceable prediction.
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Describe the Situation</p>
              <Textarea
                placeholder="e.g. 'Drew brings up something sensitive out of nowhere while Tony is already stressed from work'"
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                className="min-h-[90px] resize-none bg-background/50 text-sm"
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actor → Target</p>
              <PerspectiveToggle value={perspective} onChange={setPerspective} options={PERSPECTIVES} />
              <p className="text-[11px] text-muted-foreground">Actor drives behavior prediction. Target influences misinterpretation and emotional state.</p>
            </div>
            <Button onClick={handlePredict} disabled={!scenario.trim()} className="gap-2">
              <Sparkles className="w-4 h-4" />
              Predict Outcome
            </Button>
          </div>
          {prediction && <PredictionCard prediction={prediction} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
