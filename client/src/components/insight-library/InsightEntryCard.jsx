/**
 * InsightEntryCard — compact card for a single InsightEntry record.
 * Shows perspective, date, core insight, patterns/risks, and a note editor.
 */
import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Pencil, Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { format, parseISO } from "date-fns";
import MetricExplainer from "@/components/ui/MetricExplainer";

const PERSPECTIVE_COLORS = {
  "Tony":      "bg-blue-100 text-blue-700 border-blue-200",
  "Drew":      "bg-purple-100 text-purple-700 border-purple-200",
  "Tony→Drew": "bg-green-100 text-green-700 border-green-200",
  "Drew→Tony": "bg-orange-100 text-orange-700 border-orange-200",
};

export default function InsightEntryCard({ entry, onNoteUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [note, setNote] = useState(entry.note || "");
  const [saving, setSaving] = useState(false);

  const confPct = entry.confidence_score != null ? Math.round(entry.confidence_score * 100) : null;
  const dateLabel = entry.created_date
    ? format(parseISO(entry.created_date), "MMM d, yyyy")
    : entry.week_label || "";

  const handleSaveNote = async () => {
    setSaving(true);
    await onNoteUpdate(entry.id, note);
    setSaving(false);
    setEditingNote(false);
  };

  return (
    <Card className="border border-[#0e6f72]/30 bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#0e6f72]/50 hover:shadow-lg">
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className={cn("text-[11px] border font-normal", PERSPECTIVE_COLORS[entry.perspective] || "border-border")}>
              {entry.perspective}
            </Badge>
            {entry.mode && (
              <Badge variant="outline" className="text-[10px] font-normal">{entry.mode}</Badge>
            )}
            {confPct != null && (
              <MetricExplainer
                label={`${confPct}% conf.`}
                title="Confidence score"
                summary="This percentage reflects how strongly the saved analysis was supported by the available questionnaire, session, and check-in data at that time."
                calculation={`This score combines data volume, clarity of recurring patterns, and how consistent the evidence was when the analysis was saved.`}
                source={`Perspective: ${entry.perspective} · Mode: ${entry.mode || "analysis"} · Recorded: ${dateLabel}`}
              />
            )}
          </div>
          <span className="text-[11px] text-muted-foreground shrink-0">{dateLabel}</span>
        </div>

        {/* Core insight */}
        <p className="text-sm text-foreground leading-relaxed">{entry.core_insight}</p>

        {/* Scenario tag if present */}
        {entry.scenario && (
          <p className="text-xs text-muted-foreground italic">Scenario: {entry.scenario}</p>
        )}

        {/* Expand / collapse */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#0e6f72]/30 bg-[#eef8f7] px-3 text-xs font-medium text-[#2b3445] transition-all hover:border-[#0e6f72] hover:bg-[#d9f4f1] hover:text-primary"
        >
          {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          {expanded ? "Less" : "Details"}
        </button>

        {expanded && (
          <div className="space-y-3 pt-1">
            {/* Behavioral patterns */}
            {entry.behavioral_patterns?.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Patterns</p>
                <div className="flex flex-wrap gap-1.5">
                  {entry.behavioral_patterns.map((p, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] font-normal">{p}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Risk flags */}
            {entry.risk_flags?.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Risks</p>
                <div className="flex flex-wrap gap-1.5">
                  {entry.risk_flags.map((r, i) => (
                    <Badge key={i} className="text-[10px] font-normal bg-red-50 text-red-700 border-red-200 border">{r}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths */}
            {entry.strengths?.length > 0 && (
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Strengths</p>
                <div className="flex flex-wrap gap-1.5">
                  {entry.strengths.map((s, i) => (
                    <Badge key={i} className="text-[10px] font-normal bg-green-50 text-green-700 border-green-200 border">{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Frameworks */}
            {entry.frameworks_used?.length > 0 && (
              <p className="text-[10px] text-muted-foreground/60">
                Frameworks: {entry.frameworks_used.join(" · ")}
              </p>
            )}

            {/* Note */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Your note</p>
                {!editingNote && (
                  <button onClick={() => setEditingNote(true)} className="text-muted-foreground hover:text-foreground">
                    <Pencil className="w-3 h-3" />
                  </button>
                )}
              </div>
              {editingNote ? (
                <div className="space-y-1.5">
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="min-h-[60px] text-xs resize-none bg-background/50"
                    placeholder="Add a personal note…"
                  />
                  <Button size="sm" className="h-7 text-xs gap-1.5" onClick={handleSaveNote} disabled={saving}>
                    <Check className="w-3 h-3" /> {saving ? "Saving…" : "Save"}
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  {note || "No note yet — click the pencil to add one."}
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
