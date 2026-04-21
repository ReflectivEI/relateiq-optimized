/**
 * AskCoachDrawer — floating AI Coach chat panel
 * Inherits page context, knows who you are and what you're looking at.
 * Used as a global floating button on all relevant pages.
 */
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Loader2, ChevronDown, MessageSquare, ShieldCheck, Lightbulb } from "lucide-react";
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
  const quickPrompts = [
    "What is the most grounded way to respond here?",
    "What is this moment probably signaling underneath?",
    "What should I avoid saying right now?",
  ];

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
            className="fixed bottom-6 right-6 z-50 flex w-[min(460px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[1.75rem] border border-[#14263f]/15 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]"
            style={{ maxHeight: "min(660px, calc(100vh - 5rem))" }}
          >
            {/* Header */}
            <div className="shrink-0 border-b border-white/10 bg-gradient-to-r from-[#14263f] to-[#0e6f72] px-5 py-4 text-white">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/20 bg-white/10">
                    <Sparkles className="h-4 w-4 text-[#7be0d5]" />
                  </div>
                  <div>
                    <p className="text-base font-semibold">Ask AI Coach</p>
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/70">
                      {ctx?.page} · {scopeLabel}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={() => setOpen(false)}>
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={() => { setOpen(false); setMessages([]); }}>
                  <X className="w-4 h-4" />
                </Button>
                </div>
              </div>
            </div>

            <div className="shrink-0 border-b border-border/50 bg-[#f7fafc] px-5 py-4">
              <div className="rounded-2xl border border-[#14263f]/10 bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#14263f]/70">What this is based on</p>
                <div className="mt-3 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                  <div className="rounded-xl border border-[#14263f]/10 bg-[#eef4fb] p-3">
                    <div className="mb-2 flex items-center gap-2 text-[#14263f]"><MessageSquare className="h-4 w-4" /><span className="font-semibold">Context</span></div>
                    <p className="leading-6">{ctx?.sectionTitle || "Current section context"}</p>
                  </div>
                  <div className="rounded-xl border border-[#0e6f72]/10 bg-[#e8f7f6] p-3">
                    <div className="mb-2 flex items-center gap-2 text-[#0e6f72]"><ShieldCheck className="h-4 w-4" /><span className="font-semibold">Scope</span></div>
                    <p className="leading-6">{scopeLabel}</p>
                  </div>
                  <div className="rounded-xl border border-[#14263f]/10 bg-white p-3">
                    <div className="mb-2 flex items-center gap-2 text-[#14263f]"><Lightbulb className="h-4 w-4" /><span className="font-semibold">Use it for</span></div>
                    <p className="leading-6">Clarifying what is happening, what to say next, and what to avoid.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0 bg-white">
              {messages.length === 0 && (
                <div className="space-y-4 rounded-2xl border border-[#14263f]/10 bg-[#f8fbfd] px-5 py-8 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#0e6f72]/15 bg-white">
                    <Sparkles className="h-6 w-6 text-[#0e6f72]" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-base font-medium text-[#14263f]">Ask for help with this exact moment</p>
                    <p className="mx-auto max-w-sm text-sm leading-6 text-muted-foreground">
                      Use a quick prompt below or ask your own question. The response will stay grounded in the page and section you’re viewing.
                    </p>
                  </div>
                  <div className="grid gap-2 text-left sm:grid-cols-3">
                    {quickPrompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => setQuestion(prompt)}
                        className="rounded-2xl border border-[#0e6f72]/20 bg-white px-3 py-3 text-sm leading-6 text-[#14263f] transition-colors hover:bg-[#eef7f7]"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
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
            <div className="p-4 border-t border-border/50 shrink-0 bg-white">
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
                  className="min-h-[56px] max-h-[140px] resize-none rounded-2xl border-2 bg-background/60 px-4 py-3 text-sm"
                  rows={1}
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={loading || !question.trim()}
                  className="shrink-0 h-11 w-11 rounded-full border-2 border-teal-500 bg-[#14263f] text-white hover:bg-[#0f1d31]"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground/60 mt-2 text-center">
                Context-aware · Scoped to {scopeLabel}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
