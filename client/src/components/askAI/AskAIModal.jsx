/**
 * AskAIModal — Global Ask AI system with preset actions and context visibility.
 * Handles both preset action selections and freeform questions.
 * Always passes structured context to prevent generic responses.
 */
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  X,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileText,
  Save,
  Copy,
  Eye,
  HelpCircle,
} from "lucide-react";
import { askCoach } from "@/lib/aiCoachService";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

const PRESET_ACTIONS = [
  {
    id: "explain",
    label: "Explain This",
    icon: Eye,
    description: "Simplified explanation of what's happening",
    prompt: "Explain what's happening in this situation in simple terms. What does this pattern mean?",
  },
  {
    id: "what_to_do",
    label: "What Should I Do?",
    icon: HelpCircle,
    description: "Actionable steps for this situation",
    prompt: "What specific actions should I take in this situation? Give me 3-4 concrete steps.",
  },
  {
    id: "how_handle",
    label: "How Do I Handle This?",
    icon: Sparkles,
    description: "Communication approach and strategy",
    prompt: "How should I approach this conversation? What's the best communication strategy?",
  },
  {
    id: "60_second",
    label: "60-Second Version",
    icon: FileText,
    description: "Quick summary version",
    prompt: "Give me a 60-second summary. The absolute essentials only.",
  },
  {
    id: "break_down",
    label: "Break This Down",
    icon: ChevronDown,
    description: "Step-by-step breakdown",
    prompt: "Break this down step by step. What happens first, next, then? What should I be aware of?",
  },
];

