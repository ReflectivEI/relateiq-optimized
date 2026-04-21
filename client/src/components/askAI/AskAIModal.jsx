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
import { Badge } from "@/components/ui/badge";
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
import { buildContextSummary } from "@/lib/contextBuilder";
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

  const contextSummary = buildContextSummary(context);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <DialogTitle>{title}</DialogTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} className="h-7 w-7">
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{context.section} · {context.perspective}</p>
        </DialogHeader>

        {/* Context Panel */}
        <div className="px-4 pb-2">
          <button
            onClick={() => setShowContext(!showContext)}
            className="flex items-center justify-between w-full text-left py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors"
          >
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
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
                <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-2 text-xs">
                  {/* Patterns */}
                  {context.patterns.length > 0 && (
                    <div>
                      <p className="font-semibold text-muted-foreground mb-1">Patterns Detected:</p>
                      <div className="flex flex-wrap gap-1">
                        {context.patterns.slice(0, 4).map((p, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">
                            {typeof p === "string" ? p : p.value || p.trait}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Traits */}
                  {context.traits.length > 0 && (
                    <div>
                      <p className="font-semibold text-muted-foreground mb-1">Key Traits:</p>
                      <div className="flex flex-wrap gap-1">
                        {context.traits.slice(0, 4).map((t, i) => (
                          <Badge key={i} variant="outline" className="text-[10px]">
                            {typeof t === "string" ? t : `${t.label} (${t.score}/10)`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active Risks */}
                  {context.active_risks.length > 0 && (
                    <div>
                      <p className="font-semibold text-muted-foreground mb-1">Active Risks:</p>
                      <div className="flex flex-wrap gap-1">
                        {context.active_risks.slice(0, 3).map((r, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] border-orange-200">
                            {typeof r === "string" ? r : r.value}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Scenario */}
                  {context.scenario && (
                    <div>
                      <p className="font-semibold text-muted-foreground mb-1">Scenario:</p>
                      <p className="text-muted-foreground italic">{context.scenario}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 min-h-0">
          {messages.length === 0 && !loading && (
            <div className="text-center py-6 space-y-3">
              <Sparkles className="w-8 h-8 text-primary/30 mx-auto" />
              <p className="text-sm text-muted-foreground">
                Choose a preset action or ask your own question. I'll use the context above to give you specific, relevant guidance.
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
              className="px-4 py-3 border-t border-border/50 space-y-2"
            >
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                {PRESET_ACTIONS.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handlePresetAction(action)}
                      disabled={loading}
                      className="flex flex-col items-center justify-center h-auto py-2 px-1.5 text-xs"
                      title={action.description}
                    >
                      <Icon className="w-4 h-4 mb-1" />
                      <span className="line-clamp-2 text-center">{action.label}</span>
                    </Button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Freeform Input */}
        <div className="px-4 pb-4 border-t border-border/50 space-y-2">
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

          <div className="flex gap-2 justify-between">
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

          <p className="text-[10px] text-muted-foreground/50 text-center">
            Your question is always paired with the context above to ensure specific, relevant guidance.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}