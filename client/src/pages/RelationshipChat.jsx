import React, { useMemo, useState } from "react";
import { api } from "@/api/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2,
  Sparkles,
  Heart,
  MessageSquareText,
  Scale,
  BrainCircuit,
  HeartHandshake,
  ShieldAlert,
  Ear,
  Clock3,
  Lightbulb,
  Search,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import CreditLimitBanner from "@/components/ui/CreditLimitBanner";
import ResponseExportBar from "@/components/export/ResponseExportBar";
import { useRelationshipAuth } from "@/context/RelationshipAuthContext";
import { getRelationshipCoachLabel, getRelationshipTerms } from "@/lib/relationshipParticipants";

function getCategoryLabels(relationshipTerms) {
  return {
    surface: "Surface Pattern",
    behavioral: "Behavioral Pattern",
    communication: "Communication Style",
    emotional_triggers: "Emotional Trigger",
    conflict_style: "Conflict Style",
    energy_social: "Energy and Social Needs",
    deep_reflection: "Deep Reflection",
    family_upbringing: "Family and Upbringing",
    partner_perception:
      relationshipTerms?.type === "romantic"
        ? "Partner Perception"
        : `${relationshipTerms?.typeLabel || "Connection"} Perception`,
    needs_vulnerability: "Needs and Vulnerability",
    then_vs_now: "Then vs. Now",
  };
}

function buildSectionPrompts(primaryPerson, secondaryPerson, relationshipTerms, relationshipLabel) {
  const bond = relationshipTerms?.bond || "connection";
  return [
    {
      title: "Conflict Style",
      description: "How each of you tends to enter, pace, and experience conflict.",
      icon: Scale,
      prompt: `How do ${primaryPerson} and ${secondaryPerson} each approach conflict, and where do their styles clash most?`,
      summaryPrompt: `Summarize ${primaryPerson} and ${secondaryPerson}'s conflict style differences in 4 concise bullets.`,
    },
    {
      title: "Triggers",
      description: "What tends to activate each person emotionally during hard moments.",
      icon: ShieldAlert,
      prompt: `What triggers ${primaryPerson} most, what triggers ${secondaryPerson} most, and what usually happens next?`,
      summaryPrompt: `Summarize ${primaryPerson} and ${secondaryPerson}'s biggest triggers and how to avoid escalating them.`,
    },
    {
      title: "Communication",
      description: "What tone, pacing, and communication style each person responds to best.",
      icon: MessageSquareText,
      prompt: `What communication style works best for ${primaryPerson} and what communication style works best for ${secondaryPerson}?`,
      summaryPrompt: `Summarize the communication style that works best for ${primaryPerson} and ${secondaryPerson}.`,
    },
    {
      title: "Emotional Processing",
      description: "How each person handles hurt, overwhelm, and emotional intensity.",
      icon: BrainCircuit,
      prompt: `How do ${primaryPerson} and ${secondaryPerson} each process hurt, stress, and emotional overwhelm?`,
      summaryPrompt: `Summarize how ${primaryPerson} and ${secondaryPerson} each process hurt and overwhelm.`,
    },
    {
      title: "What Helps Repair",
      description: "What tends to help each of you feel reconnected after distance or friction.",
      icon: HeartHandshake,
      prompt: `How can ${primaryPerson} and ${secondaryPerson} reconnect after a fight or tense moment in a way that actually lands?`,
      summaryPrompt: `Summarize what helps ${primaryPerson} and ${secondaryPerson} repair and reconnect.`,
    },
    {
      title: "Feeling Heard",
      description: "What each person needs in order to feel understood and emotionally received.",
      icon: Ear,
      prompt: `What does ${primaryPerson} need to feel heard, and what does ${secondaryPerson} need to feel heard?`,
      summaryPrompt: `Summarize what helps ${primaryPerson} and ${secondaryPerson} feel heard and emotionally understood.`,
    },
    {
      title: "Stress Response",
      description: "How outside stress tends to show up between the two of you.",
      icon: Clock3,
      prompt: `How should ${secondaryPerson} approach ${primaryPerson} when they're stressed, and how should ${primaryPerson} approach ${secondaryPerson} when they're stressed?`,
      summaryPrompt: "Summarize how each person should be approached during stress.",
    },
    {
      title: "What To Do Next",
      description: `Actionable next-step coaching grounded in your actual questionnaire patterns for this ${bond}.`,
      icon: Lightbulb,
      prompt: `Given everything you know about ${primaryPerson} and ${secondaryPerson}, what are the 5 most useful next moves to focus on inside ${relationshipLabel}?`,
      summaryPrompt: `Summarize the 5 highest-priority next steps for ${primaryPerson} and ${secondaryPerson} inside ${relationshipLabel}.`,
    },
  ];
}

