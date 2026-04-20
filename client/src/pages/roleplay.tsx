import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Play,
  Send,
  Brain,
  Target,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  RotateCcw,
  Sparkles,
  Stethoscope,
  User,
  TrendingUp,
  Loader2,
  Radio,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { scenarios, diseaseStates, hcpCategories, influenceDrivers, specialtiesByDiseaseState, allSpecialties, getPerformanceLevel } from "@/lib/data";
import { CompactEQAnalysis, type EQAnalysisResult, type EQScore } from "@/components/live-eq-analysis";
import { SignalIntelligencePanel, type ObservableSignal } from "@/components/signal-intelligence-panel";
import { RoleplayFeedbackDialog } from "@/components/roleplay-feedback-dialog";
import type { Scenario } from "@shared/schema";

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

type RoleplayMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function normalizeScoreToFive(score?: number): number {
  if (typeof score !== "number" || Number.isNaN(score)) return 0;
  // Accept either a 0-5 or 0-100 scale and normalize to 0-5.
  if (score <= 5) {
    const clamped = Math.min(Math.max(score, 0), 5);
    return Math.round(clamped * 10) / 10;
  }
  const clamped = Math.min(Math.max(score, 0), 100);
  return Math.round(((clamped / 100) * 5) * 10) / 10;
}

function cap50<T>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];
  return items.slice(-50);
}

function stableSignalKey(signal: any): string {
  if (signal?.id != null) return `id:${String(signal.id)}`;

  const type = signal?.type ?? "";
  const severity = signal?.severity ?? "";
  const timestamp = signal?.timestamp ?? "";
  const spanStart = signal?.spanStart ?? signal?.span?.start ?? "";
  const spanEnd = signal?.spanEnd ?? signal?.span?.end ?? "";
  const quote = signal?.quote ?? signal?.evidence ?? signal?.signal ?? "";

  return `${type}|${severity}|${timestamp}|${spanStart}|${spanEnd}|${quote}`;
}

