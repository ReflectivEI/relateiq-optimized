/**
 * NotesPanel.jsx — Take and share notes on responses/insights
 */

import React, { useState } from "react";
import { api } from "@/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PersistentSaveBar from "@/components/ui/PersistentSaveBar";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, ChevronUp, Plus, Send, Share2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRelationshipAuth } from "@/context/RelationshipAuthContext";
import { getPartnerName, getRelationshipTerms } from "@/lib/relationshipParticipants";
import useAutosave from "@/hooks/useAutosave";
import useLocalDraft from "@/hooks/useLocalDraft";

export default function NotesPanel({
  section = "general",
  relatedItemId = null,
  personName = "Tony",
}) {
  const { activeRelationshipId, participants, activeRelationship } = useRelationshipAuth();
  const [expanded, setExpanded] = useState(false);
  const queryClient = useQueryClient();
  const terms = getRelationshipTerms(activeRelationship);
  const noteDraftKey = `relateiq:draft:note:${activeRelationshipId}:${section}:${relatedItemId || "any"}:${personName}`;
  const { value: newNote, setValue: setNewNote, resetFromSource: resetNoteDraft } = useLocalDraft(noteDraftKey, "");
  const { status: noteDraftStatus } = useAutosave({
    value: newNote,
    saveValue: async () => true,
    canSave: Boolean(newNote.trim()),
    debounceMs: 350,
  });

  // Fetch notes for this section
  const { data: notes = [] } = useQuery({
    queryKey: ["notes", activeRelationshipId, section, relatedItemId],
    queryFn: () =>
      api.entities.Note.filter({
        related_section: section,
        related_item_id: relatedItemId || "any",
      }),
  });

  const sharedScope = `${participants[0]}_${participants[1]}`;
  const isSharedScope = personName === sharedScope;
  const partnerName = getPartnerName(personName, participants);
  const counterpartLabel = partnerName || terms.counterpart;
  const myNotes = isSharedScope
    ? notes.filter((n) => participants.includes(n.person_name))
    : notes.filter((n) => n.person_name === personName);
  const sharedNotes = isSharedScope
    ? []
    : notes.filter(
      (n) => n.person_name === partnerName && n.shared_with_partner
    );

  // Create note
  const createNoteMutation = useMutation({
    mutationFn: (content) =>
      api.entities.Note.create({
        person_name: isSharedScope ? participants[0] : personName,
        content,
        related_section: section,
        related_item_id: relatedItemId,
        relationship_id: activeRelationshipId,
      }),
    onSuccess: () => {
      resetNoteDraft("");
      queryClient.invalidateQueries({ queryKey: ["notes", activeRelationshipId, section, relatedItemId] });
      toast.success("Note saved");
    },
  });

  // Share note
  const shareNoteMutation = useMutation({
    mutationFn: (noteId) =>
      api.entities.Note.update(noteId, { shared_with_partner: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", activeRelationshipId, section, relatedItemId] });
      toast.success(`Note shared with ${counterpartLabel}`);
    },
  });

  // Delete note
  const deleteNoteMutation = useMutation({
    mutationFn: (noteId) => api.entities.Note.delete(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", activeRelationshipId, section, relatedItemId] });
      toast.success("Note deleted");
    },
  });

  const handleSaveNote = () => {
    if (!newNote.trim()) return;
    createNoteMutation.mutate(newNote.trim());
  };

  return (
    <Card className="border-2 border-muted/40 bg-muted/5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              📝 Your Notes
            </CardTitle>
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </div>
        </CardHeader>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <CardContent className="space-y-4 border-t border-border/40 pt-4">
              {/* Add new note */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Jot down a note while it's still fresh on your mind..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[80px] resize-none bg-background text-sm"
                />
                <PersistentSaveBar
                  status={noteDraftStatus}
                  statusLabels={{
                    idle: "Note draft ready",
                    dirty: "Unsaved note draft",
                    saving: "Saving draft locally...",
                    saved: "Draft saved locally",
                    error: "Draft save failed",
                  }}
                  onSave={handleSaveNote}
                  saveLabel="Save Note"
                  disabled={!newNote.trim() || createNoteMutation.isPending}
                />
                <Button
                  onClick={handleSaveNote}
                  disabled={!newNote.trim() || createNoteMutation.isPending}
                  className="border-2 border-primary text-sm gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Save Note
                </Button>
              </div>

              {/* Your notes */}
              {myNotes.length > 0 && (
                <div className="space-y-2 border-t border-border/40 pt-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {isSharedScope ? `Shared Notes (${myNotes.length})` : `Your Notes (${myNotes.length})`}
                  </p>
                  {myNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 rounded-lg bg-background/60 border border-border/40 space-y-2 text-sm"
                    >
                      <p className="text-foreground">{note.content}</p>
                      <div className="flex gap-2 pt-2">
                        {!isSharedScope && !note.shared_with_partner ? (
                          <Button
                            onClick={() => shareNoteMutation.mutate(note.id)}
                            disabled={shareNoteMutation.isPending}
                            size="sm"
                            variant="ghost"
                            className="text-xs border border-teal-600 text-teal-700 hover:bg-teal-50"
                          >
                            <Share2 className="w-3 h-3 mr-1" />
                            Share with {counterpartLabel}
                          </Button>
                        ) : !isSharedScope ? (
                          <span className="text-xs text-teal-700 font-semibold px-2 py-1">
                            ✓ Shared with {counterpartLabel}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground px-2 py-1">
                            {note.person_name}
                          </span>
                        )}
                        <Button
                          onClick={() => deleteNoteMutation.mutate(note.id)}
                          disabled={deleteNoteMutation.isPending}
                          size="sm"
                          variant="ghost"
                          className="text-xs text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Partner's shared notes */}
              {sharedNotes.length > 0 && (
                <div className="space-y-2 border-t border-border/40 pt-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {counterpartLabel}'s Shared Notes ({sharedNotes.length})
                  </p>
                  {sharedNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-3 rounded-lg bg-accent/10 border border-accent/30 space-y-1 text-sm"
                    >
                      <p className="text-foreground">{note.content}</p>
                      <p className="text-xs text-muted-foreground">
                        Shared by {counterpartLabel}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {myNotes.length === 0 && sharedNotes.length === 0 && (
                <p className="text-xs text-muted-foreground/60 text-center py-4">
                  No notes yet. Start capturing insights!
                </p>
              )}
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
