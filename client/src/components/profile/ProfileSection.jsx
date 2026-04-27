/**
 * ProfileSection — expandable insight section for the My Profile view.
 * Supports "Explain this", "Why this matters", "What to do differently", "Example" expansions.
 */
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Lightbulb, HelpCircle, RefreshCw, BookOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/api/client";
import { RELATIONSHIP_COACH_SYSTEM } from "@/lib/prompts";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import { useRelationshipAuth } from "@/context/RelationshipAuthContext";
import ResponseExportBar from "@/components/export/ResponseExportBar";
import { getRelationshipTerms } from "@/lib/relationshipParticipants";

const EXPANSIONS = [
  { id: "explain", label: "Explain this", icon: HelpCircle },
  { id: "why", label: "Why it matters", icon: Lightbulb },
  { id: "different", label: "What to do differently", icon: RefreshCw },
  { id: "example", label: "Real-life example", icon: BookOpen },
];

export default function ProfileSection({ title, icon: Icon, content, personName, profileContext }) {
  const { activeRelationship } = useRelationshipAuth();
  const [expanded, setExpanded] = useState(false);
  const [activeExpansion, setActiveExpansion] = useState(null);
  const [expansionResult, setExpansionResult] = useState({});
  const [loading, setLoading] = useState(null);
  const terms = getRelationshipTerms(activeRelationship);
  const counterpartLabel = terms.counterpart;
  const bondLabel = terms.bond;

  const handleExpansion = async (expansionId) => {
    if (activeExpansion === expansionId && expansionResult[expansionId]) {
      setActiveExpansion(null);
      return;
    }
    setActiveExpansion(expansionId);
    if (expansionResult[expansionId]) return;

    setLoading(expansionId);

    const prompts = {
      explain: `${RELATIONSHIP_COACH_SYSTEM}\n\nFor ${personName}, explain in simple, warm language what this means about them:\n\n"${title}: ${Array.isArray(content) ? content.join(", ") : content}"\n\nProfile context: ${profileContext}\n\nKeep it to 2-3 sentences. Specific to ${personName}, not generic.`,
      why: `${RELATIONSHIP_COACH_SYSTEM}\n\nFor ${personName}, explain why this pattern matters in their ${bondLabel} with their ${counterpartLabel}:\n\n"${title}: ${Array.isArray(content) ? content.join(", ") : content}"\n\nProfile context: ${profileContext}\n\nFocus on real ${bondLabel} impact. 2-3 sentences. Specific to ${personName}.`,
      different: `${RELATIONSHIP_COACH_SYSTEM}\n\nFor ${personName}, give 2-3 specific, actionable things they could try differently given:\n\n"${title}: ${Array.isArray(content) ? content.join(", ") : content}"\n\nProfile context: ${profileContext}\n\nBehavioral, practical, achievable. Name them as experiments, not fixes.`,
      example: `${RELATIONSHIP_COACH_SYSTEM}\n\nGive ${personName} a realistic, specific example of this pattern playing out in daily ${bondLabel} life with their ${counterpartLabel}:\n\n"${title}: ${Array.isArray(content) ? content.join(", ") : content}"\n\nProfile context: ${profileContext}\n\nMake it feel real and recognizable — not hypothetical. 3-4 sentences.`,
    };

    const result = await api.integrations.Core.InvokeLLM({ prompt: prompts[expansionId] });
    setExpansionResult((prev) => ({ ...prev, [expansionId]: result }));
    setLoading(null);
  };

  const contentStr = Array.isArray(content) && content.length > 0
    ? content.join(" · ")
    : (content || "Information for this section is being developed based on your responses.");

  return (
    <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-start gap-3 p-5 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <Icon className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{contentStr}</p>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground shrink-0 mt-1 transition-transform", expanded && "rotate-180")} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-4 border-t border-border/40">
              {/* Full content */}
              <div className="pt-4">
                {Array.isArray(content) ? (
                  <div className="flex flex-wrap gap-1.5">
                    {content.map((item, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-primary/8 text-primary text-xs font-medium border border-primary/15">{item}</span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-foreground leading-relaxed">{content}</p>
                )}
              </div>

              {/* Expansion buttons */}
              <div className="flex flex-wrap gap-2">
                {EXPANSIONS.map((exp) => (
                  <button
                    key={exp.id}
                    onClick={() => handleExpansion(exp.id)}
                    disabled={loading === exp.id}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                      activeExpansion === exp.id && expansionResult[exp.id]
                        ? "border-primary/40 bg-primary/8 text-primary"
                        : "border-border/50 text-muted-foreground hover:border-primary/30 hover:text-primary"
                    )}
                  >
                    {loading === exp.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <exp.icon className="w-3 h-3" />
                    )}
                    {loading === exp.id ? "Loading..." : exp.label}
                  </button>
                ))}
              </div>

              {/* Expansion result */}
              <AnimatePresence>
                {activeExpansion && expansionResult[activeExpansion] && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="p-4 rounded-xl bg-primary/5 border border-primary/15"
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      {EXPANSIONS.find(e => e.id === activeExpansion) && (() => {
                        const E = EXPANSIONS.find(e => e.id === activeExpansion);
                        return <E.icon className="w-3.5 h-3.5 text-primary" />;
                      })()}
                      <span className="text-xs font-medium text-primary uppercase tracking-wide">
                        {EXPANSIONS.find(e => e.id === activeExpansion)?.label}
                      </span>
                    </div>
                    <div className="prose prose-sm max-w-none text-foreground prose-headings:text-foreground [&>*:first-child]:mt-0">
                      <ReactMarkdown>{expansionResult[activeExpansion]}</ReactMarkdown>
                    </div>
                    <div className="mt-3">
                      <ResponseExportBar
                        content={expansionResult[activeExpansion]}
                        title={`${personName} — ${title} — ${EXPANSIONS.find(e => e.id === activeExpansion)?.label || "Guidance"}`}
                        filename={`${personName}-${title}-${activeExpansion}.pdf`.toLowerCase().replace(/[^a-z0-9.-]+/g, "-")}
                        shareSourceLabel={`${title} Guidance`}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
