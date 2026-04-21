/**
 * InsightLibrary — historical archive of all saved analysis outputs.
 * Search, filter by perspective/time range, and see evolution charts.
 */
import React, { useState, useMemo, useRef } from "react";
import { api } from "@/api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, Library, TrendingUp, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import InsightEntryCard from "@/components/insight-library/InsightEntryCard.jsx";
import EvolutionChart from "@/components/insight-library/EvolutionChart.jsx";
import PatternEvolutionList from "@/components/insight-library/PatternEvolutionList";
import ExportReportButton from "@/components/insight-library/ExportReportButton";
import AskAIButton from "@/components/askAI/AskAIButton";
import { buildContext } from "@/lib/contextBuilder";
import { isAfter, subMonths, parseISO } from "date-fns";

const PERSPECTIVES = ["All", "Tony", "Drew", "Tony→Drew", "Drew→Tony"];
const TIME_RANGES = [
  { label: "All time", months: null },
  { label: "Last 1 month", months: 1 },
  { label: "Last 3 months", months: 3 },
  { label: "Last 6 months", months: 6 },
];

const PERSPECTIVE_COLORS = {
  "Tony": "bg-blue-100 text-blue-700 border-blue-200",
  "Drew": "bg-purple-100 text-purple-700 border-purple-200",
  "Tony→Drew": "bg-green-100 text-green-700 border-green-200",
  "Drew→Tony": "bg-orange-100 text-orange-700 border-orange-200",
};

