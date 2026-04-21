import React, { useState, useRef, useEffect } from "react";
import { api } from "@/api/client";
import { tonyData } from "@/lib/exportData/tonyQuestionnaire";
import { drewData } from "@/lib/exportData/drewQuestionnaire";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Loader2, Sparkles, RotateCcw, Heart } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import CreditLimitBanner from "@/components/ui/CreditLimitBanner";

const SUGGESTED_PROMPTS = [
  "Why does Tony shut down during conflict?",
  "How should Drew approach Tony when he's stressed?",
  "What triggers Drew most in arguments?",
  "How do Tony and Drew each process being hurt?",
  "What does Tony need to feel heard?",
  "What is Drew's biggest fear in this relationship?",
  "How can Tony and Drew reconnect after a fight?",
  "What communication style works best for Drew?",
];

function buildSystemPrompt(scope) {
  const tonyContext = tonyData
    .map(q => `[${q.category.toUpperCase()}] Q: ${q.question_text}\nTony: ${q.answer}`)
    .join("\n\n");

  const drewContext = drewData
    .map(q => `[${q.category.toUpperCase()}] Q: ${q.question_text}\nDrew: ${q.answer}`)
    .join("\n\n");

  return `You are an expert Relationship Coach with deep knowledge of Tony and Drew's relationship. You have studied their full questionnaire responses and can give highly personalized, specific advice. You never give generic advice — you always reference what Tony and Drew have actually said.

IMPORTANT RULES:
- Always cite specific answers from their questionnaires when relevant (e.g. "Tony said: '...'")
- Be warm, direct, and empathetic — like a trusted therapist who knows them well
- Never take sides — hold both perspectives with equal care
- Give actionable, specific guidance
- When discussing one person's behavior, connect it to what you know from their questionnaire
- Current scope: ${scope === "both" ? "Tony & Drew (couple view)" : scope === "Tony" ? "Tony's perspective" : "Drew's perspective"}

---
TONY'S FULL QUESTIONNAIRE RESPONSES:
${tonyContext}

---
DREW'S FULL QUESTIONNAIRE RESPONSES:
${drewContext}

---
You are now ready to answer questions about Tony, Drew, and their relationship with full context of who they are.`;
}

export default function RelationshipChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [scope, setScope] = useState("both");
  const [creditError, setCreditError] = useState(false);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput("");
    setCreditError(false);

    const userMsg = { role: "user", content: userText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    // Build conversation history for the LLM
    const conversationHistory = newMessages
      .map(m => `${m.role === "user" ? "User" : "Coach"}: ${m.content}`)
      .join("\n\n");

    const prompt = `${buildSystemPrompt(scope)}

---
CONVERSATION SO FAR:
${conversationHistory}

---
Now respond as the Relationship Coach. Be thorough, warm, and specific. Reference Tony and Drew's actual questionnaire answers when relevant.`;

    try {
      const result = await api.integrations.Core.InvokeLLM({ prompt, model: "claude_sonnet_4_6" });
      const aiText = typeof result === "string" ? result : result?.response || "I wasn't able to generate a response. Please try again.";
      setMessages(prev => [...prev, { role: "assistant", content: aiText }]);
    } catch (err) {
      if (err?.response?.status === 402 || err?.message?.includes("402") || err?.message?.includes("credit")) {
        setCreditError(true);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Something went wrong. Please try again." }]);
      }
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setCreditError(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] max-h-[900px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Heart className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">Relationship Coach</h1>
            <p className="text-xs text-muted-foreground">Powered by Tony & Drew's full questionnaire data</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={scope} onValueChange={setScope}>
            <SelectTrigger className="h-8 text-xs w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="both">Tony & Drew</SelectItem>
              <SelectItem value="Tony">Tony's perspective</SelectItem>
              <SelectItem value="Drew">Drew's perspective</SelectItem>
            </SelectContent>
          </Select>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearChat} className="h-8 gap-1.5 text-xs">
              <RotateCcw className="w-3 h-3" /> Clear
            </Button>
          )}
        </div>
      </div>

      {creditError && (
        <div className="pt-3 shrink-0">
          <CreditLimitBanner />
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 min-h-0">
        {messages.length === 0 && (
          <div className="space-y-6">
            {/* Welcome state */}
            <div className="text-center py-8 space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <h2 className="font-display text-lg font-semibold text-foreground">Ask me anything</h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                I've read every answer Tony and Drew gave in their questionnaires. Ask about conflicts, triggers, communication, or anything about their dynamic.
              </p>
            </div>

            {/* Suggested prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-left px-4 py-3 rounded-xl border border-border/60 bg-card hover:bg-accent/30 hover:border-primary/30 transition-all text-sm text-foreground/80 hover:text-foreground"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={cn("flex gap-3", msg.role === "user" ? "justify-end" : "justify-start")}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Heart className="w-4 h-4 text-primary" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border/60 text-foreground"
              )}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Heart className="w-4 h-4 text-primary" />
            </div>
            <div className="bg-card border border-border/60 rounded-2xl px-4 py-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              Thinking with full context...
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-border/50 pt-4 shrink-0">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            placeholder="Ask about Tony, Drew, or their relationship..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[48px] max-h-[140px] resize-none bg-background/60 text-sm py-3"
            rows={1}
            disabled={loading}
          />
          <Button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="h-12 w-12 shrink-0 p-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground/50 mt-1.5 text-center">
          References Tony & Drew's full questionnaire responses · Press Enter to send
        </p>
      </div>
    </div>
  );
}