/**
 * AskCoachDrawer — floating AI Coach chat panel
 * Inherits page context, knows who you are and what you're looking at.
 * Used as a global floating button on all relevant pages.
 */
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import ReactMarkdown from "react-markdown";
import { askCoach } from "@/lib/aiCoachService";
import { cn } from "@/lib/utils";

export default function AskCoachDrawer({ ctx, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!question.trim() || loading) return;
    const q = question.trim();
    setQuestion("");
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setLoading(true);

    // Build context with latest message history for continuity
    const enrichedCtx = {
      ...ctx,
      originalOutput: ctx.originalOutput
        ? ctx.originalOutput
        : messages.length > 0
        ? messages.map((m) => `${m.role === "user" ? "User" : "AI"}: ${m.content}`).join("\n\n")
        : null,
    };

    const result = await askCoach({ question: q, ctx: enrichedCtx });
    setMessages((prev) => [...prev, { role: "ai", content: result }]);
    setLoading(false);
  };

  const scopeLabel =
    ctx?.scope === "Tony+Drew" ? "Tony & Drew" : ctx?.scope || "You";

  return (
    <>
      {/* Floating Bubble */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl hover:bg-primary/90 transition-all duration-200 group"
          >
            <Sparkles className="w-4 h-4 group-hover:animate-pulse" />
            <span className="text-sm font-medium">Ask AI Coach</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Drawer Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-6 right-6 z-50 w-[min(420px,calc(100vw-2rem))] bg-card border border-border/60 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: "min(580px, calc(100vh - 6rem))" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-primary/5 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">AI Coach</p>
                  <p className="text-[10px] text-muted-foreground">
                    {ctx?.page} · {scopeLabel}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setOpen(false); setMessages([]); }}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {messages.length === 0 && (
                <div className="text-center py-6 space-y-2">
                  <Sparkles className="w-8 h-8 text-primary/30 mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    Ask anything about what you're looking at.
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    I know you're on the <strong>{ctx?.page}</strong> page
                    {ctx?.sectionTitle ? ` viewing "${ctx.sectionTitle}"` : ""}.
                  </p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-xl px-3 py-2.5 text-sm",
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
                  <div className="bg-muted/50 border border-border/40 rounded-xl px-3 py-2.5">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border/50 shrink-0">
              <div className="flex gap-2 items-end">
                <Textarea
                  placeholder="Ask something..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="min-h-[40px] max-h-[120px] resize-none bg-background/60 text-sm py-2"
                  rows={1}
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={loading || !question.trim()}
                  className="shrink-0 h-9 w-9"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground/50 mt-1.5 text-center">
                Context-aware · Scoped to {scopeLabel}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}