function dedupeByStableKey<T>(items: T[]): T[] {
  if (!Array.isArray(items)) return [];
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const key = stableSignalKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function extractSignals(payload: any): any[] {
  const signals = payload?.signals ?? payload?.session?.signals ?? [];
  return Array.isArray(signals) ? signals : [];
}

function mapWorkerMessages(messages?: Array<{ id?: string; role?: string; content?: string }>): RoleplayMessage[] {
  if (!Array.isArray(messages)) return [];

  return messages.map((message, index) => ({
    id: (message?.id ?? `msg-${index}`).toString(),
    role: message?.role === "user" ? "user" : "assistant",
    content: message?.content ?? "",
  }));
}

function mapWorkerEqAnalysis(eq?: { 
  score?: number; 
  empathy?: number;
  adaptability?: number;
  curiosity?: number;
  resilience?: number;
  strengths?: string[]; 
  improvements?: string[]; 
  frameworksUsed?: string[]; 
}): EQAnalysisResult | null {
  if (!eq) return null;

  // Map worker-parity's 4 new metrics to EQScore format
  // Note: curiosity is mapped to 'discovery' to align with existing UI metric definitions
  const METRIC_MAPPINGS: Record<string, string> = {
    empathy: "empathy",
    adaptability: "adaptability",
    curiosity: "discovery", // Maps to discovery questions metric in UI
    resilience: "resilience"
  };

  const scores: EQScore[] = [];
  if (typeof eq.empathy === "number") {
    scores.push({ metricId: METRIC_MAPPINGS.empathy, score: normalizeScoreToFive(eq.empathy), maxScore: 5 });
  }
  if (typeof eq.adaptability === "number") {
    scores.push({ metricId: METRIC_MAPPINGS.adaptability, score: normalizeScoreToFive(eq.adaptability), maxScore: 5 });
  }
  if (typeof eq.curiosity === "number") {
    scores.push({ metricId: METRIC_MAPPINGS.curiosity, score: normalizeScoreToFive(eq.curiosity), maxScore: 5 });
  }
  if (typeof eq.resilience === "number") {
    scores.push({ metricId: METRIC_MAPPINGS.resilience, score: normalizeScoreToFive(eq.resilience), maxScore: 5 });
  }

  const summaryParts: string[] = [];
  if (Array.isArray(eq.strengths) && eq.strengths.length) {
    summaryParts.push(`Strengths: ${eq.strengths.join(", ")}`);
  }
  if (Array.isArray(eq.improvements) && eq.improvements.length) {
    summaryParts.push(`Focus: ${eq.improvements.join(", ")}`);
  }

  // Calculate overall score from the 4 metrics if available, otherwise use score field
  let overallScore = 0;
  if (scores.length > 0) {
    overallScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;
  } else if (typeof eq.score === "number") {
    overallScore = normalizeScoreToFive(eq.score);
  }

  return {
    overallScore: overallScore || 0,
    scores: scores,
    summary: summaryParts.join(" | ") || "Conversation in progress...",
    timestamp: new Date().toISOString(),
  };
}

function mapWorkerFeedback(analysis: any): ComprehensiveFeedback {
  const root = analysis?.analysis ?? analysis;
  const overall = normalizeScoreToFive(root?.overallScore ?? root?.eqScore ?? root?.score ?? 0);

  const rawPerformanceLevel = root?.performanceLevel;
  const performanceLevel = (
    rawPerformanceLevel === "exceptional" ||
    rawPerformanceLevel === "strong" ||
    rawPerformanceLevel === "developing" ||
    rawPerformanceLevel === "emerging" ||
    rawPerformanceLevel === "needs-focus"
  )
    ? rawPerformanceLevel
    : getPerformanceLevel(overall).level;

  const eqScores = Array.isArray(root?.eqScores) ? root.eqScores : [];
  const salesSkillScores = Array.isArray(root?.salesSkillScores) ? root.salesSkillScores : [];
  const specificExamples = Array.isArray(root?.specificExamples) ? root.specificExamples : [];

  // Defensive fallback for topStrengths - ensure we always have something
  const rawTopStrengths = Array.isArray(root?.topStrengths) 
    ? root.topStrengths 
    : (Array.isArray(root?.strengths) ? root.strengths : []);
  const topStrengths = rawTopStrengths.map((s: any) => String(s)).filter(Boolean);
  if (topStrengths.length === 0) {
    topStrengths.push("Maintained professional communication throughout the conversation");
    topStrengths.push("Engaged with the scenario and provided thoughtful responses");
  }

  // Defensive fallback for priorityImprovements - ensure we always have something
  const rawImprovements = Array.isArray(root?.priorityImprovements) 
    ? root.priorityImprovements 
    : (Array.isArray(root?.areasForImprovement) 
      ? root.areasForImprovement 
      : (Array.isArray(root?.improvements) ? root.improvements : []));
  const priorityImprovements = rawImprovements.map((s: any) => String(s)).filter(Boolean);
  if (priorityImprovements.length === 0) {
    priorityImprovements.push("Practice asking 2-3 discovery questions before presenting solutions");
    priorityImprovements.push("Reference specific evidence or data points when making clinical claims");
  }

  // Defensive fallback for nextSteps - ensure we always have something
  const rawNextSteps = Array.isArray(root?.nextSteps) 
    ? root.nextSteps 
    : (Array.isArray(root?.recommendations) ? root.recommendations : []);
  const nextSteps = rawNextSteps.map((s: any) => String(s)).filter(Boolean);
  if (nextSteps.length === 0) {
    nextSteps.push("Review the conversation and identify 2-3 moments where you could have asked a discovery question");
    nextSteps.push("Prepare 3 discovery questions tailored to this stakeholder type for your next session");
    nextSteps.push("Practice a 30-second opening that establishes rapport before presenting information");
  }

  return {
    overallScore: overall,
    performanceLevel,
    eqScores: eqScores.map((eq: any) => ({
      metricId: String(eq?.metricId ?? ""),
      score: normalizeScoreToFive(eq?.score ?? 0),
      feedback: String(eq?.feedback ?? eq?.explanation ?? ""),
      observedBehaviors: typeof eq?.observedBehaviors === "number" ? eq.observedBehaviors : undefined,
      totalOpportunities: typeof eq?.totalOpportunities === "number" ? eq.totalOpportunities : undefined,
      calculationNote: typeof eq?.calculationNote === "string" ? eq.calculationNote : undefined,
    })).filter((x: any) => x.metricId),
    salesSkillScores: salesSkillScores.map((skill: any) => ({
      skillId: String(skill?.skillId ?? ""),
      skillName: String(skill?.skillName ?? skill?.name ?? ""),
      score: normalizeScoreToFive(skill?.score ?? 0),
      feedback: String(skill?.feedback ?? skill?.explanation ?? ""),
      observedBehaviors: typeof skill?.observedBehaviors === "number" ? skill.observedBehaviors : undefined,
      totalOpportunities: typeof skill?.totalOpportunities === "number" ? skill.totalOpportunities : undefined,
      calculationNote: typeof skill?.calculationNote === "string" ? skill.calculationNote : undefined,
    })).filter((x: any) => x.skillId && x.skillName),
    topStrengths,
    priorityImprovements,
    specificExamples: specificExamples.map((ex: any) => ({
      quote: String(ex?.quote ?? ""),
      analysis: String(ex?.analysis ?? ex?.feedback ?? ""),
      isPositive: Boolean(ex?.isPositive),
    })).filter((x: any) => x.quote && x.analysis),
    nextSteps,
    overallSummary: String(root?.overallSummary ?? root?.summary ?? "Your role-play session has been completed. Review the feedback above to identify strengths and areas for development."),
  };
}

const difficultyColors = {
  beginner: "bg-chart-4 text-white",
  intermediate: "bg-chart-2 text-white",
  advanced: "bg-destructive text-destructive-foreground",
};

// Mapping from disease state IDs to scenario categories
const diseaseToCategories: Record<string, string[]> = {
  "hiv": ["hiv"],
  "prep": ["hiv"],
  "oncology": ["oncology"],
  "cardiology": ["cardiology"],
  "neurology": ["neurology"],
  "infectious-disease": ["hiv", "vaccines", "covid"],
  "endocrinology": ["cardiology"],
  "respiratory": ["immunology"],
  "hepatology": ["hiv", "immunology"],
  "vaccines": ["vaccines", "covid"],
  "general-medicine": ["hiv", "oncology", "cardiology", "vaccines", "covid", "neurology", "immunology", "rare-disease"],
};

// Specialty to relevant categories
const specialtyToCategories: Record<string, string[]> = {
  "Family Medicine": ["hiv", "cardiology", "vaccines", "covid"],
  "Infectious Diseases": ["hiv", "covid", "vaccines", "immunology"],
  "Hem/Onc": ["oncology"],
  "Medical Oncology": ["oncology"],
  "Surgical Oncology": ["oncology"],
  "Radiation Oncology": ["oncology"],
  "Pediatrics": ["vaccines", "covid"],
  "Internal Medicine": ["cardiology", "covid", "hiv"],
  "Hepatology": ["hiv", "immunology"],
  "Gastroenterology": ["immunology"],
  "Pulmonology": ["immunology"],
  "Endocrinology": ["cardiology"],
  "Neurology": ["neurology"],
  "Cardiology": ["cardiology"],
  "Psychiatry": ["neurology"],
  "Pain Medicine": ["neurology"],
  "Allergy/Immunology": ["immunology"],
};

export default function RolePlayPage() {
  const [selectedScenario, setSelectedScenario] = useState<Scenario | null>(null);
  const [input, setInput] = useState("");
  // 4-dropdown state matching AI Coach
  const [selectedDiseaseState, setSelectedDiseaseState] = useState<string>("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("");
  const [selectedHcpCategory, setSelectedHcpCategory] = useState<string>("");
  const [selectedInfluenceDriver, setSelectedInfluenceDriver] = useState<string>("");
  const [showAllScenarios, setShowAllScenarios] = useState(false);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackData, setFeedbackData] = useState<ComprehensiveFeedback | null>(null);
  const [feedbackScenarioTitle, setFeedbackScenarioTitle] = useState<string>("");
  const [observableSignals, setObservableSignals] = useState<ObservableSignal[]>([]);
  const [sessionSignals, setSessionSignals] = useState<ObservableSignal[]>([]);
  const [sessionEQ, setSessionEQ] = useState<EQAnalysisResult | null>(null);
  const queryClient = useQueryClient();

  // Get derived values for display
  const selectedDisease = diseaseStates.find(d => d.id === selectedDiseaseState);
  const selectedCategory = hcpCategories.find(c => c.id === selectedHcpCategory);
  const selectedDriver = influenceDrivers.find(d => d.id === selectedInfluenceDriver);

  // Get available specialties based on disease state
  const availableSpecialties = selectedDiseaseState
    ? (specialtiesByDiseaseState[selectedDiseaseState] || allSpecialties)
    : allSpecialties;

  // Clear specialty if it's no longer in filtered list (matching AI Coach behavior)
  useEffect(() => {
    if (selectedSpecialty && !availableSpecialties.includes(selectedSpecialty)) {
      setSelectedSpecialty("");
    }
  }, [selectedDiseaseState, availableSpecialties, selectedSpecialty]);

  // Filter scenarios based on dropdown selections
  const filteredScenarios = (() => {
    if (showAllScenarios || !selectedDiseaseState) {
      return scenarios;
    }

    // Disease state is the primary filter
    if (selectedDiseaseState && diseaseToCategories[selectedDiseaseState]) {
      let filtered = scenarios.filter(s =>
        diseaseToCategories[selectedDiseaseState].includes(s.category)
      );

      // Further filter by specialty if selected
      if (selectedSpecialty && specialtyToCategories[selectedSpecialty]) {
        const specialtyCategories = specialtyToCategories[selectedSpecialty];
        filtered = filtered.filter(s => specialtyCategories.includes(s.category));
      }

      return filtered;
    }

    return scenarios;
  })();

  const hasActiveFilters = selectedDiseaseState || selectedSpecialty || selectedHcpCategory || selectedInfluenceDriver;
  const isFiltered = hasActiveFilters && !showAllScenarios && filteredScenarios.length !== scenarios.length;

  // Clear selected scenario if it's no longer in filtered list
  useEffect(() => {
    if (selectedScenario && !filteredScenarios.find(s => s.id === selectedScenario.id)) {
      setSelectedScenario(null);
      setTailoredContent(null);
    }
  }, [filteredScenarios, selectedScenario]);

  // State for tailored content
  const [tailoredContent, setTailoredContent] = useState<{
    stakeholder: string;
    objective: string;
    context: string;
    challenges: string[];
    keyMessages: string[];
    impact: string[];
    suggestedPhrasing: string[];
  } | null>(null);

  // Without a tailor endpoint, always reset to base scenario content when context changes
  useEffect(() => {
    if (!selectedScenario) {
      setTailoredContent(null);
      return;
    }

    setTailoredContent(null);
  }, [selectedScenario?.id, selectedDiseaseState, selectedSpecialty, selectedHcpCategory, selectedInfluenceDriver]);

  // Get the content to display (tailored or original)
  const displayStakeholder = tailoredContent?.stakeholder || selectedScenario?.stakeholder || "";
  const displayObjective = tailoredContent?.objective || selectedScenario?.objective || "";
  const displayContext = tailoredContent?.context || selectedScenario?.context || "";
  const displayChallenges = tailoredContent?.challenges || selectedScenario?.challenges || [];
  const displayKeyMessages = tailoredContent?.keyMessages || selectedScenario?.keyMessages || [];
  const displayImpact = tailoredContent?.impact || selectedScenario?.impact || [];
  const displaySuggestedPhrasing = tailoredContent?.suggestedPhrasing || selectedScenario?.suggestedPhrasing || [];
  const isLoadingTailoredContent = false;

  const roleplayContext = {
    diseaseState: selectedDiseaseState,
    specialty: selectedSpecialty,
    hcpCategory: selectedHcpCategory,
    influenceDriver: selectedInfluenceDriver,
  };

  type RoleplaySignal = ObservableSignal & { severity?: number; evidence?: string };

  const { data: roleplayData } = useQuery<{
    session: any | null;
    messages: RoleplayMessage[];
    signals: RoleplaySignal[];
  }>({
    queryKey: ["/api/roleplay/session"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/roleplay/session");
      const data = await response.json();
      const signals = extractSignals(data);
      return {
        session: data?.session ?? null,
        messages: mapWorkerMessages(data?.session?.messages),
        signals: signals as RoleplaySignal[],
      };
    },
  });

  const messages = roleplayData?.messages || [];
  const isActive = messages.length > 0;

  const roleplaySessionKey = isActive
    ? `${selectedScenario?.id ?? "unknown"}:${messages[0]?.id ?? "unknown"}`
    : null;

  const endCalledForSessionRef = useRef<Set<string>>(new Set());
  const [roleplayEndError, setRoleplayEndError] = useState<string | null>(null);

  // REMOVE: This useEffect was resetting signals on query changes
  // useEffect(() => {
  //   if (!isActive) {
  //     setObservableSignals([]);
  //     return;
  //   }
  //   const serverSignals = Array.isArray(roleplayData?.signals) ? roleplayData!.signals : [];
  //   if (serverSignals.length > 0) {
  //     setObservableSignals((prev) => {
  //       const combined = [...prev, ...serverSignals];
  //       const deduped = dedupeByStableKey(combined);
  //       return cap50(deduped) as any;
  //     });
  //   }
  // }, [isActive, roleplayData?.signals]);


  // Keep query for data fetching, but sessionEQ is source of truth
  const {
    data: eqAnalysis,
    isLoading: isEQLoading,
    refetch: refetchEQ,
  } = useQuery<EQAnalysisResult>({
    queryKey: ["/api/roleplay/eq-analysis"],
    queryFn: async () => {
      const response = await apiRequest("POST", "/api/roleplay/eq-analysis");
      const data = await response.json();
      // Update session state when query succeeds
      if (data?.eqAnalysis) {
        const mapped = mapWorkerEqAnalysis(data.eqAnalysis);
        if (mapped) {
          setSessionEQ(mapped);
        }
      }
      return data;
    },
    enabled: isActive && (messages.filter(m => m.role === "user").length ?? 0) > 0,
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });

  const startScenarioMutation = useMutation({
    mutationFn: async (scenario: Scenario) => {
      const response = await apiRequest("POST", "/api/roleplay/start", {
        scenarioId: scenario.id,
        difficulty: scenario.difficulty,
        scenario,
        context: roleplayContext,
      });
      return response.json();
    },
    onSuccess: () => {
      // Clear session state when starting new scenario
      setSessionSignals([]);
      setSessionEQ(null);
      queryClient.invalidateQueries({ queryKey: ["/api/roleplay/session"] });
    },
  });

  const sendResponseMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/roleplay/respond", { message: content });
      return response.json();
    },
    onSuccess: (data) => {
      // Accumulate signals in session state (never clear)
      const newSignals = extractSignals(data) as RoleplaySignal[];
      if (newSignals.length > 0) {
        setSessionSignals((prev) => {
          const combined = [...prev, ...newSignals];
          const deduped = dedupeByStableKey(combined);
          return cap50(deduped) as any;
        });
      }
      
      // Update EQ analysis in session state
      if (data?.eqAnalysis) {
        const mapped = mapWorkerEqAnalysis(data.eqAnalysis);
        if (mapped) {
          setSessionEQ(mapped);
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/roleplay/session"] });
      setTimeout(() => refetchEQ(), 500);
    },
  });

  const endScenarioMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/roleplay/end");
      if (!response.ok) {
        throw new Error(`roleplay_end_http_${response.status}`);
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/roleplay/session"] });
      
      // Use session state + worker feedback
      const analysis = data?.analysis || data;
      if (analysis && Number.isFinite(analysis?.eqScore)) {
        const mappedFeedback = mapWorkerFeedback(analysis);
        setFeedbackData(mappedFeedback);
        setFeedbackScenarioTitle(data.scenario?.title || selectedScenario?.title || "Role-Play Session");
        console.log("ROLEPLAY_END_RENDERED");
        setShowFeedbackDialog(true);
      } else {
        setRoleplayEndError("Unable to generate feedback. Please try again.");
        setShowFeedbackDialog(false);
      }
    },
    onError: () => {
      setRoleplayEndError("Unable to end role-play. Please try again.");
      setShowFeedbackDialog(false);
    }
  });

  const clearScenarioMutation = useMutation({
    mutationFn: async () => {
      // Clear the server-side roleplay session without showing feedback.
      // Uses existing /end route (no new endpoints, no coach changes).
      const response = await apiRequest("POST", "/api/roleplay/end");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/roleplay/session"] });
    },
  });

  const handleStart = () => {
    if (selectedScenario) {
      startScenarioMutation.mutate(selectedScenario);
    }
  };

  const handleSend = () => {
    if (!input.trim() || sendResponseMutation.isPending) return;
    sendResponseMutation.mutate(input);
    setInput("");
  };

  const handleReset = () => {
    if (isActive) {
      if (roleplaySessionKey && !endCalledForSessionRef.current.has(roleplaySessionKey)) {
        endCalledForSessionRef.current.add(roleplaySessionKey);
        clearScenarioMutation.mutate();
      }
    }
    setSelectedScenario(null);
    setTailoredContent(null);
    setSessionSignals([]);  // Clear session signals
    setSessionEQ(null);      // Clear session EQ
    setObservableSignals([]);
    setShowFeedbackDialog(false);
    setFeedbackData(null);
    setRoleplayEndError(null);
    queryClient.invalidateQueries({ queryKey: ["/api/roleplay/session"] });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-6 border-b flex-shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-chart-2 flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold" data-testid="text-roleplay-title">Role-Play Simulator</h1>
              <p className="text-sm text-muted-foreground">
                Practice pharma sales scenarios with AI feedback
              </p>
            </div>
          </div>
          {isActive && (
            <Button variant="outline" size="sm" onClick={handleReset} data-testid="button-reset-roleplay">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          )}
        </div>

        {!isActive && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
              <Select value={selectedDiseaseState} onValueChange={setSelectedDiseaseState}>
                <SelectTrigger data-testid="select-roleplay-disease-state">
                  <SelectValue placeholder="Disease State" />
                </SelectTrigger>
                <SelectContent>
                  {diseaseStates.map((disease) => (
                    <SelectItem key={disease.id} value={disease.id}>
                      {disease.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                <SelectTrigger data-testid="select-roleplay-specialty">
                  <SelectValue placeholder="Specialty" />
                </SelectTrigger>
                <SelectContent>
                  {availableSpecialties.map((specialty) => (
                    <SelectItem key={specialty} value={specialty}>
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedHcpCategory} onValueChange={setSelectedHcpCategory}>
                <SelectTrigger data-testid="select-roleplay-hcp-category">
                  <SelectValue placeholder="HCP Category" />
                </SelectTrigger>
                <SelectContent>
                  {hcpCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedInfluenceDriver} onValueChange={setSelectedInfluenceDriver}>
                <SelectTrigger data-testid="select-roleplay-influence-driver">
                  <SelectValue placeholder="Influence Driver" />
                </SelectTrigger>
                <SelectContent>
                  {influenceDrivers.map((driver) => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(selectedDisease || selectedSpecialty || selectedCategory || selectedDriver) && (
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                {selectedDisease && (
                  <Badge variant="secondary" data-testid="badge-roleplay-selected-disease">
                    {selectedDisease.name}
                  </Badge>
                )}
                {selectedSpecialty && (
                  <Badge variant="outline" data-testid="badge-roleplay-selected-specialty">
                    {selectedSpecialty}
                  </Badge>
                )}
                {selectedCategory && (
                  <Badge variant="outline" data-testid="badge-roleplay-selected-category">
                    {selectedCategory.name}
                  </Badge>
                )}
                {selectedDriver && (
                  <Badge variant="outline" data-testid="badge-roleplay-selected-driver">
                    {selectedDriver.name}
                  </Badge>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {!isActive ? (
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-4xl mx-auto">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Select a Scenario
                  {isFiltered && (
                    <Badge variant="outline" className="text-xs font-normal">
                      {filteredScenarios.length} of {scenarios.length} scenarios
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  {isFiltered
                    ? `Showing scenarios relevant to your selected filters.`
                    : "Choose a pharma sales scenario to practice. Each scenario includes unique challenges and stakeholder dynamics."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedScenario?.id || ""}
                  onValueChange={(value) => setSelectedScenario(filteredScenarios.find(s => s.id === value) || null)}
                >
                  <SelectTrigger data-testid="select-scenario">
                    <SelectValue placeholder={filteredScenarios.length > 0 ? "Choose a scenario..." : "No matching scenarios"} />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredScenarios.map((scenario) => (
                      <SelectItem key={scenario.id} value={scenario.id}>
                        <div className="flex items-center gap-2">
                          <span>{scenario.title}</span>
                          <Badge className={difficultyColors[scenario.difficulty]} variant="secondary">
                            {scenario.difficulty}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isFiltered && filteredScenarios.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    No scenarios match your current filters. Try selecting a different disease state or specialty.
                  </p>
                )}
              </CardContent>
            </Card>

            {selectedScenario && (
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle data-testid="text-scenario-title">{selectedScenario.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {selectedScenario.description}
                      </CardDescription>
                    </div>
                    <Badge className={difficultyColors[selectedScenario.difficulty]}>
                      {selectedScenario.difficulty}
                    </Badge>
                  </div>
                </CardHeader>
                {/* Dynamic Content Section - AI Tailored based on context */}
                {(selectedDiseaseState || selectedSpecialty || selectedHcpCategory || selectedInfluenceDriver) && (
                  <div className="flex items-center flex-wrap gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2 mb-4 mx-6">
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span>Scenario tailored for: </span>
                    {selectedDisease && <Badge variant="secondary" className="text-xs">{selectedDisease.name}</Badge>}
                    {selectedSpecialty && <Badge variant="outline" className="text-xs">{selectedSpecialty}</Badge>}
                    {selectedCategory && <Badge variant="outline" className="text-xs">{selectedCategory.name}</Badge>}
                    {selectedDriver && <Badge variant="outline" className="text-xs">{selectedDriver.name}</Badge>}
                    {isLoadingTailoredContent && <Loader2 className="h-3 w-3 animate-spin ml-2" />}
                  </div>
                )}
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Stakeholder
                        {isLoadingTailoredContent && <Loader2 className="h-3 w-3 animate-spin" />}
                      </h4>
                      {isLoadingTailoredContent ? (
                        <Skeleton className="h-4 w-3/4" />
                      ) : (
                        <p className="text-sm text-muted-foreground">{displayStakeholder}</p>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Objective
                        {isLoadingTailoredContent && <Loader2 className="h-3 w-3 animate-spin" />}
                      </h4>
                      {isLoadingTailoredContent ? (
                        <Skeleton className="h-4 w-full" />
                      ) : (
                        <p className="text-sm text-muted-foreground">{displayObjective}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      Context
                      {isLoadingTailoredContent && <Loader2 className="h-3 w-3 animate-spin" />}
                    </h4>
                    {isLoadingTailoredContent ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">{displayContext}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        Challenges
                        {isLoadingTailoredContent && <Loader2 className="h-3 w-3 animate-spin" />}
                      </h4>
                      {isLoadingTailoredContent ? (
                        <div className="space-y-2">
                          {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-4 w-full" />
                          ))}
                        </div>
                      ) : (
                        <ul className="space-y-1">
                          {displayChallenges.map((challenge, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <ChevronRight className="h-4 w-4 flex-shrink-0 mt-0.5" />
                              {challenge}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-chart-4" />
                        Key Messages
                        {isLoadingTailoredContent && <Loader2 className="h-3 w-3 animate-spin" />}
                      </h4>
                      {isLoadingTailoredContent ? (
                        <div className="space-y-2">
                          {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-4 w-full" />
                          ))}
                        </div>
                      ) : (
                        <ul className="space-y-1">
                          {displayKeyMessages.map((msg, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <ChevronRight className="h-4 w-4 flex-shrink-0 mt-0.5" />
                              {msg}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {displayImpact.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Impact
                        {isLoadingTailoredContent && <Loader2 className="h-3 w-3 animate-spin" />}
                      </h4>
                      {isLoadingTailoredContent ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-4 w-full" />
                          ))}
                        </div>
                      ) : (
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-1">
                          {displayImpact.map((item, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <ChevronRight className="h-4 w-4 flex-shrink-0 mt-0.5" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {displaySuggestedPhrasing.length > 0 && (
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-chart-2" />
                        Suggested Phrasing
                        {isLoadingTailoredContent && <Loader2 className="h-3 w-3 animate-spin" />}
                      </h4>
                      {isLoadingTailoredContent ? (
                        <div className="space-y-3">
                          {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-8 w-full" />
                          ))}
                        </div>
                      ) : (
                        <ul className="space-y-2">
                          {displaySuggestedPhrasing.map((phrase, i) => (
                            <li key={i} className="text-sm text-muted-foreground italic flex items-start gap-2">
                              <span className="text-chart-2 font-medium not-italic">{i + 1}.</span>
                              "{phrase}"
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  <Button onClick={handleStart} className="w-full" disabled={startScenarioMutation.isPending} data-testid="button-start-roleplay">
                    <Play className="h-4 w-4 mr-2" />
                    Start Role-Play
                  </Button>
                </CardContent>
              </Card>
            )}

            {!selectedScenario && (
              <div className="space-y-4">
                {/* Filter status and Show All toggle */}
                {hasActiveFilters && (
                  <div className="flex items-center justify-between flex-wrap gap-2 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Sparkles className="h-4 w-4 text-primary" />
                      {isFiltered ? (
                        <span className="text-sm">
                          Showing <strong>{filteredScenarios.length}</strong> recommended scenarios
                          {selectedDisease && <Badge variant="secondary" className="ml-2">{selectedDisease.name}</Badge>}
                          {selectedSpecialty && <Badge variant="outline" className="ml-1">{selectedSpecialty}</Badge>}
                        </span>
                      ) : (
                        <span className="text-sm">Showing all {scenarios.length} scenarios</span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAllScenarios(!showAllScenarios)}
                      data-testid="button-toggle-show-all"
                    >
                      {showAllScenarios ? "Show Recommended" : "Show All"}
                    </Button>
                  </div>
                )}

                {/* Scenario grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredScenarios.map((scenario) => (
                    <Card
                      key={scenario.id}
                      className="hover-elevate cursor-pointer"
                      onClick={() => setSelectedScenario(scenario)}
                      data-testid={`card-scenario-${scenario.id}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Badge variant="outline">{scenario.category}</Badge>
                          <Badge className={difficultyColors[scenario.difficulty]}>
                            {scenario.difficulty}
                          </Badge>
                        </div>
                        <h3 className="font-semibold mb-1">{scenario.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {scenario.description}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Empty state when no matching scenarios */}
                {filteredScenarios.length === 0 && (
                  <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium mb-2">No matching scenarios</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      No scenarios match your current selection. Try adjusting your filters or view all scenarios.
                    </p>
                    <Button onClick={() => setShowAllScenarios(true)} data-testid="button-show-all-empty">
                      Show All Scenarios
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex gap-6 p-6 overflow-hidden">
          <div className="flex-1 flex flex-col min-w-0">
            {selectedScenario && (
              <div className="mb-4 p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{selectedScenario.title}</p>
                    <p className="text-xs text-muted-foreground">{selectedScenario.stakeholder}</p>
                  </div>
                  <Badge className={difficultyColors[selectedScenario.difficulty]}>
                    {selectedScenario.difficulty}
                  </Badge>
                </div>
              </div>
            )}

            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4 pb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-chart-2 text-white"
                        }`}
                    >
                      {message.role === "user" ? (
                        <span className="text-xs font-medium">You</span>
                      ) : (
                        <Users className="h-4 w-4" />
                      )}
                    </div>
                    <div className={`flex-1 max-w-[80%] ${message.role === "user" ? "text-right" : ""}`}>
                      <div
                        className={`inline-block p-3 rounded-lg ${message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                          }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {sendResponseMutation.isPending && (
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-chart-2 text-white flex items-center justify-center">
                      <Users className="h-4 w-4 animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <div className="inline-block p-3 rounded-lg bg-muted">
                        <div className="flex items-center gap-2">
                          <div className="flex space-x-1">
                            <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce" />
                            <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:150ms]" />
                            <div className="h-2 w-2 rounded-full bg-muted-foreground animate-bounce [animation-delay:300ms]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="pt-4 border-t space-y-2">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Your response to the stakeholder..."
                  className="min-h-[60px] resize-none"
                  data-testid="input-roleplay-response"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || sendResponseMutation.isPending}
                  className="self-end"
                  data-testid="button-send-response"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  if (typeof window !== "undefined" && !window.location.pathname.includes("roleplay")) return;
                  if (!roleplaySessionKey) return;
                  if (endCalledForSessionRef.current.has(roleplaySessionKey)) return;
                  endCalledForSessionRef.current.add(roleplaySessionKey);
                  setRoleplayEndError(null);
                  endScenarioMutation.mutate();
                }}
                disabled={endScenarioMutation.isPending || (roleplaySessionKey ? endCalledForSessionRef.current.has(roleplaySessionKey) : false)}
                data-testid="button-end-roleplay"
              >
                End Role-Play & Get Feedback
              </Button>
              {roleplayEndError && (
                <div className="text-sm text-destructive" role="alert" data-testid="roleplay-end-error">
                  {roleplayEndError}
                </div>
              )}
            </div>
          </div>

          <Card className="w-80 flex-shrink-0 hidden xl:flex flex-col">
            <CardContent className="flex-1 pt-6 space-y-6">
              <SignalIntelligencePanel
                signals={sessionSignals}
                isLoading={sendResponseMutation.isPending}
                hasActivity={sessionSignals.length > 0}
                compact={true}
              />

              <div className="border-t pt-4">
                <CompactEQAnalysis
                  analysis={sessionEQ}
                  isLoading={isEQLoading || sendResponseMutation.isPending}
                  hasMessages={messages.filter(m => m.role === "user").length > 0}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <RoleplayFeedbackDialog
        open={showFeedbackDialog}
        onOpenChange={setShowFeedbackDialog}
        feedback={feedbackData}
        scenarioTitle={feedbackScenarioTitle}
        onStartNew={() => {
          setShowFeedbackDialog(false);
          setFeedbackData(null);
          handleReset();
        }}
      />
    </div>
  );
}
