/**
 * InsightLibrary — historical archive of all saved analysis outputs.
 * Search, filter by perspective/time range, and see evolution charts.
 */
import React, { useMemo, useRef, useState } from "react";
import { api } from "@/api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Filter, Library, Search, TrendingUp, X } from "lucide-react";
import { cn } from "@/lib/utils";
import InsightEntryCard from "@/components/insight-library/InsightEntryCard.jsx";
import EvolutionChart from "@/components/insight-library/EvolutionChart.jsx";
import PatternEvolutionList from "@/components/insight-library/PatternEvolutionList";
import ExportReportButton from "@/components/insight-library/ExportReportButton";
import AskAIButton from "@/components/askAI/AskAIButton";
import { buildContext } from "@/lib/contextBuilder";
import { isAfter, parseISO, subMonths } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRelationshipAuth } from "@/context/RelationshipAuthContext";
import {
  containsForeignParticipantNames,
  getActivePerspectiveKeys,
  getDisplayPerspective,
  getForeignParticipantNames,
  isPerspectiveInActivePair,
  presentRelationshipText,
} from "@/lib/relationshipParticipants";

const TIME_RANGES = [
  { label: "All time", months: null },
  { label: "Last 1 month", months: 1 },
  { label: "Last 3 months", months: 3 },
  { label: "Last 6 months", months: 6 },
];

function getPerspectiveBadgeClass(value, participants = ["Person A", "Other Person"]) {
  const [primaryPerson = "Person A", secondaryPerson = "Other Person"] = participants;
  if (value === primaryPerson) return "bg-blue-100 text-blue-700 border-blue-200";
  if (value === secondaryPerson) return "bg-purple-100 text-purple-700 border-purple-200";
  if (value === `${primaryPerson}→${secondaryPerson}`) return "bg-green-100 text-green-700 border-green-200";
  if (value === `${secondaryPerson}→${primaryPerson}`) return "bg-orange-100 text-orange-700 border-orange-200";
  if (value === `${primaryPerson}+${secondaryPerson}`) return "bg-teal-100 text-teal-700 border-teal-200";
  return "border-border bg-background text-foreground";
}

function buildEntryText(entry) {
  return [
    entry.perspective,
    entry.core_insight,
    entry.scenario,
    ...(entry.behavioral_patterns || []),
    ...(entry.relationship_dynamics || []),
    ...(entry.risk_flags || []),
    ...(entry.strengths || []),
    ...(entry.recommended_actions || []),
    entry.note,
    entry.full_output_json,
  ]
    .filter(Boolean)
    .join("\n");
}

function isEntryVisibleForParticipants(entry, hiddenParticipantNames) {
  const haystack = buildEntryText(entry);
  if (!haystack) return true;
  return !containsForeignParticipantNames(haystack, hiddenParticipantNames);
}

function sanitizeEntryText(entry, participants, activeRelationship) {
  return {
    ...entry,
    perspective: presentRelationshipText(entry.perspective, participants, activeRelationship),
    core_insight: presentRelationshipText(entry.core_insight, participants, activeRelationship),
    scenario: presentRelationshipText(entry.scenario, participants, activeRelationship),
    behavioral_patterns: (entry.behavioral_patterns || []).map((item) => presentRelationshipText(item, participants, activeRelationship)),
    relationship_dynamics: (entry.relationship_dynamics || []).map((item) => presentRelationshipText(item, participants, activeRelationship)),
    risk_flags: (entry.risk_flags || []).map((item) => presentRelationshipText(item, participants, activeRelationship)),
    strengths: (entry.strengths || []).map((item) => presentRelationshipText(item, participants, activeRelationship)),
    recommended_actions: (entry.recommended_actions || []).map((item) => presentRelationshipText(item, participants, activeRelationship)),
    full_output_json: presentRelationshipText(entry.full_output_json, participants, activeRelationship),
    note: presentRelationshipText(entry.note, participants, activeRelationship),
  };
}

