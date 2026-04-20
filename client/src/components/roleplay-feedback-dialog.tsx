import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Award, 
  TrendingUp, 
  Target, 
  MessageSquareQuote, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  Brain,
  Briefcase,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X
} from "lucide-react";
import { eqMetrics } from "@/lib/data";
import { readEnabledEIMetricIds, EI_METRICS_SETTINGS_EVENT } from "@/lib/eiMetricSettings";

interface ComprehensiveFeedback {
  overallScore: number;
  performanceLevel: "exceptional" | "strong" | "developing" | "emerging" | "needs-focus";
  eqScores: Array<{ 
    metricId: string; 
    score: number; 
    feedback: string;
    observedBehaviors?: number;
    totalOpportunities?: number;
    calculationNote?: string;
  }>;
  salesSkillScores: Array<{ 
    skillId: string; 
    skillName: string; 
    score: number; 
    feedback: string;
    observedBehaviors?: number;
    totalOpportunities?: number;
    calculationNote?: string;
  }>;
  topStrengths: string[];
  priorityImprovements: string[];
  specificExamples: Array<{ quote: string; analysis: string; isPositive: boolean }>;
  nextSteps: string[];
  overallSummary: string;
}

interface RoleplayFeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feedback: ComprehensiveFeedback | null;
  scenarioTitle?: string;
  onStartNew?: () => void;
}

function getPerformanceBadgeColor(level: string): string {
  switch (level) {
    case "exceptional": return "bg-green-500/10 text-green-600 border-green-500/30";
    case "strong": return "bg-blue-500/10 text-blue-600 border-blue-500/30";
    case "developing": return "bg-yellow-500/10 text-yellow-600 border-yellow-500/30";
    case "emerging": return "bg-orange-500/10 text-orange-600 border-orange-500/30";
    case "needs-focus": return "bg-red-500/10 text-red-600 border-red-500/30";
    default: return "bg-muted text-muted-foreground";
  }
}

function getScoreColor(score: number): string {
  if (score >= 4) return "text-green-500";
  if (score >= 3) return "text-yellow-500";
  if (score >= 2) return "text-orange-500";
  return "text-red-500";
}

function getProgressColor(score: number): string {
  if (score >= 4) return "bg-green-500";
  if (score >= 3) return "bg-yellow-500";
  if (score >= 2) return "bg-orange-500";
  return "bg-red-500";
}

