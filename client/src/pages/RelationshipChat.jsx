import React, { useState, useRef, useEffect } from "react";
import { api } from "@/api/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Send,
  Loader2,
  Sparkles,
  RotateCcw,
  Heart,
  MessageSquareText,
  Scale,
  BrainCircuit,
  HeartHandshake,
  ShieldAlert,
  Ear,
  Clock3,
  MessageCircleQuestion,
  Lightbulb,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import CreditLimitBanner from "@/components/ui/CreditLimitBanner";
import { useRelationshipAuth } from "@/context/RelationshipAuthContext";
import { getRelationshipTerms } from "@/lib/relationshipParticipants";

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
  const coachLabel = relationshipTerms?.type === "romantic" ? "Relationship Coach" : "Connection Coach";
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
  const sectionPrompts = React.useMemo(
    () => buildSectionPrompts(primaryPerson, secondaryPerson, relationshipTerms, relationshipLabel),
    [primaryPerson, secondaryPerson, relationshipTerms, relationshipLabel],
  );
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState("both");
  const [creditError, setCreditError] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const { data: primaryResponses = [] } = useQuery({
    queryKey: ["chat-responses-primary", activeRelationshipId, primaryPerson],
    queryFn: () => api.entities.QuestionnaireResponse.filter({ person_name: primaryPerson }),
  });
  const { data: secondaryResponses = [] } = useQuery({
    queryKey: ["chat-responses-secondary", activeRelationshipId, secondaryPerson],
    queryFn: () => api.entities.QuestionnaireResponse.filter({ person_name: secondaryPerson }),
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    setScope((current) => {
      if (current === "both") return current;
      return participants.includes(current) ? current : "both";
    });
  }, [participants]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput("");
    setCreditError(false);

    const userMsg = { role: "user", content: userText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    const conversationHistory = newMessages
      .map((message) => `${message.role === "user" ? "User" : "Coach"}: ${message.content}`)
      .join("\n\n");

    const prompt = `${buildSystemPrompt(scope, participants, primaryResponses, secondaryResponses, relationshipTerms, relationshipLabel)}

CONVERSATION SO FAR:
${conversationHistory}

Respond as the Relationship Coach. Use clean headers and human-readable section names.`;

    try {
      const result = await api.integrations.Core.InvokeLLM({ prompt, model: "claude_sonnet_4_6" });
      const rawText = typeof result === "string" ? result : result?.response || "I wasn't able to generate a response. Please try again.";
      const aiText = prettifyResponseText(rawText);
      setMessages((prev) => [...prev, { role: "assistant", content: aiText }]);
    } catch (err) {
      if (err?.response?.status === 402 || err?.message?.includes("402") || err?.message?.includes("credit")) {
        setCreditError(true);
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
      }
    }

    setLoading(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setCreditError(false);
  };

  return (
    <div className="flex h-[calc(100vh-5rem)] max-h-[960px] flex-col gap-4">
      <div className="enterprise-panel flex shrink-0 items-center justify-between border-2 border-[#0e6f72]/20 bg-[#f4fbfa] px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#0e6f72]/15 bg-white">
            <Heart className="h-5 w-5 text-[#0e6f72]" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">
              {relationshipTerms.type === "romantic" ? "Relationship Coach" : "Connection Coach"}
            </h1>
              <p className="text-xs text-muted-foreground">Powered by {relationshipLabel}&apos;s questionnaire data</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={scope} onValueChange={setScope}>
            <SelectTrigger className="h-9 w-40 rounded-full border-[#0e6f72]/20 bg-white text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="both">{primaryPerson} &amp; {secondaryPerson}</SelectItem>
              <SelectItem value={primaryPerson}>{primaryPerson}&apos;s perspective</SelectItem>
              <SelectItem value={secondaryPerson}>{secondaryPerson}&apos;s perspective</SelectItem>
            </SelectContent>
          </Select>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearChat} className="h-9 gap-1.5 rounded-full border border-[#0e6f72]/15 bg-white text-xs text-[#14263f] hover:bg-[#eef8f7]">
              <RotateCcw className="w-3 h-3" /> Clear
            </Button>
          )}
        </div>
      </div>

      {creditError && (
        <div className="shrink-0">
          <CreditLimitBanner />
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-4 min-h-0 pr-1">
        {messages.length === 0 && (
          <div className="space-y-6">
            <div className="enterprise-panel border-2 border-[#0e6f72]/15 bg-[#f8fbfd] py-8 text-center space-y-2">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#0e6f72]/15 bg-white">
                <Sparkles className="h-7 w-7 text-[#0e6f72]" />
              </div>
              <h2 className="font-display text-lg font-semibold text-foreground">Choose a section to explore</h2>
              <p className="mx-auto max-w-2xl text-sm text-muted-foreground">
                Each section below is grounded in {primaryPerson} and {secondaryPerson}&apos;s actual questionnaire answers. Use the main action for a deeper answer or the summarize pill for a faster read.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {sectionPrompts.map((section) => (
                <div
                  key={section.title}
                  className="enterprise-hover-raise rounded-2xl border border-[#0e6f72]/20 bg-white p-4 shadow-sm"
                >
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#0e6f72]/15 bg-[#eef8f7]">
                      <section.icon className="h-4 w-4 text-[#0e6f72]" />
                    </div>
                    <button
                      type="button"
                      onClick={() => sendMessage(section.summaryPrompt)}
                      className="enterprise-icon-pill px-3 py-1.5 text-xs"
                    >
                      Summarize
                    </button>
                  </div>
                  <h3 className="text-base font-semibold text-[#14263f]">{section.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#4e6077]">{section.description}</p>
                  <button
                    type="button"
                    onClick={() => sendMessage(section.prompt)}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-full border-2 border-teal-500 bg-[#14263f] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#0f1d31]"
                  >
                    Ask About This
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div key={index} className={cn("flex gap-3", message.role === "user" ? "justify-end" : "justify-start")}>
            {message.role === "assistant" && (
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-[#0e6f72]/15 bg-[#eef8f7]">
                <MessageCircleQuestion className="h-4 w-4 text-[#0e6f72]" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[82%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                message.role === "user"
                  ? "border border-[#0e6f72] bg-[#0e6f72] text-white"
                  : "border border-[#0e6f72]/15 bg-white text-foreground"
              )}
            >
              {message.role === "assistant" ? (
                <div className="prose prose-sm max-w-none text-foreground prose-headings:text-[#14263f] prose-strong:text-[#14263f] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              ) : (
                <p>{message.content}</p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-[#0e6f72]/15 bg-[#eef8f7]">
              <MessageCircleQuestion className="h-4 w-4 text-[#0e6f72]" />
            </div>
            <div className="flex items-center gap-2 rounded-2xl border border-[#0e6f72]/15 bg-white px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-[#0e6f72]" />
              Thinking with full context...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="enterprise-panel shrink-0 border-2 border-[#0e6f72]/15 bg-[#f8fbfd] pt-4">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            placeholder={`Ask about ${primaryPerson}, ${secondaryPerson}, or this ${relationshipTerms.bond}...`}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[48px] max-h-[140px] resize-none rounded-2xl border-2 bg-white text-sm py-3"
            rows={1}
            disabled={loading}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="h-12 w-12 shrink-0 rounded-full border-2 border-teal-500 bg-[#14263f] p-0 text-white hover:bg-[#0f1d31]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-muted-foreground/60">
          References {primaryPerson} &amp; {secondaryPerson}&apos;s full questionnaire responses · Press Enter to send
        </p>
      </div>
    </div>
  );
}