export default function InsightLibrary() {
  const { activeRelationshipId, activeRelationship, participants, relationshipLabel, relationships } = useRelationshipAuth();
  const [search, setSearch] = useState("");
  const [perspectiveFilter, setPerspectiveFilter] = useState("All");
  const [timeRange, setTimeRange] = useState(null);
  const [activeTab, setActiveTab] = useState("library");
  const queryClient = useQueryClient();
  const chartRef = useRef(null);

  const perspectiveOptions = useMemo(
    () => ["All", ...getActivePerspectiveKeys(participants).filter((value) => !value.includes("+"))],
    [participants],
  );

  const { data: entries = [], isLoading } = useQuery({
    queryKey: ["insight-entries", activeRelationshipId],
    queryFn: () => api.entities.InsightEntry.list("-created_date", 200),
  });

  const hiddenParticipantNames = useMemo(
    () => getForeignParticipantNames(relationships, participants),
    [relationships, participants],
  );

  const safeEntries = useMemo(
    () =>
      entries.filter(
        (entry) =>
          isPerspectiveInActivePair(entry.perspective, participants) &&
          isEntryVisibleForParticipants(entry, hiddenParticipantNames),
      ),
    [entries, hiddenParticipantNames, participants, activeRelationship],
  );

  const sanitizedSafeEntries = useMemo(
    () => safeEntries.map((entry) => sanitizeEntryText(entry, participants, activeRelationship)),
    [safeEntries, participants, activeRelationship],
  );

  const filtered = useMemo(() => {
    let result = [...sanitizedSafeEntries];

    if (timeRange) {
      const cutoff = subMonths(new Date(), timeRange);
      result = result.filter((entry) => {
        if (!entry.created_date) return true;
        return isAfter(parseISO(entry.created_date), cutoff);
      });
    }

    if (perspectiveFilter !== "All") {
      result = result.filter((entry) => entry.perspective === perspectiveFilter);
    }

    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter((entry) => {
        return (
          entry.core_insight?.toLowerCase().includes(query) ||
          entry.behavioral_patterns?.some((item) => item.toLowerCase().includes(query)) ||
          entry.risk_flags?.some((item) => item.toLowerCase().includes(query)) ||
          entry.strengths?.some((item) => item.toLowerCase().includes(query)) ||
          entry.note?.toLowerCase().includes(query) ||
          entry.scenario?.toLowerCase().includes(query)
        );
      });
    }

    return result;
  }, [sanitizedSafeEntries, timeRange, perspectiveFilter, search]);

  const totalByPerspective = useMemo(() => {
    const counts = {};
    sanitizedSafeEntries.forEach((entry) => {
      counts[entry.perspective] = (counts[entry.perspective] || 0) + 1;
    });
    return counts;
  }, [sanitizedSafeEntries]);

  const avgConfidence = useMemo(() => {
    if (!filtered.length) return 0;
    const average = filtered.reduce((sum, entry) => sum + (entry.confidence_score || 0), 0) / filtered.length;
    return Math.round(average * 100);
  }, [filtered]);

  const askAIContext = buildContext({
    section: "Insight Library",
    perspective: relationshipLabel,
    selectedInsight: filtered.length > 0 ? filtered[0] : null,
    profiles: [],
    checkIns: [],
    triggers: [],
    sessions: [],
  });

  const handleNoteUpdate = async (id, note) => {
    await api.entities.InsightEntry.update(id, { note });
    queryClient.invalidateQueries({ queryKey: ["insight-entries", activeRelationshipId] });
  };

  const handleDeleteEntry = async (id) => {
    await api.entities.InsightEntry.delete(id);
    queryClient.invalidateQueries({ queryKey: ["insight-entries", activeRelationshipId] });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Library className="w-7 h-7 text-primary" />
            Insight Library
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Every saved analysis for {relationshipLabel}, protected by active-pair visibility guardrails
          </p>
        </div>
        <AskAIButton context={askAIContext} modalTitle="Insight Library" />
      </div>

      <div className="flex justify-end">
        <ExportReportButton
          entries={filtered}
          allEntries={sanitizedSafeEntries}
          filterLabel={`Perspective: ${perspectiveFilter}${timeRange ? ` · Last ${timeRange} month${timeRange > 1 ? "s" : ""}` : " · All time"}${search ? ` · Search: "${search}"` : ""}`}
          chartRef={chartRef}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-[#0e6f72]/30 bg-card p-3 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#0e6f72]/50 hover:shadow-md">
          <p className="text-2xl font-bold text-foreground">{safeEntries.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Visible analyses</p>
        </div>
        <div className="rounded-xl border border-[#0e6f72]/30 bg-card p-3 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#0e6f72]/50 hover:shadow-md">
          <p className="text-2xl font-bold text-foreground">{filtered.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Matching filters</p>
        </div>
        <div className="rounded-xl border border-[#0e6f72]/30 bg-card p-3 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#0e6f72]/50 hover:shadow-md">
          <Popover>
            <PopoverTrigger asChild>
              <button type="button" className="w-full rounded-lg py-1 hover:bg-muted/30">
                <p className="text-2xl font-bold text-foreground">{avgConfidence}%</p>
                <p className="text-xs text-muted-foreground mt-0.5">Avg confidence</p>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 space-y-2">
              <p className="text-sm font-semibold text-foreground">Average confidence</p>
              <p className="text-sm leading-6 text-muted-foreground">
                This is the average confidence across the currently visible insight entries for this relationship context.
              </p>
              <p className="text-xs text-muted-foreground">
                Matching analyses: {filtered.length} · Visible analyses: {safeEntries.length}
              </p>
            </PopoverContent>
          </Popover>
        </div>
        <div className="rounded-xl border border-[#0e6f72]/30 bg-card p-3 text-center shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#0e6f72]/50 hover:shadow-md">
          <p className="text-2xl font-bold text-foreground">{Object.keys(totalByPerspective).length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Perspectives covered</p>
        </div>
      </div>

      {entries.length > safeEntries.length && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
          {entries.length - safeEntries.length} saved {entries.length - safeEntries.length === 1 ? "entry was" : "entries were"} hidden because the content referenced someone outside the active pair. This prevents cross-profile leakage.
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="library">Browse All</TabsTrigger>
          <TabsTrigger value="evolution">Evolution</TabsTrigger>
          <TabsTrigger value="patterns">Pattern Trends</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-4 mt-4">
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search insights, patterns, risks, notes…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
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
              {perspectiveOptions.map((perspective) => (
                <button
                  key={perspective}
                  onClick={() => setPerspectiveFilter(perspective)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs transition-all",
                    perspectiveFilter === perspective
                      ? perspective === "All"
                        ? "border-[#0e6f72]/35 bg-[#eef8f7] font-medium text-[#2b3445]"
                        : cn("border font-medium", getPerspectiveBadgeClass(perspective, participants), "shadow-sm")
                      : "border-[#0e6f72]/25 bg-white text-[#2b3445] hover:border-[#0e6f72] hover:bg-[#e8f7f6]",
                  )}
                >
                  {perspective === "All" ? perspective : getDisplayPerspective(perspective, participants)}
                  {perspective !== "All" && totalByPerspective[perspective] ? ` (${totalByPerspective[perspective]})` : ""}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              {TIME_RANGES.map((range) => (
                <button
                  key={range.label}
                  onClick={() => setTimeRange(range.months)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs transition-all",
                    timeRange === range.months
                      ? "border-[#0e6f72]/35 bg-[#eef8f7] font-medium text-[#2b3445]"
                      : "border-[#0e6f72]/25 bg-white text-[#2b3445] hover:border-[#0e6f72] hover:bg-[#e8f7f6]",
                  )}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {isLoading && (
            <p className="text-sm text-muted-foreground py-4 text-center">Loading insight history…</p>
          )}

          {!isLoading && safeEntries.length === 0 && (
            <div className="text-center py-12 space-y-2">
              <Library className="w-10 h-10 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground">No analyses saved yet.</p>
              <p className="text-xs text-muted-foreground/60">
                Run an analysis from the Analysis Engine and it will appear here automatically.
              </p>
            </div>
          )}

          {!isLoading && safeEntries.length > 0 && filtered.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No results match your filters.</p>
              <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => { setSearch(""); setPerspectiveFilter("All"); setTimeRange(null); }}>
                Clear all filters
              </Button>
            </div>
          )}

          <div className="space-y-3">
            {filtered.map((entry) => (
              <InsightEntryCard
                key={entry.id}
                entry={entry}
                participants={participants}
                activeRelationship={activeRelationship}
                onNoteUpdate={handleNoteUpdate}
                onDelete={handleDeleteEntry}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="evolution" className="space-y-5 mt-4">
          <p className="text-sm text-muted-foreground">
            See how AI confidence in each perspective has shifted over time. Only entries safe for {relationshipLabel} are shown here.
          </p>
          {safeEntries.length < 2 ? (
            <div className="text-center py-10">
              <TrendingUp className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Need at least 2 saved analyses to show trends.</p>
            </div>
          ) : (
            <div ref={chartRef}>
          <EvolutionChart entries={safeEntries} participants={participants} />
            </div>
          )}

          {perspectiveOptions.filter((value) => value !== "All").map((perspective) => {
            const perspectiveEntries = sanitizedSafeEntries.filter((entry) => entry.perspective === perspective);
            if (perspectiveEntries.length === 0) return null;
            return (
              <div key={perspective} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={cn("text-xs border font-normal", getPerspectiveBadgeClass(perspective, participants))}>
                    {getDisplayPerspective(perspective, participants)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{perspectiveEntries.length} analyses</span>
                </div>
                <div className="space-y-2">
                  {perspectiveEntries.slice(0, 5).map((entry) => (
                    <InsightEntryCard
                      key={entry.id}
                      entry={entry}
                      participants={participants}
                      activeRelationship={activeRelationship}
                      onNoteUpdate={handleNoteUpdate}
                      onDelete={handleDeleteEntry}
                    />
                  ))}
                  {perspectiveEntries.length > 5 && (
                    <p className="text-xs text-muted-foreground text-center">
                      +{perspectiveEntries.length - 5} more — switch to Browse All to see them
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="patterns" className="space-y-5 mt-4">
          <p className="text-sm text-muted-foreground">
            Patterns and risks that keep appearing across visible saved analyses for this pair.
          </p>
          <PatternEvolutionList
            entries={sanitizedSafeEntries}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
