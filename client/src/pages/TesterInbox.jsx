import React, { useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/api/client";
import { useRelationshipAuth } from "@/context/RelationshipAuthContext";
import { getPartnerName } from "@/lib/relationshipParticipants";
import { clearSharedMessageDraft, readSharedMessageDraft } from "@/lib/messageShare";
import { toast } from "sonner";

function firstSentence(text = "", maxChars = 110) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "No message preview available.";
  const sentence = normalized.split(/(?<=[.!?])\s+/)[0] || normalized;
  if (sentence.length <= maxChars) return sentence;
  return `${sentence.slice(0, maxChars - 3).trimEnd()}...`;
}

function formatMessageTimestamp(note) {
  const raw = note?.updated_date || note?.created_date;
  const date = raw ? new Date(raw) : null;
  if (!date || Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function TesterInbox() {
  const queryClient = useQueryClient();
  const { user, activeRelationshipId, activeRelationship } = useRelationshipAuth();
  const [messageDraft, setMessageDraft] = useState("");
  const [sharedDraftSource, setSharedDraftSource] = useState("");
  const [sending, setSending] = useState(false);
  const [sendConfirmation, setSendConfirmation] = useState("");
  const [expandedMessages, setExpandedMessages] = useState({});
  const textareaRef = useRef(null);
  const currentUserName = user?.name || "";
  const currentPersonName = activeRelationship?.current_person_name || currentUserName || "";
  const partnerName = getPartnerName(currentPersonName, activeRelationship?.participant_names || []);

  useEffect(() => {
    const pendingDraft = readSharedMessageDraft(activeRelationshipId);
    if (!pendingDraft?.message) return;

    setMessageDraft(pendingDraft.message);
    setSharedDraftSource(pendingDraft.sourceLabel || "RelateIQ");
    clearSharedMessageDraft();

    window.requestAnimationFrame(() => {
      textareaRef.current?.focus();
      const length = pendingDraft.message.length;
      textareaRef.current?.setSelectionRange(length, length);
    });
  }, [activeRelationshipId]);

  const { data: messages = [] } = useQuery({
    queryKey: ["tester-inbox-messages", activeRelationshipId],
    queryFn: () => api.entities.Note.filter({ related_section: "messages" }),
    enabled: Boolean(activeRelationshipId),
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const inboxMessages = useMemo(
    () =>
      messages
        .filter((note) => note.recipient_name === currentPersonName && note.shared_with_partner)
        .sort((left, right) => new Date(right.updated_date || right.created_date) - new Date(left.updated_date || left.created_date)),
    [messages, currentPersonName],
  );

  const sentMessages = useMemo(
    () =>
      messages
        .filter((note) => note.person_name === currentPersonName && note.related_section === "messages")
        .sort((left, right) => new Date(right.updated_date || right.created_date) - new Date(left.updated_date || left.created_date)),
    [messages, currentPersonName],
  );

  const unreadMessages = inboxMessages.filter((note) => !note.read_by_recipient && note.id);

  const markAllRead = async () => {
    if (!unreadMessages.length) return;
    await Promise.all(unreadMessages.map((note) => api.entities.Note.update(note.id, { read_by_recipient: true }).catch(() => null)));
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["tester-inbox-messages", activeRelationshipId] }),
      queryClient.invalidateQueries({ queryKey: ["topbar-notes", activeRelationshipId] }),
      queryClient.invalidateQueries({ queryKey: ["home-notes", activeRelationshipId] }),
    ]);
  };

  const handleSend = async () => {
    if (!messageDraft.trim()) return;
    setSending(true);
    try {
      await api.entities.Note.create({
        person_name: currentPersonName,
        recipient_name: partnerName,
        content: messageDraft.trim(),
        related_section: "messages",
        related_item_id: activeRelationshipId,
        relationship_id: activeRelationshipId,
        shared_with_partner: true,
        read_by_recipient: false,
        message_type: "manual_message",
      });
      setMessageDraft("");
      setSharedDraftSource("");
      setSendConfirmation(`Message sent to ${partnerName}. It is now visible in Sent Messages and their notification feed.`);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["tester-inbox-messages", activeRelationshipId] }),
        queryClient.invalidateQueries({ queryKey: ["topbar-notes", activeRelationshipId] }),
        queryClient.invalidateQueries({ queryKey: ["home-notes", activeRelationshipId] }),
      ]);
      toast.success(`Message sent to ${partnerName}.`);
    } catch {
      toast.error("Unable to send message right now.");
    } finally {
      setSending(false);
    }
  };

  const toggleMessage = (id) => {
    if (!id) return;
    setExpandedMessages((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  return (
    <div className="space-y-6">
      <Card className="border border-border/70 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Connection Inbox</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Send direct messages to {partnerName || "the other person in this connection"} and track incoming updates in one place.
          </p>
          {sharedDraftSource ? (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
              Draft loaded from {sharedDraftSource}. Review it, then send when ready.
            </div>
          ) : null}
          <Textarea
            ref={textareaRef}
            value={messageDraft}
            onChange={(event) => {
              setMessageDraft(event.target.value);
              if (sendConfirmation) setSendConfirmation("");
            }}
            placeholder={`Write a direct message to ${partnerName || "the other person in this connection"}...`}
            className="min-h-[140px] resize-none"
          />
          {sendConfirmation ? (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground">
              {sendConfirmation}
            </div>
          ) : null}
          <div className="flex justify-end">
            <Button onClick={handleSend} disabled={sending || !messageDraft.trim()}>
              {sending ? "Sending..." : `Send to ${partnerName || "Connection Partner"}`}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-border/70 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Incoming Messages</CardTitle>
            <Button variant="outline" size="sm" onClick={() => void markAllRead()} disabled={!unreadMessages.length}>
              Mark all as read
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {inboxMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No messages from {partnerName || "the other person in this connection"} yet.</p>
            ) : (
              inboxMessages.map((note) => (
                <div key={note.id} className="rounded-2xl border border-border/70 bg-background p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">
                        From {note.person_name || "Unknown"}: {firstSentence(note.content, 92)}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatMessageTimestamp(note)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!note.read_by_recipient ? (
                        <span className="inline-flex rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">Unread</span>
                      ) : null}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => toggleMessage(note.id)}
                      >
                        {expandedMessages[note.id] ? "Collapse" : "Expand"}
                      </Button>
                    </div>
                  </div>
                  {expandedMessages[note.id] ? <p className="text-sm whitespace-pre-wrap text-foreground">{note.content}</p> : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Sent Messages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {sentMessages.length === 0 ? (
              <p className="text-sm text-muted-foreground">No sent messages yet.</p>
            ) : (
              sentMessages.map((note) => (
                <div key={note.id} className="rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-foreground">
                        To {note.recipient_name || partnerName || "Connection Partner"}: {firstSentence(note.content, 88)}
                      </p>
                      <p className="text-xs text-muted-foreground">{formatMessageTimestamp(note)}</p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => toggleMessage(`sent-${note.id}`)}
                    >
                      {expandedMessages[`sent-${note.id}`] ? "Collapse" : "Expand"}
                    </Button>
                  </div>
                  {expandedMessages[`sent-${note.id}`] ? (
                    <p className="text-sm whitespace-pre-wrap text-foreground">{note.content}</p>
                  ) : null}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}