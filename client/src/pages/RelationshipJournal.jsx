import React, { useMemo, useRef, useState } from "react";
import { api } from "@/api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ResponseExportBar from "@/components/export/ResponseExportBar";
import { BookText, Clock3, NotebookPen, Save, FileText, UserRound, Trash2, Pencil, X } from "lucide-react";

function JournalPreview({ personName, title, content, timestamp }) {
  return (
    <div className="enterprise-panel bg-white p-6 text-slate-900">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <p className="enterprise-section-label text-teal-700">Private Journal Entry</p>
          <h3 className="mt-2 text-2xl font-display font-semibold text-slate-900">
            {title || "Untitled Entry"}
          </h3>
        </div>
        <div className="text-right text-sm text-slate-500">
          <p className="font-semibold text-slate-700">{personName}</p>
          <p>{format(timestamp, "MMMM d, yyyy")}</p>
          <p>{format(timestamp, "h:mm a")}</p>
        </div>
      </div>

      <div className="mt-6 whitespace-pre-wrap text-[15px] leading-7 text-slate-700">
        {content || "Start writing to create a clean PDF export of this journal entry."}
      </div>
    </div>
  );
}

export default function RelationshipJournal() {
  const queryClient = useQueryClient();
  const previewRef = useRef(null);
  const editorRef = useRef(null);
  const [personName, setPersonName] = useState("Tony");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState(null);

  const timestamp = useMemo(() => new Date(), [title, content, personName]);

  const { data: entries = [] } = useQuery({
    queryKey: ["journal-entries"],
    queryFn: () => api.entities.JournalEntry.list("-created_date", 50),
  });

  const filteredEntries = useMemo(
    () => entries.filter((entry) => !personName || entry.person_name === personName),
    [entries, personName],
  );

  const resetEditor = () => {
    setEditingEntryId(null);
    setTitle("");
    setContent("");
  };

  const loadEntryIntoEditor = (entry) => {
    setEditingEntryId(entry.id);
    setPersonName(entry.person_name || "Tony");
    setTitle(entry.title || "");
    setContent(entry.content || "");
    window.requestAnimationFrame(() => {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error("Write something before saving.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        person_name: personName,
        title: title.trim() || `${personName}'s Journal Entry`,
        content: content.trim(),
        entry_timestamp: timestamp.toISOString(),
      };

      if (editingEntryId) {
        await api.entities.JournalEntry.update(editingEntryId, payload);
        toast.success("Journal entry updated.");
      } else {
        await api.entities.JournalEntry.create(payload);
        toast.success("Journal entry saved.");
      }

      resetEditor();
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
    } catch (error) {
      toast.error(`Could not ${editingEntryId ? "update" : "save"} the journal entry.`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (entryId) => {
    try {
      await api.entities.JournalEntry.delete(entryId);
      if (editingEntryId === entryId) {
        resetEditor();
      }
      toast.success("Journal entry deleted.");
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
    } catch (error) {
      toast.error("Could not delete the journal entry.");
    }
  };

  return (
    <div className="space-y-8">
      <section className="enterprise-hero overflow-hidden">
        <div className="px-6 py-6 md:px-8 md:py-7">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-200/70">Context: Us</p>
          <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-3xl space-y-3">
              <h1 className="font-display text-4xl font-bold text-white md:text-5xl">Journal</h1>
              <p className="max-w-2xl text-base leading-7 text-slate-200">
                A private writing space for Tony and Drew. Capture what happened, what you felt, and what you
                want to remember without the noise of analytics or prompts.
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-slate-100">
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-teal-200" />
                <span>{format(timestamp, "MMMM d, yyyy • h:mm a")}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(360px,0.9fr)]">
        <div className="space-y-6">
          <Card ref={editorRef} className="enterprise-panel border-2">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <NotebookPen className="h-5 w-5 text-primary" />
                {editingEntryId ? "Edit Journal Entry" : "New Journal Entry"}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {editingEntryId
                  ? "Update the saved entry, then save your changes."
                  : "Choose who is writing, add a title if you want one, then write freely."}
              </p>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <p className="enterprise-section-label">Person</p>
                  <Select value={personName} onValueChange={setPersonName}>
                    <SelectTrigger className="h-11 rounded-2xl border-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tony">Tony</SelectItem>
                      <SelectItem value="Drew">Drew</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <p className="enterprise-section-label">Timestamp</p>
                  <div className="enterprise-panel-muted flex h-11 items-center rounded-2xl px-4 text-sm text-foreground">
                    {format(timestamp, "MMMM d, yyyy • h:mm a")}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className="enterprise-section-label">Entry Title</p>
                <Input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Example: After tonight’s conversation"
                  className="h-11 rounded-2xl border-2 bg-background"
                />
              </div>

              <div className="space-y-2">
                <p className="enterprise-section-label">Journal Entry</p>
                <Textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Write what happened, what you're feeling, what mattered, and anything you want to revisit later."
                  className="min-h-[320px] rounded-[1.15rem] border-2 bg-background p-4 text-[15px] leading-7"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-2">
                <div className="text-sm text-muted-foreground">
                  {editingEntryId
                    ? "You are editing an existing private journal entry."
                    : "Entries are private to the person who writes them and saved with a timestamp."}
                </div>
                <div className="flex flex-wrap gap-3">
                  {editingEntryId ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetEditor}
                      className="gap-2 rounded-full"
                    >
                      <X className="h-4 w-4" />
                      Cancel Edit
                    </Button>
                  ) : null}
                  <Button onClick={handleSave} disabled={saving || !content.trim()} className="gap-2">
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : editingEntryId ? "Save Changes" : "Save Entry"}
                  </Button>
                  <ResponseExportBar
                    contentRef={previewRef}
                    content={{
                      person: personName,
                      title: title || "Untitled Entry",
                      timestamp: format(timestamp, "MMMM d, yyyy 'at' h:mm a"),
                      entry: content,
                    }}
                    filename={`journal-${personName.toLowerCase()}-${format(timestamp, "yyyy-MM-dd-HHmm")}.pdf`}
                    title={`${personName} Journal Entry`}
                    showEmail={false}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div ref={previewRef} className="fixed -left-[9999px] top-0" aria-hidden="true">
            <JournalPreview personName={personName} title={title} content={content} timestamp={timestamp} />
          </div>
        </div>

        <div className="space-y-6">
          <Card className="enterprise-panel border-2">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-xl">
                <BookText className="h-5 w-5 text-primary" />
                Saved Entries
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Recent entries for {personName}. Use these as a record of what each person is noticing over time.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {filteredEntries.length === 0 ? (
                <div className="enterprise-panel-muted flex min-h-[220px] flex-col items-center justify-center gap-3 p-6 text-center">
                  <FileText className="h-8 w-8 text-primary" />
                  <div>
                    <p className="text-base font-semibold text-foreground">No saved entries yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Save the first journal entry above and it will show up here with its timestamp.
                    </p>
                  </div>
                </div>
              ) : (
                filteredEntries.map((entry) => (
                  <div
                    key={entry.id}
                    onClick={() => loadEntryIntoEditor(entry)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        loadEntryIntoEditor(entry);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className="enterprise-grid-card w-full cursor-pointer space-y-3 text-left transition-all hover:border-primary/40 hover:shadow-[0_12px_30px_rgba(15,23,42,0.08)] focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="enterprise-section-label">Journal Entry</p>
                        <h3 className="mt-1 text-lg font-semibold text-foreground">
                          {entry.title || `${entry.person_name}'s Entry`}
                        </h3>
                      </div>
                      <div className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                        <div className="flex items-center gap-1.5">
                          <UserRound className="h-3.5 w-3.5" />
                          {entry.person_name}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            loadEntryIntoEditor(entry);
                          }}
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/15 bg-white text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                          title="Edit journal entry"
                          aria-label={`Edit ${entry.title || `${entry.person_name}'s journal entry`}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDelete(entry.id);
                          }}
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/15 bg-white text-muted-foreground transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                          title="Delete journal entry"
                          aria-label={`Delete ${entry.title || `${entry.person_name}'s journal entry`}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(entry.entry_timestamp || entry.created_date), "MMMM d, yyyy • h:mm a")}
                    </p>
                    <p className="line-clamp-5 whitespace-pre-wrap text-sm leading-7 text-foreground">
                      {entry.content}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