export default function InsightLibrary() {
  const [search, setSearch] = useState("");
  const [perspectiveFilter, setPerspectiveFilter] = useState("All");
  const [timeRange, setTimeRange] = useState(null); // months
  const [activeTab, setActiveTab] = useState("library");
  const queryClient = useQueryClient();
  const chartRef = useRef(null);

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["insight-entries"],
    queryFn: () => api.entities.InsightEntry.list("-created_date", 200),
  });

  const handleNoteUpdate = async (id, note) => {
    await api.entities.InsightEntry.update(id, { note });
    queryClient.invalidateQueries({ queryKey: ["insight-entries"] });
  };

  // Filter pipeline
  const filtered = useMemo(() => {
    let result = [...entries];

    // Time range
    if (timeRange) {
      const cutoff = subMonths(new Date(), timeRange);
      result = result.filter((e) => {
        if (!e.created_date) return true;
        return isAfter(parseISO(e.created_date), cutoff);
      });
    }

    // Perspective
    if (perspectiveFilter !== "All") {
      result = result.filter((e) => e.perspective === perspectiveFilter);
    }

    // Search — across core_insight, behavioral_patterns, risk_flags
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.core_insight?.toLowerCase().includes(q) ||
          e.behavioral_patterns?.some((p) => p.toLowerCase().includes(q)) ||
          e.risk_flags?.some((r) => r.toLowerCase().includes(q)) ||
          e.strengths?.some((s) => s.toLowerCase().includes(q)) ||
          e.note?.toLowerCase().includes(q) ||
          e.scenario?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [entries, perspectiveFilter, timeRange, search]);

  // Stats
  const totalByPerspective = useMemo(() => {
    const counts = {};
    entries.forEach((e) => { counts[e.perspective] = (counts[e.perspective] || 0) + 1; });
    return counts;
  }, [entries]);

  const avgConfidence = useMemo(() => {
    if (!filtered.length) return 0;
    const avg = filtered.reduce((sum, e) => sum + (e.confidence_score || 0), 0) / filtered.length;
    return Math.round(avg * 100);
  }, [filtered]);

  const askAIContext = buildContext({
    section: "Insight Library",
    perspective: "Tony+Drew",
    selectedInsight: filtered.length > 0 ? filtered[0] : null,
    profiles: [],
    checkIns: [],
    triggers: [],
    sessions: [],
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Library className="w-7 h-7 text-primary" />
            Insight Library
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Every analysis run — searchable, filterable, and tracked over time
          </p>
        </div>
        <AskAIButton context={askAIContext} modalTitle="Insight Library" />
      </div>

      <div className="flex justify-end">
        <ExportReportButton
          entries={filtered}
          allEntries={entries}
          filterLabel={`Perspective: ${perspectiveFilter}${timeRange ? ` · Last ${timeRange} month${timeRange > 1 ? "s" : ""}` : " · All time"}${search ? ` · Search: "${search}"` : ""}`}
          chartRef={chartRef}
        />
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border/60 bg-card p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{entries.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total analyses</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{filtered.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Matching filters</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{avgConfidence}%</p>
          <p className="text-xs text-muted-foreground mt-0.5">Avg confidence</p>
        </div>
        <div className="rounded-xl border border-border/60 bg-card p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{Object.keys(totalByPerspective).length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Perspectives covered</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="library">Browse All</TabsTrigger>
          <TabsTrigger value="evolution">Evolution</TabsTrigger>
          <TabsTrigger value="patterns">Pattern Trends</TabsTrigger>
        </TabsList>

        {/* ── LIBRARY TAB ── */}
        <TabsContent value="library" className="space-y-4 mt-4">
          {/* Search + filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search insights, patterns, risks, notes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background/50"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <Filter className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              {/* Perspective filter */}
              {PERSPECTIVES.map((p) => (
                <button
                  key={p}
                  onClick={() => setPerspectiveFilter(p)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg border text-xs transition-all",
                    perspectiveFilter === p
                      ? p === "All"
                        ? "border-foreground/30 bg-foreground/10 text-foreground font-medium"
                        : cn("border font-medium", PERSPECTIVE_COLORS[p])
                      : "border-border/50 text-muted-foreground hover:border-border hover:bg-muted/20"
                  )}
                >
                  {p}
                  {p !== "All" && totalByPerspective[p] ? ` (${totalByPerspective[p]})` : ""}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              {TIME_RANGES.map((tr) => (
                <button
                  key={tr.label}
                  onClick={() => setTimeRange(tr.months)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg border text-xs transition-all",
                    timeRange === tr.months
                      ? "border-primary/40 bg-primary/10 text-primary font-medium"
                      : "border-border/50 text-muted-foreground hover:border-border hover:bg-muted/20"
                  )}
                >
                  {tr.label}
                </button>
              ))}
            </div>
          </div>

          {isLoading && (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading insight history…</p>
          )}

          {!isLoading && entries.length === 0 && (
            <div className="text-center py-12 space-y-2">
              <Library className="w-10 h-10 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground">No analyses saved yet.</p>
              <p className="text-xs text-muted-foreground/60">
                Run an analysis from the Analysis Engine and it will appear here automatically.
              </p>
            </div>
          )}

          {!isLoading && entries.length > 0 && filtered.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No results match your filters.</p>
              <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => { setSearch(""); setPerspectiveFilter("All"); setTimeRange(null); }}>
                Clear all filters
              </Button>
            </div>
          )}

          <div className="space-y-3">
            {filtered.map((entry) => (
              <InsightEntryCard key={entry.id} entry={entry} onNoteUpdate={handleNoteUpdate} />
            ))}
          </div>
        </TabsContent>

        {/* ── EVOLUTION TAB ── */}
        <TabsContent value="evolution" className="space-y-5 mt-4">
          <p className="text-sm text-muted-foreground">
            See how AI confidence in each relationship dynamic has shifted over time — higher confidence means more data, clearer patterns.
          </p>
          {entries.length < 2 ? (
            <div className="text-center py-10">
              <TrendingUp className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Need at least 2 saved analyses to show trends.</p>
            </div>
          ) : (
            <div ref={chartRef}>
            <EvolutionChart entries={entries} />
          </div>
          )}

          {/* Per-perspective history list */}
          {["Tony→Drew", "Drew→Tony", "Tony", "Drew"].map((persp) => {
            const perspEntries = entries.filter((e) => e.perspective === persp);
            if (perspEntries.length === 0) return null;
            return (
              <div key={persp} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={cn("text-xs border font-normal", PERSPECTIVE_COLORS[persp])}>
                    {persp}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{perspEntries.length} analyses</span>
                </div>
                <div className="space-y-2">
                  {perspEntries.slice(0, 5).map((entry) => (
                    <InsightEntryCard key={entry.id} entry={entry} onNoteUpdate={handleNoteUpdate} />
                  ))}
                  {perspEntries.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center">+{perspEntries.length - 5} more — switch to Browse All to see them</p>
                  )}
                </div>
              </div>
            );
          })}
        </TabsContent>

        {/* ── PATTERN TRENDS TAB ── */}
        <TabsContent value="patterns" className="space-y-5 mt-4">
          <p className="text-sm text-muted-foreground">
            Patterns and risks that keep appearing across multiple analyses — these are the persistent dynamics to focus on.
          </p>
          <PatternEvolutionList entries={entries} />
        </TabsContent>
      </Tabs>
    </div>
  );
}