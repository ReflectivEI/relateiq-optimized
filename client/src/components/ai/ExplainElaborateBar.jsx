/**
 * ExplainElaborateBar — contextual Explain / Elaborate buttons
 * Placed near any AI-generated section.
 * Uses the same context object as the original output for continuity.
 */
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Loader2, X, Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import { explainSection, elaborateSection, buildExportText } from "@/lib/aiCoachService";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ExplainElaborateBar({ ctx, className }) {
  const [mode, setMode] = useState(null); // null | "explain" | "elaborate"
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAction = async (newMode) => {
    if (mode === newMode && result) {
      setMode(null);
      setResult(null);
      return;
    }
    setMode(newMode);
    setResult(null);
    setLoading(true);

    const fn = newMode === "explain" ? explainSection : elaborateSection;
    const output = await fn({ ctx });
    setResult(output);
    setLoading(false);
  };

  const handleCopy = () => {
    const text = buildExportText(ctx, result);
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleDownload = () => {
    const text = buildExportText(ctx, result);
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `RelateIQ-${ctx.sectionTitle?.replace(/\s+/g, "-") || "export"}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded");
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Action Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => handleAction("explain")}
          disabled={loading}
          className={cn(
            "group flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-200",
            mode === "explain" && result
              ? "border-primary bg-primary/10 text-primary"
              : "border-border/50 text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5"
          )}
        >
          <Sparkles
            className={cn(
              "w-3 h-3 transition-colors",
              mode === "explain" && result
                ? "text-primary"
                : "text-muted-foreground/50 group-hover:text-primary"
            )}
          />
          {loading && mode === "explain" ? (
            <><Loader2 className="w-3 h-3 animate-spin" /> Explaining...</>
          ) : (
            "Explain this"
          )}
        </button>

        <button
          onClick={() => handleAction("elaborate")}
          disabled={loading}
          className={cn(
            "group flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all duration-200",
            mode === "elaborate" && result
              ? "border-primary bg-primary/10 text-primary"
              : "border-border/50 text-muted-foreground hover:border-primary/40 hover:text-primary hover:bg-primary/5"
          )}
        >
          <Sparkles
            className={cn(
              "w-3 h-3 transition-colors",
              mode === "elaborate" && result
                ? "text-primary"
                : "text-muted-foreground/50 group-hover:text-primary"
            )}
          />
          {loading && mode === "elaborate" ? (
            <><Loader2 className="w-3 h-3 animate-spin" /> Elaborating...</>
          ) : (
            "Go deeper"
          )}
        </button>
      </div>

      {/* Result Panel */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl border border-primary/15 bg-primary/3 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-medium text-primary uppercase tracking-wide">
                    {mode === "explain" ? "Simplified Explanation" : "Deeper Elaboration"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleCopy} title="Copy">
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleDownload} title="Download">
                    <Download className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => { setResult(null); setMode(null); }}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground prose-strong:text-foreground [&>*:first-child]:mt-0">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}