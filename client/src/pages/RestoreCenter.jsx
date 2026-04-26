import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, History, Loader2, RefreshCw, Search, ShieldAlert } from "lucide-react";
import { api } from "@/api/client";
import { useRelationshipAuth } from "@/context/RelationshipAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const ENTITY_OPTIONS = [
  "all",
  "QuestionnaireResponse",
  "DailyReflection",
  "Note",
  "JournalEntry",
  "InsightEntry",
  "VisionPin",
  "TriggerEntry",
  "RepairEntry",
  "OutcomeLog",
  "CoachSession",
  "PlayLabSession",
  "PlayLabResponse",
  "PlayLabResult",
  "CheckIn",
  "RelationshipDynamic",
  "UserProfile",
  "SideQuest",
];

function formatEntityPreview(event) {
  const before = event?.record_before || {};
  const importantText = [
    before.question_text,
    before.answer,
    before.content,
    before.title,
    before.description,
    before.summary,
    before.user_notes,
    before.what_happened,
  ]
    .find((value) => typeof value === "string" && value.trim().length > 0);

  if (importantText) {
    return importantText.length > 180 ? `${importantText.slice(0, 180)}...` : importantText;
  }

  const person = before.person_name || before.owner || before.scope || before.pinned_by;
  const item = before.question_id || before.related_section || before.category || before.mode;
  return [person, item].filter(Boolean).join(" · ") || "Record snapshot available for restore.";
}

function matchesSearch(event, search) {
  if (!search) return true;
  const haystack = JSON.stringify(event || {}).toLowerCase();
  return haystack.includes(search.toLowerCase());
}

export default function RestoreCenter() {
  const { activeRelationship, activeRelationshipId } = useRelationshipAuth();
  const queryClient = useQueryClient();
  const [entityFilter, setEntityFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [restoringId, setRestoringId] = useState("");
  const isOwner = activeRelationship?.current_user_role === "owner";

  const { data: auditPayload, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["restore-center", activeRelationshipId],
    enabled: Boolean(isOwner && activeRelationshipId),
    queryFn: () =>
      api.audit.list({
        hours: 24 * 30,
        limit: 500,
        action: "delete",
      }),
  });

  const events = Array.isArray(auditPayload?.events) ? auditPayload.events : [];

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const entityMatches = entityFilter === "all" || event.entity === entityFilter;
      return entityMatches && matchesSearch(event, search);
    });
  }, [events, entityFilter, search]);

  const handleRestore = async (eventId) => {
    setRestoringId(eventId);
    try {
      await api.audit.restore(eventId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["restore-center", activeRelationshipId] }),
        queryClient.invalidateQueries({ queryKey: ["responses"] }),
        queryClient.invalidateQueries({ queryKey: ["notes"] }),
        queryClient.invalidateQueries({ queryKey: ["vision-pins"] }),
        queryClient.invalidateQueries({ queryKey: ["daily-reflections-today"] }),
        queryClient.invalidateQueries({ queryKey: ["insight-entries"] }),
      ]);
      toast.success("Deleted record restored.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Restore failed.");
    } finally {
      setRestoringId("");
    }
  };

  if (!isOwner) {
    return (
      <Card className="border border-amber-300 bg-amber-50">
        <CardContent className="flex items-start gap-3 p-6 text-amber-900">
          <ShieldAlert className="mt-0.5 h-5 w-5" />
          <div>
            <p className="font-semibold">Owner access required</p>
            <p className="mt-1 text-sm">Emergency restore is restricted to the relationship owner.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border border-amber-300 bg-amber-50">
        <CardContent className="flex items-start gap-3 p-5 text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5" />
          <div className="space-y-1">
            <p className="font-semibold">Emergency restore is now site-wide</p>
            <p className="text-sm leading-6">
              This page restores deleted records across questionnaire, notes, daily reflections, insights, vision board, repairs,
              and other audited sections for the active relationship.
            </p>
            <p className="text-xs leading-5 text-amber-800/80">
              Coverage starts from when delete-audit logging was deployed. Older deletions that were never audited cannot be reconstructed automatically.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {ENTITY_OPTIONS.map((option) => (
            <Button
              key={option}
              type="button"
              size="sm"
              variant={entityFilter === option ? "default" : "outline"}
              onClick={() => setEntityFilter(option)}
            >
              {option === "all" ? "All Sections" : option}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative min-w-[260px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search deleted records"
              className="pl-9"
            />
          </div>
          <Button type="button" variant="outline" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="flex items-center gap-3 p-6 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading deleted records...
            </CardContent>
          </Card>
        ) : filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="flex items-center gap-3 p-6 text-muted-foreground">
              <History className="h-5 w-5" />
              No deleted records matched this filter.
            </CardContent>
          </Card>
        ) : (
          filteredEvents.map((event) => {
            const before = event.record_before || {};
            const actorLabel = before.person_name || before.owner || before.pinned_by || before.scope || "Unknown scope";
            return (
              <Card key={event.id} className="border border-border/60">
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base">{event.entity}</CardTitle>
                        <Badge variant="outline">delete</Badge>
                        <Badge variant="outline">{actorLabel}</Badge>
                        {before.question_id ? <Badge variant="outline">{before.question_id}</Badge> : null}
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">{formatEntityPreview(event)}</p>
                      <p className="text-xs text-muted-foreground">Deleted at {event.created_date}</p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => void handleRestore(event.id)}
                      disabled={restoringId === event.id}
                    >
                      {restoringId === event.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <History className="h-4 w-4" />}
                      {restoringId === event.id ? "Restoring..." : "Restore Deleted Record"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <pre className="overflow-x-auto rounded-xl border border-border/50 bg-muted/20 p-3 text-xs leading-5 text-muted-foreground">
                    {JSON.stringify(before, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}