function ScoreRing({ score, size = "lg" }: { score: number; size?: "sm" | "lg" }) {
  const percentage = (score / 5) * 100;
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const dimensions = size === "lg" ? "w-32 h-32" : "w-20 h-20";
  const textSize = size === "lg" ? "text-3xl" : "text-xl";

  return (
    <div className={`relative ${dimensions}`}>
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          className="text-muted"
        />
        <motion.circle
          cx="50%"
          cy="50%"
          r="45%"
          stroke="currentColor"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          className={getScoreColor(score)}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span 
          className={`${textSize} font-bold ${getScoreColor(score)}`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          {score.toFixed(1)}
        </motion.span>
        <span className="text-xs text-muted-foreground">out of 5</span>
      </div>
    </div>
  );
}

const metricDefinitions: Record<string, { definition: string; formula: string }> = {
  empathy: {
    definition: "Recognizing and appreciating how the HCP feels",
    formula: "(Empathetic responses / Total HCP concerns) × 100"
  },
  clarity: {
    definition: "Expressing clinical data and value propositions clearly",
    formula: "(Clear messages / Total informational statements) × 100"
  },
  compliance: {
    definition: "Staying on-label and maintaining fair balance",
    formula: "(On-label statements / Total claims made) × 100"
  },
  discovery: {
    definition: "Asking insightful questions to uncover needs",
    formula: "(Quality discovery questions / Opportunities to probe) × 100"
  },
  "objection-handling": {
    definition: "Acknowledging and reframing concerns constructively",
    formula: "(Effectively handled objections / Total objections raised) × 100"
  },
  confidence: {
    definition: "Self-assurance in presenting data while remaining open",
    formula: "Scored 1-5 based on directness, clarity, and composure"
  },
  "active-listening": {
    definition: "Paraphrasing and responding to what was actually said",
    formula: "(Active listening behaviors / Total exchanges) × 100"
  },
  adaptability: {
    definition: "Flexibility in adjusting approach based on cues",
    formula: "(Successful pivots / Detected cue changes) × 100"
  },
  "action-insight": {
    definition: "Translating discussion into concrete next steps",
    formula: "(Relevant next steps proposed / Conversation conclusions) × 100"
  },
  resilience: {
    definition: "Maintaining composure when facing pushback",
    formula: "(Professional recovery instances / Challenging moments) × 100"
  },
  opening: {
    definition: "Establishing credibility and capturing attention",
    formula: "Scored 1-5 based on impact and engagement"
  },
  "needs-assessment": {
    definition: "Thoroughly understanding the HCP's situation",
    formula: "(Need areas explored / Potential need areas) × 100"
  },
  "value-articulation": {
    definition: "Clearly communicating product/solution value",
    formula: "(Compelling value statements / Total value statements) × 100"
  },
  "evidence-based": {
    definition: "Using clinical data effectively",
    formula: "(Relevant data citations / Opportunities to cite) × 100"
  },
  closing: {
    definition: "Seeking commitment or next steps",
    formula: "(Successful closes / Close opportunities) × 100"
  }
};

function MetricScoreCard({ 
  name, 
  score, 
  feedback,
  metricId,
  observedBehaviors,
  totalOpportunities,
  calculationNote,
  icon: Icon 
}: { 
  name: string; 
  score: number; 
  feedback: string;
  metricId?: string;
  observedBehaviors?: number;
  totalOpportunities?: number;
  calculationNote?: string;
  icon?: any;
}) {
  const [expanded, setExpanded] = useState(false);
  const metricFromRubric = metricId ? eqMetrics.find(m => m.id === metricId) : undefined;
  const metricInfo = metricId ? metricDefinitions[metricId] : null;
  const definitionText = metricFromRubric?.description ?? metricInfo?.definition;
  const scoringText = metricFromRubric?.calculation ?? metricInfo?.formula;
  const observableIndicators = Array.isArray(metricFromRubric?.sampleIndicators)
    ? metricFromRubric!.sampleIndicators
    : [];
  const keyTipText = typeof metricFromRubric?.keyTip === "string" ? metricFromRubric.keyTip : undefined;
  const percentage = totalOpportunities && totalOpportunities > 0 
    ? Math.round((observedBehaviors || 0) / totalOpportunities * 100) 
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border rounded-lg p-3 hover-elevate cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
          <span className="text-sm font-medium">{name}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`font-bold ${getScoreColor(score)}`}>{score}/5</span>
          {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </div>
      </div>
      <div className="relative h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`absolute left-0 top-0 h-full rounded-full ${getProgressColor(score)}`}
          initial={{ width: 0 }}
          animate={{ width: `${(score / 5) * 100}%` }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t space-y-3"
          >
            {(definitionText || scoringText) && (
              <div className="space-y-2">
                {definitionText && (
                  <div>
                    <span className="text-xs font-semibold text-primary">Definition</span>
                    <p className="text-xs text-muted-foreground">{definitionText}</p>
                  </div>
                )}
                {scoringText && (
                  <div>
                    <span className="text-xs font-semibold text-primary">Scoring Method</span>
                    <p className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">{scoringText}</p>
                  </div>
                )}
              </div>
            )}
            {(observedBehaviors !== undefined && totalOpportunities !== undefined && totalOpportunities > 0) && (
              <div className="bg-muted/50 rounded-lg p-2 space-y-2">
                <div>
                  <span className="text-xs font-semibold text-primary">Signal Capture Rate</span>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                    <span>Signals captured:</span>
                    <span className="font-medium text-foreground">{observedBehaviors}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Total observable signals:</span>
                    <span className="font-medium text-foreground">{totalOpportunities}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="font-medium">Capture rate:</span>
                    {percentage !== null ? (
                      <Badge variant="outline" className="text-xs">
                        {percentage}%
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
                {calculationNote && (
                  <p className="text-xs text-muted-foreground">{calculationNote}</p>
                )}
              </div>
            )}
            {(metricId && (observedBehaviors === undefined || totalOpportunities === undefined || totalOpportunities === 0)) && (
              <div className="bg-muted/50 rounded-lg p-2">
                <span className="text-xs font-semibold text-primary">Signal Capture Rate</span>
                <p className="text-xs text-muted-foreground mt-1">
                  Session-specific capture counts were not provided for this metric.
                </p>
              </div>
            )}
            {calculationNote && observedBehaviors === undefined && (
              <div className="bg-muted/50 rounded-lg p-2">
                <span className="text-xs font-semibold text-primary">Score Basis</span>
                <p className="text-xs text-muted-foreground mt-1">{calculationNote}</p>
              </div>
            )}

            {observableIndicators.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-primary">Observable Indicators</span>
                <ul className="mt-2 space-y-1.5">
                  {observableIndicators.map((indicator: string, idx: number) => (
                    <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                      <span className="mt-1 w-1 h-1 rounded-full bg-muted-foreground flex-shrink-0" />
                      <span>{indicator}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {keyTipText && (
              <div className="bg-primary/5 p-2 rounded-lg border border-primary/20">
                <span className="text-xs font-semibold text-primary">Key Tip</span>
                <p className="text-xs text-muted-foreground italic mt-1">{keyTipText}</p>
              </div>
            )}

            <div>
              <span className="text-xs font-semibold text-primary">Feedback</span>
              <p className="text-xs text-muted-foreground">{feedback}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function RoleplayFeedbackDialog({ 
  open, 
  onOpenChange, 
  feedback, 
  scenarioTitle,
  onStartNew 
}: RoleplayFeedbackDialogProps) {
  if (!feedback) return null;

  function normalizeToFive(score?: unknown): number {
    if (typeof score !== "number" || Number.isNaN(score)) return 0;
    if (score <= 5) {
      const clamped = Math.min(Math.max(score, 0), 5);
      return Math.round(clamped * 10) / 10;
    }
    const clamped = Math.min(Math.max(score, 0), 100);
    return Math.round(((clamped / 100) * 5) * 10) / 10;
  }

  const getMetricName = (metricId: string) => {
    const metric = eqMetrics.find(m => m.id === metricId);
    return metric?.name || metricId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  const [enabledExtras, setEnabledExtras] = useState<string[]>(() => readEnabledEIMetricIds());

  // Keep in sync if the user toggles metrics elsewhere in the app.
  // (Same-tab changes are broadcast via a custom event.)
  useEffect(() => {
    const handler = () => setEnabledExtras(readEnabledEIMetricIds());
    window.addEventListener(EI_METRICS_SETTINGS_EVENT, handler);
    return () => window.removeEventListener(EI_METRICS_SETTINGS_EVENT, handler);
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b bg-muted/30">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-xl flex items-center gap-2" data-testid="text-feedback-title">
                <Award className="h-5 w-5 text-primary" />
                Role-Play Performance Analysis
              </DialogTitle>
              <DialogDescription className="sr-only">
                Detailed feedback for your role-play session.
              </DialogDescription>
              {scenarioTitle && (
                <p className="text-sm text-muted-foreground mt-1">{scenarioTitle}</p>
              )}
            </div>
            <Badge 
              variant="outline" 
              className={`${getPerformanceBadgeColor(feedback.performanceLevel)} capitalize`}
              data-testid="badge-performance-level"
            >
              {feedback.performanceLevel.replace("-", " ")}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)]">
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-8">
              <div className="flex-shrink-0">
                <ScoreRing score={feedback.overallScore} />
              </div>
              <div className="flex-1 space-y-3">
                <h3 className="font-semibold text-lg">Overall Assessment</h3>
                <p className="text-muted-foreground" data-testid="text-overall-summary">
                  {feedback.overallSummary}
                </p>
              </div>
            </div>

            <Separator />

            <Tabs defaultValue="eq" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="eq" className="flex items-center gap-2" data-testid="tab-eq-metrics">
                  <Brain className="h-4 w-4" />
                  <span className="hidden sm:inline">EI Metrics</span>
                </TabsTrigger>
                <TabsTrigger value="sales" className="flex items-center gap-2" data-testid="tab-sales-skills">
                  <Briefcase className="h-4 w-4" />
                  <span className="hidden sm:inline">Sales Skills</span>
                </TabsTrigger>
                <TabsTrigger value="examples" className="flex items-center gap-2" data-testid="tab-examples">
                  <MessageSquareQuote className="h-4 w-4" />
                  <span className="hidden sm:inline">Examples</span>
                </TabsTrigger>
                <TabsTrigger value="growth" className="flex items-center gap-2" data-testid="tab-growth">
                  <TrendingUp className="h-4 w-4" />
                  <span className="hidden sm:inline">Growth</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="eq" className="mt-4 space-y-3">
                <p className="text-sm text-muted-foreground mb-4">
                  <strong>Layer 1 — Emotional Intelligence:</strong> Demonstrated capabilities measured through observable behaviors. These metrics assess how effectively you perceived signals, adapted your approach, and preserved trust. Click any metric to see definition, calculation, and your specific breakdown.
                </p>
                {(() => {
                  const root: any = (feedback as any)?.analysis ?? (feedback as any);

                  const detailedScores = Array.isArray(feedback.eqScores) ? feedback.eqScores : [];
                  const byId = new Map(detailedScores.map((m) => [m.metricId, m] as const));

                  const aggregateScore = normalizeToFive(root?.eqScore ?? feedback.overallScore);

                  const fallbackFieldByMetricId: Record<string, string> = {
                    empathy: "empathyScore",
                    clarity: "clarityScore",
                    discovery: "discoveryScore",
                    adaptability: "adaptabilityScore",
                    resilience: "resilienceScore",
                  };

                  const coreMetricIds = eqMetrics.filter(m => m.isCore).map(m => m.id);
                  const enabledSet = new Set(enabledExtras);
                  const extraMetricIds = eqMetrics
                    .filter(m => !m.isCore)
                    .map(m => m.id)
                    .filter(id => enabledSet.has(id));

                  const metricOrder = [...coreMetricIds, ...extraMetricIds];

                  const items = [
                    {
                      key: "eq:aggregate",
                      metricId: undefined as string | undefined,
                      name: "EQ Score (Aggregate)",
                      score: aggregateScore,
                      feedbackText: feedback.overallSummary || "Overall session summary.",
                      observedBehaviors: undefined as number | undefined,
                      totalOpportunities: undefined as number | undefined,
                      calculationNote: undefined as string | undefined,
                    },
                    ...metricOrder.map((metricId) => {
                      const detail = byId.get(metricId);
                      const fallbackField = fallbackFieldByMetricId[metricId];
                      const fallbackRaw = fallbackField ? root?.[fallbackField] : undefined;

                      return {
                        key: `eq:${metricId}`,
                        metricId,
                        name: getMetricName(metricId),
                        score: typeof detail?.score === "number" ? detail.score : normalizeToFive(fallbackRaw),
                        feedbackText:
                          (typeof detail?.feedback === "string" && detail.feedback.trim())
                            ? detail.feedback
                            : "Click to see the rubric definition, scoring method, observable indicators, and key coaching tip.",
                        observedBehaviors: detail?.observedBehaviors,
                        totalOpportunities: detail?.totalOpportunities,
                        calculationNote: detail?.calculationNote,
                      };
                    }),
                  ];

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {items.map((item, idx) => (
                        <motion.div
                          key={item.key}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <MetricScoreCard
                            name={item.name}
                            score={item.score}
                            feedback={item.feedbackText}
                            metricId={item.metricId}
                            observedBehaviors={item.observedBehaviors}
                            totalOpportunities={item.totalOpportunities}
                            calculationNote={item.calculationNote}
                            icon={Brain}
                          />
                        </motion.div>
                      ))}
                    </div>
                  );
                })()}
              </TabsContent>

              <TabsContent value="sales" className="mt-4 space-y-3">
                <p className="text-sm text-muted-foreground mb-4">
                  Traditional sales competency rubrics. Click any skill to see definition, calculation formula, and your specific breakdown.
                </p>
                {feedback.salesSkillScores.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {feedback.salesSkillScores.map((skill, idx) => (
                      <motion.div
                        key={skill.skillId}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <MetricScoreCard
                          name={skill.skillName}
                          score={skill.score}
                          feedback={skill.feedback}
                          metricId={skill.skillId}
                          observedBehaviors={skill.observedBehaviors}
                          totalOpportunities={skill.totalOpportunities}
                          calculationNote={skill.calculationNote}
                          icon={Briefcase}
                        />
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                    <Briefcase className="h-12 w-12 mb-3 opacity-30" />
                    <p className="text-sm">
                      Sales skills assessment available for longer conversations
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="examples" className="mt-4 space-y-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Specific moments from your conversation with analysis of what worked well or could improve.
                </p>
                {(() => {
                  const root: any = (feedback as any)?.analysis ?? (feedback as any);
                  const out: Array<{ quote: string; analysis: string; isPositive: boolean }> = [];

                  const seeded = Array.isArray(feedback.specificExamples) ? feedback.specificExamples : [];
                  for (const ex of seeded) {
                    if (!ex || typeof ex.quote !== "string" || typeof ex.analysis !== "string") continue;
                    out.push({ quote: ex.quote, analysis: ex.analysis, isPositive: Boolean(ex.isPositive) });
                  }

                  if (out.length === 0) {
                    const strength = Array.isArray(feedback.topStrengths) && feedback.topStrengths.length
                      ? String(feedback.topStrengths[0])
                      : "Maintained professional, constructive communication.";
                    const improvement = Array.isArray(feedback.priorityImprovements) && feedback.priorityImprovements.length
                      ? String(feedback.priorityImprovements[0])
                      : "Add a discovery question before presenting your solution.";

                    out.push({
                      quote: strength,
                      analysis: "What Worked",
                      isPositive: true,
                    });
                    out.push({
                      quote: improvement,
                      analysis: "What Could Improve",
                      isPositive: false,
                    });
                  }

                  const signalSummary = Array.isArray(root?.signalSummary) ? root.signalSummary : [];
                  for (const s of signalSummary) {
                    const evidence = typeof s?.evidence === "string" ? s.evidence.trim() : "";
                    if (!evidence) continue;
                    out.push({
                      quote: evidence,
                      analysis: "What Could Improve",
                      isPositive: false,
                    });
                  }

                  const hasWorked = out.some(x => x.isPositive);
                  const hasImprove = out.some(x => !x.isPositive);

                  if (!hasWorked || !hasImprove) {
                    return (
                      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                        <MessageSquareQuote className="h-12 w-12 mb-3 opacity-30" />
                        <p className="text-sm">
                          No specific examples were provided for this session.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <>
                      {out.map((example, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                        >
                          <Card className={example.isPositive ? "border-green-500/30" : "border-orange-500/30"}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className={`p-1.5 rounded-full ${example.isPositive ? "bg-green-500/10" : "bg-orange-500/10"}`}>
                                  {example.isPositive ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                  ) : (
                                    <AlertCircle className="h-4 w-4 text-orange-500" />
                                  )}
                                </div>
                                <div className="flex-1 space-y-2">
                                  <Badge variant="outline" className={example.isPositive ? "border-green-500/30 text-green-600" : "border-orange-500/30 text-orange-600"}>
                                    {example.isPositive ? "What Worked" : "What Could Improve"}
                                  </Badge>
                                  <blockquote className="text-sm italic border-l-2 border-muted-foreground/30 pl-3">
                                    "{example.quote}"
                                  </blockquote>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </>
                  );
                })()}
              </TabsContent>

              <TabsContent value="growth" className="mt-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="border-green-500/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Top Strengths
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ul className="space-y-2">
                        {feedback.topStrengths.map((strength, idx) => (
                          <li key={idx} className="text-sm">
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="flex items-start gap-2"
                            >
                              <Sparkles className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{strength}</span>
                            </motion.div>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className="border-orange-500/30">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Target className="h-4 w-4 text-orange-500" />
                        Priority Improvements
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ul className="space-y-2">
                        {feedback.priorityImprovements.map((improvement, idx) => (
                          <li key={idx} className="text-sm">
                            <motion.div
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.1 }}
                              className="flex items-start gap-2"
                            >
                              <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                              <span>{improvement}</span>
                            </motion.div>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <ArrowRight className="h-4 w-4 text-primary" />
                      Recommended Next Steps
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-3">
                      {feedback.nextSteps.map((step, idx) => (
                        <li key={idx} className="text-sm">
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
                          >
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">
                              {idx + 1}
                            </span>
                            <span>{step}</span>
                          </motion.div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ScrollArea>

        <div className="p-4 border-t bg-muted/30 flex items-center justify-between gap-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-close-feedback">
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
          {onStartNew && (
            <Button onClick={onStartNew} data-testid="button-start-new-scenario">
              Start New Scenario
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
