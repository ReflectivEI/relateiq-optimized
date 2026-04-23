/**
 * AskAIFollowUp — inline "Ask AI" panel attached to any insight section.
 * Tony or Drew can ask a follow-up question about a specific part of the analysis.
 */
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, Loader2, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ReactMarkdown from "react-markdown";
import { askCoach } from "@/lib/aiCoachService";
import { cn } from "@/lib/utils";

export default function AskAIFollowUp({ ctx, sectionTitle, sectionContent, className }) {
  const participants = [
    ctx?.memory?.primaryPerson || "Tony",
    ctx?.memory?.secondaryPerson || "Drew",
  ];
  const [primaryPerson = "Tony", secondaryPerson = "Drew"] = participants;
  const [open, setOpen] = useState(false);
  const [person, setPerson] = useState(primaryPerson);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (![primaryPerson, secondaryPerson].includes(person)) {
      setPerson(primaryPerson);
    }
  }, [person, primaryPerson, secondaryPerson]);

  const handleAsk = async () => {
    if (!question.trim() || loading) return;
    const q = question.trim();
    setQuestion("");
    setLoading(true);

    const enrichedCtx = {
      ...ctx,
      scope: person,
      sectionTitle: sectionTitle || ctx.sectionTitle,
      originalOutput: sectionContent || ctx.originalOutput,
    };

    const result = await askCoach({ question: q, ctx: enrichedCtx });
    setHistory((prev) => [...prev, { person, question: q, answer: result }]);
    setAnswer(result);
    setLoading(false);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors group"
      >
        <MessageSquare className="w-3.5 h-3.5 group-hover:text-primary" />
        Ask AI about this
        {open ? <ChevronUp className="w-3 h-3 ml-0.5" /> : <ChevronDown className="w-3 h-3 ml-0.5" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-border/50 bg-background/60 p-4 space-y-3">
              {/* Person selector */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground shrink-0">Asking as:</span>
                <Select value={person} onValueChange={setPerson}>
                  <SelectTrigger className="h-7 text-xs w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={primaryPerson}>{primaryPerson}</SelectItem>
                    <SelectItem value={secondaryPerson}>{secondaryPerson}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Prior Q&A history */}
              {history.length > 0 && (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {history.map((item, i) => (
                    <div key={i} className="space-y-1.5">
                      <p className="text-xs font-medium text-foreground">{item.person}: {item.question}</p>
                      <div className="rounded-lg bg-primary/5 border border-primary/10 px-3 py-2.5">
                        <div className="prose prose-sm max-w-none text-foreground text-xs prose-headings:text-foreground prose-strong:text-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
                          <ReactMarkdown>{item.answer}</ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {loading && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-1">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  Thinking…
                </div>
              )}

              {/* Input */}
              <div className="flex gap-2 items-end">
                <Textarea
                  placeholder={`${person}, ask a follow-up about this section…`}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAsk(); }
                  }}
                  className="min-h-[40px] max-h-[100px] resize-none text-xs bg-background/80 py-2"
                  rows={1}
                />
                <Button
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={handleAsk}
                  disabled={loading || !question.trim()}
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
