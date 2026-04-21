/**
 * StructuredGuidancePanel — renders a structured guidance output.
 * Sections: Situation, You, Them, Risks, What To Do, What Not To Do, What To Say.
 * Each collapsible. Multi-output selector at top.
 */
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronDown, ChevronUp, Copy, Zap, Eye, AlertTriangle, CheckCircle2, XCircle, MessageCircle, Lightbulb } from "lucide-react";
import { deriveOutputVariant } from "@/lib/aiCoachStructured";
import FrameworksSection from "@/components/frameworks/FrameworksSection";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TONE_COLORS = {
  gentle: "bg-blue-100 text-blue-700 border-blue-200",
  neutral: "bg-slate-100 text-slate-700 border-slate-200",
  direct: "bg-orange-100 text-orange-700 border-orange-200",
};

function CollapsibleSection({ icon: Icon, label, color, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="space-y-1.5">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 w-full px-3 py-2 rounded-lg border transition-colors",
          open ? `bg-${color}-50 border-${color}-200` : "bg-muted/30 border-border/50 hover:border-border"
        )}
      >
        <Icon className={cn("w-4 h-4", open ? `text-${color}-600` : "text-muted-foreground")} />
        <span className="text-xs font-semibold flex-1 text-left">{label}</span>
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>
      {open && <div className="pl-6 space-y-2 text-sm leading-relaxed">{children}</div>}
    </div>
  );
}

function LanguageBlock({ phrases }) {
  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="space-y-2">
      {phrases.map((phrase, i) => (
        <div key={i} className="flex items-start gap-2 rounded-lg border border-border/60 bg-muted/40 p-3 group hover:bg-muted/60 transition-colors">
          <span className="text-sm flex-1 italic leading-relaxed">"{phrase}"</span>
          <button
            onClick={() => handleCopy(phrase)}
            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          >
            <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
      ))}
    </div>
  );
}

export default function StructuredGuidancePanel({ baseOutput, perspective }) {
  const [variant, setVariant] = useState("full");
  const displayOutput = deriveOutputVariant(baseOutput, variant);

  return (
    <Card className="border border-border/60">
      <CardHeader className="pb-3">
        <div className="space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-sm">Structured Guidance</CardTitle>
            <Badge className={cn("text-[10px] border font-medium", TONE_COLORS[baseOutput.tone_recommendation] || TONE_COLORS.neutral)}>
              {baseOutput.tone_recommendation}
            </Badge>
          </div>

          {/* Output variant selector */}
          <Tabs value={variant} onValueChange={setVariant} className="w-full">
            <TabsList className="grid w-full grid-cols-5 gap-0.5 bg-muted/50 p-1 h-auto">
              <TabsTrigger value="full" className="text-[10px] px-1 py-1">Full</TabsTrigger>
              <TabsTrigger value="explain" className="text-[10px] px-1 py-1">Explain</TabsTrigger>
              <TabsTrigger value="60-second" className="text-[10px] px-1 py-1">60s</TabsTrigger>
              <TabsTrigger value="action-plan" className="text-[10px] px-1 py-1">Action</TabsTrigger>
              <TabsTrigger value="what-now" className="text-[10px] px-1 py-1">Now?</TabsTrigger>
            </TabsList>
          </Tabs>
          <p className="text-[11px] text-muted-foreground">{variant === "full" ? "Full guidance with all sections" : "Derived — no new AI call"}</p>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Situation */}
        {displayOutput.situation_summary && (
          <CollapsibleSection icon={Lightbulb} label="Situation" color="amber" defaultOpen={true}>
            <p>{displayOutput.situation_summary}</p>
          </CollapsibleSection>
        )}

        {/* You (actor) */}
        {displayOutput.what_you_are_experiencing && (
          <CollapsibleSection icon={Eye} label="What You're Experiencing" color="blue" defaultOpen={variant === "full"}>
            <p>{displayOutput.what_you_are_experiencing}</p>
          </CollapsibleSection>
        )}

        {/* Them (target) */}
        {displayOutput.what_they_are_experiencing && (
          <CollapsibleSection icon={Eye} label="What They're Likely Experiencing" color="purple" defaultOpen={variant === "full"}>
            <p>{displayOutput.what_they_are_experiencing}</p>
          </CollapsibleSection>
        )}

        {/* Risks */}
        {displayOutput.what_is_at_risk?.length > 0 && (
          <CollapsibleSection icon={AlertTriangle} label="What's at Risk" color="red" defaultOpen={false}>
            <ul className="space-y-1.5">
              {displayOutput.what_is_at_risk.map((risk, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        )}

        {/* What To Do */}
        {displayOutput.what_to_do?.length > 0 && (
          <CollapsibleSection icon={CheckCircle2} label="What To Do" color="green" defaultOpen={true}>
            <ul className="space-y-1.5">
              {displayOutput.what_to_do.map((action, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-green-600 font-bold mt-0.5">{i + 1}.</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        )}

        {/* What Not To Do */}
        {displayOutput.what_not_to_do?.length > 0 && (
          <CollapsibleSection icon={XCircle} label="What Not To Do" color="orange" defaultOpen={false}>
            <ul className="space-y-1.5">
              {displayOutput.what_not_to_do.map((avoid, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-orange-600">✕</span>
                  <span>{avoid}</span>
                </li>
              ))}
            </ul>
          </CollapsibleSection>
        )}

        {/* What To Say */}
        {displayOutput.suggested_language?.length > 0 && (
          <CollapsibleSection icon={MessageCircle} label="What To Say" color="emerald" defaultOpen={true}>
            <LanguageBlock phrases={displayOutput.suggested_language} />
          </CollapsibleSection>
        )}

        {/* Frameworks Section */}
        {displayOutput.framework_explanations?.length > 0 && (
          <FrameworksSection frameworks={displayOutput.framework_explanations} />
        )}
      </CardContent>
    </Card>
  );
}