function formatCategoryName(value, relationshipTerms) {
  const labels = getCategoryLabels(relationshipTerms);
  return labels[value] || value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function buildSystemPrompt(scope, participants, primaryResponses, secondaryResponses, relationshipTerms, relationshipLabel) {
  const [primaryPerson = "Person A", secondaryPerson = "Other Person"] = participants;
  const labels = getCategoryLabels(relationshipTerms);
  const bond = relationshipTerms?.bond || "connection";
  const coachLabel = getRelationshipCoachLabel(relationshipTerms);
  const primaryContext = primaryResponses
    .map((q) => `Category: ${labels[q.category] || formatCategoryName(q.category || "", relationshipTerms)}\nQuestion: ${q.question_text || q.question || ""}\n${primaryPerson}: ${q.answer_text || q.answer || q.response_value || ""}`)
    .join("\n\n");

  const secondaryContext = secondaryResponses
    .map((q) => `Category: ${labels[q.category] || formatCategoryName(q.category || "", relationshipTerms)}\nQuestion: ${q.question_text || q.question || ""}\n${secondaryPerson}: ${q.answer_text || q.answer || q.response_value || ""}`)
    .join("\n\n");

  return `You are an expert ${coachLabel} with deep knowledge of ${primaryPerson} and ${secondaryPerson}'s ${bond}. You have studied their full questionnaire responses and can give highly personalized, specific guidance. You never give generic advice — you always reference what ${primaryPerson} and ${secondaryPerson} have actually said.

IMPORTANT RULES:
- Always cite specific answers from their questionnaires when relevant.
- Never expose internal raw category keys like [CONFLICT_STYLE] or [BEHAVIORAL] in your response.
- If you reference a category, write it in clean human language such as "Conflict Style" or "Behavioral Pattern".
- Use clear section headers, concise paragraphs, and practical guidance.
- Be warm, direct, and empathetic.
- Never take sides — hold both perspectives with equal care.
- Current scope: ${scope === "both" ? `${primaryPerson} & ${secondaryPerson} (${bond} view)` : scope === primaryPerson ? `${primaryPerson}'s perspective` : `${secondaryPerson}'s perspective`}

${primaryPerson.toUpperCase()}'S FULL QUESTIONNAIRE RESPONSES:
${primaryContext}

${secondaryPerson.toUpperCase()}'S FULL QUESTIONNAIRE RESPONSES:
${secondaryContext}

You are ready to answer questions about ${primaryPerson}, ${secondaryPerson}, and ${relationshipLabel} with full context.`;
}

function prettifyResponseText(text) {
  if (!text) return "";

  return text
    .replace(/\[([A-Z_]+)\]/g, (_, label) => formatCategoryName(label.toLowerCase()))
    .replace(/\(([\w_]+)\)\s*Q:/g, (_, label) => `${formatCategoryName(label.toLowerCase())}:`)
    .replace(/\s{3,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export default function RelationshipChat() {
  const { activeRelationshipId, participants, relationshipLabel, activeRelationship } = useRelationshipAuth();
  const [primaryPerson = "Person A", secondaryPerson = "Other Person"] = participants;
  const relationshipTerms = getRelationshipTerms(activeRelationship);
  const coachLabel = getRelationshipCoachLabel(relationshipTerms);
  const sectionPrompts = useMemo(
    () => buildSectionPrompts(primaryPerson, secondaryPerson, relationshipTerms, relationshipLabel),
    [primaryPerson, secondaryPerson, relationshipTerms, relationshipLabel],
  );
  const [situation, setSituation] = useState("");
  const [focusPrompt, setFocusPrompt] = useState(sectionPrompts[0]?.prompt || "");
  const [analysisResult, setAnalysisResult] = useState("");
  const [analysisTitle, setAnalysisTitle] = useState("Reflection Mirror Output");
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState("both");
  const [creditError, setCreditError] = useState(false);

  const { data: primaryResponses = [] } = useQuery({
    queryKey: ["chat-responses-primary", activeRelationshipId, primaryPerson],
    queryFn: () => api.entities.QuestionnaireResponse.filter({ person_name: primaryPerson }),
  });
  const { data: secondaryResponses = [] } = useQuery({
    queryKey: ["chat-responses-secondary", activeRelationshipId, secondaryPerson],
    queryFn: () => api.entities.QuestionnaireResponse.filter({ person_name: secondaryPerson }),
  });

  const runMirrorAnalysis = async (promptText, promptTitle = "Reflection Mirror Output") => {
    const focus = String(promptText || focusPrompt || "").trim();
    const contextDetails = String(situation || "").trim();
    if (!focus && !contextDetails) return;

    setCreditError(false);
    setLoading(true);

    const prompt = `${buildSystemPrompt(scope, participants, primaryResponses, secondaryResponses, relationshipTerms, relationshipLabel)}

TASK:
Create a single structured Reflection Mirror analysis with these sections:
1) Situation Snapshot
2) ${primaryPerson}'s likely perspective
3) ${secondaryPerson}'s likely perspective
4) Potential misreads and escalation risks
5) Evidence-backed intervention options
6) A 24-hour repair script
7) A 7-day behavior experiment

Use evidence-based techniques explicitly where relevant (for example: nonviolent communication, cognitive reappraisal, attachment-informed framing, emotional regulation, active listening, perspective-taking, conflict de-escalation, and culturally responsive communication).
Do not produce a back-and-forth chat response. Produce one focused professional analysis.

FOCUS REQUEST:
${focus || "General reflection mirror analysis"}

SITUATION DETAILS:
${contextDetails || "No extra situation details provided."}

Respond as the ${coachLabel}. Use clean headers and practical guidance.`;

    try {
      const result = await api.integrations.Core.InvokeLLM({ prompt, model: "claude_sonnet_4_6" });
      const rawText = typeof result === "string" ? result : result?.response || "I wasn't able to generate a response. Please try again.";
      const aiText = prettifyResponseText(rawText);
      setAnalysisTitle(promptTitle);
      setAnalysisResult(aiText);
    } catch (err) {
      if (err?.response?.status === 402 || err?.message?.includes("402") || err?.message?.includes("credit")) {
        setCreditError(true);
      } else {
        setAnalysisResult("Something went wrong. Please try again.");
        setAnalysisTitle("Reflection Mirror Output");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="enterprise-panel flex shrink-0 items-center justify-between border-2 border-[#0e6f72]/20 bg-[#f4fbfa] dark:border-primary/35 dark:bg-card px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#0e6f72]/15 bg-white dark:border-primary/30 dark:bg-background">
            <Heart className="h-5 w-5 text-[#0e6f72]" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">
              Reflection Mirror
            </h1>
            <p className="text-xs text-muted-foreground">Single-run, questionnaire-grounded dual-perspective analysis for {relationshipLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={scope} onValueChange={setScope}>
            <SelectTrigger className="h-9 w-40 rounded-full border-[#0e6f72]/20 bg-white text-xs dark:border-primary/30 dark:bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="both">{primaryPerson} &amp; {secondaryPerson}</SelectItem>
              <SelectItem value={primaryPerson}>{primaryPerson}&apos;s perspective</SelectItem>
              <SelectItem value={secondaryPerson}>{secondaryPerson}&apos;s perspective</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {creditError && (
        <div className="shrink-0">
          <CreditLimitBanner />
        </div>
      )}

      <div className="space-y-6">
        <div className="enterprise-panel border-2 border-[#0e6f72]/15 bg-[#f8fbfd] dark:border-primary/30 dark:bg-card py-8 text-center space-y-2">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#0e6f72]/15 bg-white dark:border-primary/30 dark:bg-background">
            <Sparkles className="h-7 w-7 text-[#0e6f72]" />
          </div>
          <h2 className="font-display text-lg font-semibold text-foreground">Structured Reflection Mirror</h2>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
            Use one focused prompt plus your situation details. This generates a single robust analysis without live chat.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {sectionPrompts.map((section) => (
            <button
              key={section.title}
              type="button"
              onClick={() => {
                setFocusPrompt(section.prompt);
                setAnalysisTitle(section.title);
                runMirrorAnalysis(section.prompt, section.title);
              }}
              className="enterprise-hover-raise flex h-full flex-col rounded-2xl border border-[#0e6f72]/20 bg-white p-4 text-left shadow-sm dark:border-primary/30 dark:bg-card"
              disabled={loading}
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl border border-[#0e6f72]/15 bg-[#eef8f7] dark:border-primary/30 dark:bg-background">
                <section.icon className="h-4 w-4 text-[#0e6f72]" />
              </div>
              <h3 className="text-base font-semibold text-[#14263f] dark:text-foreground">{section.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-[#4e6077] dark:text-muted-foreground">{section.description}</p>
              <p className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-[#0e6f72] dark:text-primary">
                <Search className="h-3.5 w-3.5" /> Run analysis
              </p>
            </button>
          ))}
        </div>

        <div className="enterprise-panel shrink-0 border-2 border-[#0e6f72]/15 bg-[#f8fbfd] dark:border-primary/30 dark:bg-card p-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0e6f72]">Situation Details</p>
            <Textarea
              placeholder={`Describe the specific situation between ${primaryPerson} and ${secondaryPerson}...`}
              value={situation}
              onChange={(event) => setSituation(event.target.value)}
              className="min-h-[120px] resize-y rounded-2xl border-2 bg-white text-sm py-3 dark:bg-background"
              disabled={loading}
            />
            <p className="text-[11px] text-muted-foreground">Include exact wording, emotional tone, and what outcome you want next.</p>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#0e6f72]">Focus Prompt</p>
              <Textarea
                value={focusPrompt}
                onChange={(event) => setFocusPrompt(event.target.value)}
                className="min-h-[72px] rounded-2xl border-2 bg-white text-sm dark:bg-background"
                disabled={loading}
              />
            </div>
            <Button
              onClick={() => runMirrorAnalysis(focusPrompt || "General reflection mirror analysis", analysisTitle || "Reflection Mirror Output")}
              disabled={loading || (!focusPrompt.trim() && !situation.trim())}
              className="h-12 rounded-full border-2 border-teal-500 bg-[#14263f] px-6 text-white hover:bg-[#0f1d31]"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              <span className="ml-2">Generate Mirror Analysis</span>
            </Button>
          </div>
        </div>

        {analysisResult ? (
          <div className="enterprise-panel rounded-2xl border border-[#0e6f72]/15 bg-white dark:border-primary/30 dark:bg-card p-5">
            <div className="mb-3 flex items-center gap-2 text-[#14263f] dark:text-foreground">
              <MessageSquareText className="h-4 w-4 text-[#0e6f72]" />
              <h3 className="text-sm font-semibold uppercase tracking-[0.12em]">{analysisTitle}</h3>
            </div>
            <div className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              <ReactMarkdown>{analysisResult}</ReactMarkdown>
            </div>
            <div className="mt-4">
              <ResponseExportBar
                content={analysisResult}
                title={analysisTitle}
                filename={`reflection-mirror-${Date.now()}.pdf`}
                shareSourceLabel="Reflection Mirror"
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
