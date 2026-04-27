/**
 * FrameworksSection — renders all frameworks applied to an analysis/output.
 * Shows framework cards + toggle for expanded explanations.
 */
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SendPartnerPill from "@/components/ui/SendPartnerPill";
import { Lightbulb, ChevronDown, ChevronUp } from "lucide-react";
import FrameworkCard from "./FrameworkCard";
import { cn } from "@/lib/utils";

export default function FrameworksSection({ frameworks, compact = false }) {
  const [allExpanded, setAllExpanded] = useState(false);

  if (!frameworks || frameworks.length === 0) {
    return null;
  }

  return (
    <Card className="border border-border/50 bg-muted/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary" />
            Frameworks Behind This Insight
          </CardTitle>
          {!compact && frameworks.length > 1 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setAllExpanded(!allExpanded)}
              className="text-xs h-7"
            >
              {allExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3 mr-1" />
                  Collapse All
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3 mr-1" />
                  Expand All
                </>
              )}
            </Button>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground mt-1">
          Evidence-based therapeutic models informing this guidance
        </p>
        <div className="pt-2">
          <SendPartnerPill
            content={frameworks.map((fw) => ({
              framework: fw.framework,
              whyApplied: fw.why_applied,
              howItApplies: fw.how_it_applies,
            }))}
            title="Frameworks Behind This Insight"
            sourceLabel="Frameworks"
            className="h-7 px-3 text-xs"
          />
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-2">
        {frameworks.map((fw, i) => (
          <FrameworkCard key={fw.framework_id || i} framework={fw} />
        ))}
      </CardContent>
    </Card>
  );
}