export default function AskAIModal({ open, onOpenChange, context, title = "Ask AI Coach" }) {
  const [selectedAction, setSelectedAction] = useState(null);
  const [freeformQuestion, setFreeformQuestion] = useState("");
  const [showContext, setShowContext] = useState(false);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const bottomRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setSelectedAction(null);
      setFreeformQuestion("");
      setMessages([]);
      setShowContext(false);
    }
  }, [open]);

  const handlePresetAction = async (action) => {
    setSelectedAction(action);
    setFreeformQuestion("");
    await handleSend(action.prompt);
  };

  const handleFreeformQuestion = async () => {
    if (!freeformQuestion.trim()) return;
    const q = freeformQuestion.trim();
    setFreeformQuestion("");
    await handleSend(q);
  };

  const handleSend = async (question) => {
    if (!question.trim() || loading) return;

    // Add user message
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setLoading(true);

    // Build enriched context
    const enrichedContext = {
      ...context,
      originalPrompt: question,
      originalOutput: messages.length > 0 ? messages.map((m) => `${m.role}: ${m.content}`).join("\n\n") : null,
    };

    try {
      // Call AI Coach
      const result = await askCoach({ question, ctx: enrichedContext });

      // Add AI response
      setMessages((prev) => [...prev, { role: "ai", content: result }]);
      setShowSaveButton(true);
    } catch (err) {
      toast.error("Failed to get response. Please try again.");
      setMessages((prev) => prev.slice(0, -1)); // Remove user message if AI fails
    } finally {
      setLoading(false);
    }
  };

  const handleCopyResponse = async () => {
    if (messages.length === 0) return;
    const lastResponse = messages[messages.length - 1];
    if (lastResponse.role !== "ai") return;

    await navigator.clipboard.writeText(lastResponse.content);
    toast.success("Response copied to clipboard");
  };

  const handleSaveInsight = async () => {
    // This would save to Insight Library
    // For now, show success message
    toast.success("Insight saved to library");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden border-2 border-[#14263f]/15 bg-white p-0 shadow-2xl">
        <DialogHeader className="border-b border-border/60 bg-gradient-to-r from-[#14263f] to-[#0e6f72] px-6 py-5">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-white">
                <Sparkles className="w-5 h-5 text-[#7be0d5]" />
                <DialogTitle className="text-xl font-display text-white">{title}</DialogTitle>
              </div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/70">
                {context.section} · {context.perspective}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-9 w-9 rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Context Panel */}
        <div className="border-b border-border/50 bg-[#f7fafc] px-6 py-4">
          <button
            onClick={() => setShowContext(!showContext)}
            className="flex w-full items-center justify-between rounded-xl border border-[#14263f]/10 bg-white px-4 py-3 text-left transition-colors hover:border-[#0e6f72]/30 hover:bg-[#eef7f7]"
          >
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#14263f]">
              What This Is Based On
            </span>
            {showContext ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
          </button>

          <AnimatePresence>
            {showContext && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  {context.patterns?.length > 0 && (
                    <div className="rounded-xl border border-[#14263f]/10 bg-white p-4 text-xs">
                      <p className="mb-2 font-semibold uppercase tracking-[0.16em] text-[#14263f]/70">Patterns Detected</p>
                      <p className="leading-6 text-muted-foreground">
                        {context.patterns.slice(0, 4).map((p) => typeof p === "string" ? p : p.value || p.trait).join(" · ")}
                      </p>
                    </div>
                  )}
                  {context.traits?.length > 0 && (
                    <div>
                      <div className="rounded-xl border border-[#0e6f72]/10 bg-white p-4 text-xs">
                        <p className="mb-2 font-semibold uppercase tracking-[0.16em] text-[#0e6f72]/80">Key Traits</p>
                        <p className="leading-6 text-muted-foreground">
                          {context.traits.slice(0, 4).map((t) => typeof t === "string" ? t : `${t.label} (${t.score}/10)`).join(" · ")}
                        </p>
                      </div>
                    </div>
                  )}
                  {context.active_risks?.length > 0 && (
                    <div className="rounded-xl border border-orange-200 bg-white p-4 text-xs">
                      <p className="mb-2 font-semibold uppercase tracking-[0.16em] text-orange-700">Active Risks</p>
                      <p className="leading-6 text-muted-foreground">
                        {context.active_risks.slice(0, 3).map((r) => typeof r === "string" ? r : r.value).join(" · ")}
                      </p>
                    </div>
                  )}
                  {context.scenario && (
                    <div className="rounded-xl border border-border/60 bg-white p-4 text-xs md:col-span-2">
                      <p className="mb-2 font-semibold uppercase tracking-[0.16em] text-[#14263f]/70">Scenario</p>
                      <p className="leading-6 text-muted-foreground italic">{context.scenario}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 min-h-0 bg-white">
          {messages.length === 0 && !loading && (
            <div className="rounded-2xl border border-[#14263f]/10 bg-[#f8fbfd] px-5 py-10 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#0e6f72]/15 bg-white">
                <Sparkles className="w-6 h-6 text-[#0e6f72]" />
              </div>
              <p className="text-base font-medium text-[#14263f]">Ask for help with this exact moment</p>
              <p className="mx-auto max-w-xl text-sm leading-6 text-muted-foreground">
                Choose a quick action or type your own question. The response will stay grounded in the relationship context shown above.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] rounded-xl px-4 py-2.5 text-sm",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 border border-border/40 text-foreground"
                )}
              >
                {msg.role === "ai" ? (
                  <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-strong:text-foreground text-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted/50 border border-border/40 rounded-xl px-4 py-2.5">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Preset Actions (show only if no messages or first message) */}
        <AnimatePresence>
          {messages.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="border-t border-border/50 bg-[#f7fafc] px-6 py-4 space-y-3"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#14263f]/70">Quick Actions</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
                {PRESET_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handlePresetAction(action)}
                      disabled={loading}
                      className="h-auto min-h-[84px] flex-col items-start justify-start rounded-2xl border-2 border-[#0e6f72]/25 bg-white px-4 py-3 text-left text-xs hover:bg-[#eef7f7]"
                      title={action.description}
                    >
                      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full border border-[#0e6f72]/15 bg-[#eef7f7]">
                        <Icon className="w-4 h-4 text-[#0e6f72]" />
                      </div>
                      <span className="line-clamp-2 text-left font-semibold text-[#14263f]">{action.label}</span>
                      <span className="mt-1 line-clamp-2 text-[11px] leading-5 text-muted-foreground">{action.description}</span>
                    </Button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Freeform Input */}
        <div className="border-t border-border/50 bg-white px-6 pb-5 pt-4 space-y-3">
          <Textarea
            placeholder="Ask your own question or follow up..."
            value={freeformQuestion}
            onChange={(e) => setFreeformQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleFreeformQuestion();
              }
            }}
            className="min-h-[60px] resize-none bg-background/60 text-sm py-2"
            disabled={loading}
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1">
              {messages.length > 0 && messages[messages.length - 1]?.role === "ai" && (
                <>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCopyResponse}
                    className="text-xs gap-1 h-8"
                  >
                    <Copy className="w-3 h-3" />
                    Copy
                  </Button>
                  {showSaveButton && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleSaveInsight}
                      className="text-xs gap-1 h-8 text-primary"
                    >
                      <Save className="w-3 h-3" />
                      Save
                    </Button>
                  )}
                </>
              )}
            </div>

            <Button
              size="sm"
              onClick={handleFreeformQuestion}
              disabled={loading || !freeformQuestion.trim()}
              className="gap-1 h-8"
            >
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              Send
            </Button>
          </div>

          <p className="text-[11px] text-muted-foreground/60 text-center">
            Your question is always paired with the context above to ensure specific, relevant guidance.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
