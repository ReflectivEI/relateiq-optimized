import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRelationshipAuth } from "@/context/RelationshipAuthContext";
import { api } from "@/api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { Trash2, Send, Search } from "lucide-react";
import { cn } from "@/lib/utils";

function firstSentence(text = "", maxChars = 110) {
  const normalized = String(text || "").replace(/\s+/g, " ").trim();
  if (!normalized) return "No message preview available.";
  const sentence = normalized.split(/(?<=[.!?])\s+/)[0] || normalized;
  if (sentence.length <= maxChars) return sentence;
  return `${sentence.slice(0, maxChars - 3).trimEnd()}...`;
}

function formatMessageTimestamp(message) {
  const date = new Date(message.created_date || message.updated_date);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Inbox() {
  const { activeRelationshipId, user, primaryPerson, secondaryPerson } = useRelationshipAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [messageDraft, setMessageDraft] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [selectedTab, setSelectedTab] = useState("inbox");
  const [expandedMessages, setExpandedMessages] = useState({});
  const queryClient = useQueryClient();

  const currentPersonName = user?.name || primaryPerson;
  const partnerName = (currentPersonName === primaryPerson) ? secondaryPerson : primaryPerson;

  const { data: notes = [] } = useQuery({
    queryKey: ["messages-inbox", activeRelationshipId],
    queryFn: () => api.entities.Note.filter({}),
    enabled: Boolean(activeRelationshipId),
    refetchInterval: 5000,
  });

  const inboxMessages = useMemo(() => {
    return notes
      .filter((note) => note.related_section === "messages")
      .filter((note) => note.recipient_name === currentPersonName)
      .sort(
        (left, right) =>
          new Date(right.updated_date || right.created_date) -
          new Date(left.updated_date || left.created_date)
      )
      .filter(
        (msg) =>
          !searchTerm ||
          msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          msg.person_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [notes, currentPersonName, searchTerm]);

  const sentMessages = useMemo(() => {
    return notes
      .filter((note) => note.related_section === "messages")
      .filter((note) => note.person_name === currentPersonName)
      .sort(
        (left, right) =>
          new Date(right.updated_date || right.created_date) -
          new Date(left.updated_date || left.created_date)
      )
      .filter(
        (msg) =>
          !searchTerm ||
          msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          msg.recipient_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [notes, currentPersonName, searchTerm]);

  const unreadMessages = inboxMessages.filter((note) => !note.read_by_recipient);

  const handleSendMessage = async () => {
    if (!messageDraft.trim()) return;
    setSendingMessage(true);
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
      queryClient.invalidateQueries({ queryKey: ["messages-inbox"] });
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      await api.entities.Note.delete(messageId);
      queryClient.invalidateQueries({ queryKey: ["messages-inbox"] });
    } catch (error) {
      console.error("Failed to delete message:", error);
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
    <div className="min-h-screen bg-background">
      <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 font-display">Inbox</h1>
          <p className="text-muted-foreground text-lg">
            Send messages and manage connection communication.
          </p>
        </div>

        {/* Send Message Section */}
        <Card className="border border-border/50 mb-8 bg-card/50">
          <CardHeader>
            <CardTitle className="text-2xl">Send Message to {partnerName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              placeholder={`Send a message to ${partnerName}...`}
              value={messageDraft}
              onChange={(e) => setMessageDraft(e.target.value)}
              className="min-h-24 resize-none"
            />
            <Button
              onClick={handleSendMessage}
              disabled={!messageDraft.trim() || sendingMessage}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              {sendingMessage ? "Sending..." : "Send Message"}
            </Button>
          </CardContent>
        </Card>

        {/* Messages Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-6 bg-card/50">
            <TabsTrigger value="inbox">
              Inbox
              {unreadMessages.length > 0 && (
                <span className="ml-2 inline-flex items-center justify-center h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">
                  {unreadMessages.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
          </TabsList>

          {/* Inbox Tab */}
          <TabsContent value="inbox" className="space-y-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {inboxMessages.length === 0 ? (
              <Card className="border border-border/50">
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No messages yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {inboxMessages.map((message) => (
                  <Card
                    key={message.id}
                    className={cn(
                      "border border-border/50 cursor-pointer hover:bg-accent/50 transition-colors",
                      !message.read_by_recipient && "border-primary/50 bg-primary/5"
                    )}
                  >
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground">
                            {message.person_name}: {firstSentence(message.content, 95)}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">{formatMessageTimestamp(message)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => toggleMessage(message.id)}>
                            {expandedMessages[message.id] ? "Collapse" : "Expand"}
                          </Button>
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className="p-2 hover:bg-destructive/10 text-destructive rounded-md transition-colors flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {expandedMessages[message.id] ? (
                        <p className="text-sm whitespace-pre-wrap text-muted-foreground break-words">{message.content}</p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(message.created_date || message.updated_date), { addSuffix: true })}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Sent Tab */}
          <TabsContent value="sent" className="space-y-4">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {sentMessages.length === 0 ? (
              <Card className="border border-border/50">
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">No sent messages yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {sentMessages.map((message) => (
                  <Card key={message.id} className="border border-border/50">
                    <CardContent className="pt-4 space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground">To: {message.recipient_name} — {firstSentence(message.content, 80)}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{formatMessageTimestamp(message)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 text-xs"
                            onClick={() => toggleMessage(`sent-${message.id}`)}
                          >
                            {expandedMessages[`sent-${message.id}`] ? "Collapse" : "Expand"}
                          </Button>
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className="p-2 hover:bg-destructive/10 text-destructive rounded-md transition-colors flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      {expandedMessages[`sent-${message.id}`] ? (
                        <p className="text-sm whitespace-pre-wrap text-muted-foreground break-words">{message.content}</p>
                      ) : null}
                      <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(message.created_date || message.updated_date), { addSuffix: true })}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
