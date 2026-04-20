import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Send,
  Brain,
  Lightbulb,
  MessageSquare,
  RotateCcw,
  FileText,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Target,
  Loader2,
  Radio,
  HelpCircle,
} from "lucide-react";
import reflectivAILogo from "@assets/E2ABF40D-E679-443C-A1B7-6681EF25E7E7_1764541714586.png";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { diseaseStates, hcpCategories, influenceDrivers, specialtiesByDiseaseState, allSpecialties } from "@/lib/data";
import { SignalIntelligencePanel, type ObservableSignal } from "@/components/signal-intelligence-panel";
import type { Message } from "@shared/schema";

const isValidSignalType = (t: unknown): t is ObservableSignal["type"] =>
  t === "verbal" || t === "conversational" || t === "engagement" || t === "contextual";

function normalizeSignals(raw: unknown): ObservableSignal[] {
  if (!Array.isArray(raw)) return [];
  const now = Date.now();
  const ts = new Date().toISOString();

  const out: ObservableSignal[] = [];
  for (let i = 0; i < raw.length; i++) {
    const s = raw[i];
    if (s == null) continue;

    if (typeof s === "string") {
      const text = s.trim();
      if (!text) continue;
      out.push({
        id: `signal-${now}-${i}`,
        type: "contextual",
        signal: text,
        interpretation: "",
        timestamp: ts,
      });
      continue;
    }

    const obj = s as any;
    const signal = typeof obj.signal === "string" ? obj.signal.trim() : "";
    const interpretation = typeof obj.interpretation === "string" ? obj.interpretation.trim() : "";
    const suggestedResponse = typeof obj.suggestedResponse === "string" ? obj.suggestedResponse.trim() : undefined;
    const type: ObservableSignal["type"] = isValidSignalType(obj.type) ? obj.type : "contextual";
    if (!signal && !interpretation && !suggestedResponse) continue;

    out.push({
      id: typeof obj.id === "string" && obj.id ? obj.id : `signal-${now}-${i}`,
      type,
      signal,
      interpretation,
      suggestedResponse,
      timestamp: typeof obj.timestamp === "string" && obj.timestamp ? obj.timestamp : ts,
    });
  }
  return out;
}

type SessionSummary = {
  summary: string;
  keyTakeaways: string[];
  skillsDiscussed: string[];
  actionItems: string[];
  nextSteps: string;
  objectionsSurfaced?: string[];
  signalIntelligenceHighlights?: Array<{
    type: "verbal" | "conversational" | "engagement" | "contextual";
    signal: string;
    evidence?: string;
    interpretation: string;
    suggestedResponse?: string;
  }>;
};

type CoachPromptBundle = {
  conversationStarters: string[];
  suggestedTopics: string[];
  timestamp: string;
};

function formatMessageContent(content: unknown) {
  const safe = typeof content === "string" ? content : content == null ? "" : String(content);
  const lines = safe.split("\n");

  return lines.map((line, lineIndex) => {
    let processedLine = line;

    const headingMatch = processedLine.match(/^#{1,3}\s*(\d+\.?\s*)(.+)$/);
    if (headingMatch) {
      const [, number, title] = headingMatch;
      const cleanTitle = title.replace(/\*\*/g, '');
      return (
        <span key={lineIndex}>
          <strong className="font-semibold">{number}{cleanTitle}</strong>
          {lineIndex < lines.length - 1 && '\n'}
        </span>
      );
    }

    const parts = processedLine.split(/(\*\*[^*]+\*\*)/g);
    const formattedParts = parts.map((part, partIndex) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        const boldText = part.slice(2, -2);
        return <strong key={partIndex} className="font-semibold">{boldText}</strong>;
      }
      return <span key={partIndex}>{part}</span>;
    });

    return (
      <span key={lineIndex}>
        {formattedParts}
        {lineIndex < lines.length - 1 && '\n'}
      </span>
    );
  });
}

function normalizeMessages(raw: unknown): Message[] {
  if (!Array.isArray(raw)) return [];
  const out: Message[] = [];
  for (let i = 0; i < raw.length; i++) {
    const m = raw[i] as any;
    if (!m || (typeof m !== "object" && typeof m !== "function")) continue;
    const role = m.role === "user" || m.role === "assistant" ? m.role : "assistant";
    const content = typeof m.content === "string" ? m.content : m.content == null ? "" : String(m.content);
    const timestamp = typeof m.timestamp === "number" ? m.timestamp : Date.now();
    const id = typeof m.id === "string" && m.id ? m.id : `msg-${timestamp}-${i}`;
    const feedback = m.feedback && typeof m.feedback === "object" ? m.feedback : undefined;
    out.push({ id, role, content, timestamp, feedback } as Message);
  }
  return out;
}

function safePromptList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x) => typeof x === "string" && x.trim())
    .map((s) => String(s).trim())
    .slice(0, 12);
}

export default function ChatPage() {
  const [input, setInput] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [selectedDiseaseState, setSelectedDiseaseState] = useState<string>("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("");
  const [selectedHcpCategory, setSelectedHcpCategory] = useState<string>("");
  const [selectedInfluenceDriver, setSelectedInfluenceDriver] = useState<string>("");
  const [discEnabled, setDiscEnabled] = useState<boolean>(false);
  const [observableSignals, setObservableSignals] = useState<ObservableSignal[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  const selectedDisease = diseaseStates.find(d => d.id === selectedDiseaseState);
  const selectedCategory = hcpCategories.find(c => c.id === selectedHcpCategory);
  const selectedDriver = influenceDrivers.find(d => d.id === selectedInfluenceDriver);

  const { data: coachPrompts, isLoading: isPromptsLoading } = useQuery<CoachPromptBundle>({
    queryKey: ["/api/coach/prompts", selectedDiseaseState, selectedSpecialty, selectedHcpCategory, selectedInfluenceDriver],
    queryFn: async () => {
      const response = await apiRequest("POST", "/api/coach/prompts", {
        diseaseState: selectedDiseaseState,
        specialty: selectedSpecialty,
        hcpCategory: selectedHcpCategory,
        influenceDriver: selectedInfluenceDriver,
      });
      return response.json() as Promise<CoachPromptBundle>;
    },
    staleTime: 1000 * 60,
  });

  const conversationStarters = safePromptList(coachPrompts?.conversationStarters);
  const suggestedTopics = safePromptList(coachPrompts?.suggestedTopics);

  // Filter specialties based on selected disease state
  const availableSpecialties = selectedDiseaseState
    ? specialtiesByDiseaseState[selectedDiseaseState] || allSpecialties
    : allSpecialties;

  // Clear specialty if it's no longer in filtered list
  useEffect(() => {
    if (selectedSpecialty && !availableSpecialties.includes(selectedSpecialty)) {
      setSelectedSpecialty("");
    }
  }, [selectedDiseaseState, availableSpecialties, selectedSpecialty]);

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/chat/messages"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/chat/messages");
      const data = await response.json().catch(() => null);
      if (Array.isArray(data)) {
        return normalizeMessages(data);
      }
      return normalizeMessages((data as any)?.messages);
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      // Send both keys for compatibility with worker (message) and server (content)
      const response = await apiRequest("POST", "/api/chat/send", {
        message: content,
        content,
        context: {
          diseaseState: selectedDiseaseState,
          specialty: selectedSpecialty,
          hcpCategory: selectedHcpCategory,
          influenceDriver: selectedInfluenceDriver,
          discEnabled,
        },
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Immediately reflect returned messages to avoid UI gaps if refetch races
      if (Array.isArray(data?.messages)) {
        queryClient.setQueryData(["/api/chat/messages"], normalizeMessages(data.messages));
      } else if (data?.userMessage || data?.aiMessage) {
        queryClient.setQueryData(["/api/chat/messages"], (prev: Message[] | undefined) => {
          const next = Array.isArray(prev) ? [...prev] : [];
          const appended = normalizeMessages([data.userMessage, data.aiMessage]);
          return [...next, ...appended];
        });
      }

      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });

      // Update observable signals from the AI response (normalized to prevent runtime crashes)
      const nextSignals = normalizeSignals((data as any)?.signals);
      if (nextSignals.length) {
        setObservableSignals((prev) => [...prev, ...nextSignals]);
      }
    },
  });

  const clearChatMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/chat/clear");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat/messages"] });
      setObservableSignals([]);
    },
  });

  const summaryMutation = useMutation({
    mutationFn: async () => {
      // Workers may expose summary as GET (parity-v2) or POST (server). Try POST first, then fall back.
      const postRes = await apiRequest("POST", "/api/chat/summary");
      if (postRes.ok) return postRes.json() as Promise<SessionSummary>;

      if (postRes.status === 404 || postRes.status === 405) {
        const getRes = await apiRequest("GET", "/api/chat/summary");
        return getRes.json() as Promise<SessionSummary>;
      }

      return postRes.json() as Promise<SessionSummary>;
    },
  });

  const handleGetSummary = () => {
    setShowSummary(true);
    summaryMutation.mutate();
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || sendMessageMutation.isPending) return;
    sendMessageMutation.mutate(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-6 border-b flex-shrink-0">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <img
              src={reflectivAILogo}
              alt="ReflectivAI Logo"
              className="h-10 w-10 rounded-md"
            />
            <div>
              <h1 className="text-xl font-semibold" data-testid="text-chat-title">AI Coach</h1>
              <p className="text-sm text-muted-foreground">
                Your personal pharma sales coaching assistant
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {messages.length >= 2 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleGetSummary}
                disabled={summaryMutation.isPending}
                data-testid="button-session-summary"
              >
                {summaryMutation.isPending ? (
                  <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                ) : (
                  <FileText className="h-4 w-4 mr-2" />
                )}
                Session Summary
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearChatMutation.mutate()}
              disabled={clearChatMutation.isPending}
              data-testid="button-clear-chat"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <Select value={selectedDiseaseState} onValueChange={setSelectedDiseaseState}>
            <SelectTrigger data-testid="select-disease-state">
              <SelectValue placeholder="Disease State" />
            </SelectTrigger>
            <SelectContent>
              {diseaseStates.map((disease) => (
                <SelectItem key={disease.id} value={disease.id}>
                  {disease.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
            <SelectTrigger data-testid="select-specialty">
              <SelectValue placeholder="Specialty" />
            </SelectTrigger>
            <SelectContent>
              {availableSpecialties.map((specialty) => (
                <SelectItem key={specialty} value={specialty}>
                  {specialty}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedHcpCategory} onValueChange={setSelectedHcpCategory}>
            <SelectTrigger data-testid="select-hcp-category">
              <SelectValue placeholder="HCP Category" />
            </SelectTrigger>
            <SelectContent>
              {hcpCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedInfluenceDriver} onValueChange={setSelectedInfluenceDriver}>
            <SelectTrigger data-testid="select-influence-driver">
              <SelectValue placeholder="Influence Driver" />
            </SelectTrigger>
            <SelectContent>
              {influenceDrivers.map((driver) => (
                <SelectItem key={driver.id} value={driver.id}>
                  {driver.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-2">
            <Switch
              id="disc-toggle"
              checked={discEnabled}
              onCheckedChange={setDiscEnabled}
              data-testid="switch-disc-toggle"
            />
            <Label htmlFor="disc-toggle" className="text-sm cursor-pointer">
              DISC Model
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-xs">
                  Enable DISC behavioral communication lens. When on, the AI coach may reference
                  communication style preferences (D-I-S-C) to help you adapt your approach.
                  Note: DISC describes observable preferences, not personality or EI capability.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          {discEnabled && (
            <Badge variant="outline" className="text-xs">
              DISC Enabled
            </Badge>
          )}
        </div>

        {(selectedDisease || selectedSpecialty || selectedCategory || selectedDriver) && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {selectedDisease && (
              <Badge variant="secondary" data-testid="badge-selected-disease">
                {selectedDisease.name}
              </Badge>
            )}
            {selectedSpecialty && (
              <Badge variant="outline" data-testid="badge-selected-specialty">
                {selectedSpecialty}
              </Badge>
            )}
            {selectedCategory && (
              <Badge variant="outline" data-testid="badge-selected-category">
                {selectedCategory.name}
              </Badge>
            )}
            {selectedDriver && (
              <Badge variant="outline" data-testid="badge-selected-driver">
                {selectedDriver.name}
              </Badge>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto pr-4">
            <div className="space-y-4 pb-4">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-20 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <MessageSquare className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Start a Conversation</h3>
                  <p className="text-muted-foreground max-w-md mb-6">
                    Ask me anything about pharma sales, emotional intelligence frameworks,
                    objection handling, or clinical evidence communication.
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                    {(conversationStarters.length ? conversationStarters : []).slice(0, 3).map((prompt) => (
                      <Button
                        key={prompt}
                        variant="outline"
                        size="sm"
                        className="text-xs"
                        onClick={() => handlePromptClick(prompt)}
                        data-testid={`button-prompt-${prompt.slice(0, 20).replace(/\s+/g, '-')}`}
                      >
                        {prompt}
                      </Button>
                    ))}
                    {!conversationStarters.length && !isPromptsLoading && (
                      <p className="text-xs text-muted-foreground">Unable to load conversation starters.</p>
                    )}
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                    data-testid={`message-${message.id}`}
                  >
                    <div
                      className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden ${message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : ""
                        }`}
                    >
                      {message.role === "user" ? (
                        <span className="text-sm font-medium">You</span>
                      ) : (
                        <img src={reflectivAILogo} alt="AI" className="h-8 w-8 rounded-full" />
                      )}
                    </div>
                    <div
                      className={`flex-1 max-w-[80%] ${message.role === "user" ? "text-right" : ""
                        }`}
                    >
                      <div
                        className={`inline-block p-3 rounded-lg ${message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                          }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{formatMessageContent(message.content)}</p>
                      </div>
                      {message.feedback && (
                        <div className="mt-2 p-3 bg-card border rounded-lg text-left">
                          {message.feedback.eqScore !== undefined && (
                            <div className="flex items-center gap-2 mb-2">
                              <Brain className="h-4 w-4 text-primary" />
                              <span className="text-sm font-medium">
                                EQ Score: {message.feedback.eqScore}
                              </span>
                            </div>
                          )}
                          {message.feedback.frameworks && message.feedback.frameworks.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {message.feedback.frameworks.map((fw) => (
                                <Badge key={fw} variant="secondary" className="text-xs">
                                  {fw}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {message.feedback.suggestions && message.feedback.suggestions.length > 0 && (
                            <div className="space-y-1">
                              {message.feedback.suggestions.map((s, i) => (
                                <p key={i} className="text-xs text-muted-foreground">
                                  <Lightbulb className="h-3 w-3 inline mr-1" />
                                  {s}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
              {sendMessageMutation.isPending && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full overflow-hidden relative">
                    <img src={reflectivAILogo} alt="AI" className="h-8 w-8 rounded-full" />
                    <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full">
                      <Loader2 className="h-5 w-5 text-primary animate-spin" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="inline-block p-3 rounded-lg bg-muted">
                      <div className="flex items-center gap-3">
                        <Loader2 className="h-4 w-4 text-primary animate-spin" />
                        <span className="text-sm text-muted-foreground">Thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t">
            <div className="flex gap-2">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about sales techniques, EI frameworks, objection handling..."
                className="min-h-[60px] resize-none"
                data-testid="input-chat-message"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || sendMessageMutation.isPending}
                className="self-end"
                data-testid="button-send-message"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="w-72 flex-shrink-0 hidden lg:flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto pr-2">
            <Card className="mb-4">
              <CardContent className="pt-6">
                <SignalIntelligencePanel
                  signals={observableSignals}
                  isLoading={sendMessageMutation.isPending}
                  hasActivity={messages.length > 0}
                  compact={false}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Suggested Topics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {suggestedTopics.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handlePromptClick(prompt)}
                    className="w-full text-left p-2 text-sm rounded-md hover-elevate text-muted-foreground"
                    data-testid={`button-suggested-${prompt.slice(0, 15).replace(/\s+/g, '-')}`}
                  >
                    {prompt}
                  </button>
                ))}
                {!suggestedTopics.length && !isPromptsLoading && (
                  <p className="text-xs text-muted-foreground">Unable to load suggested topics.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Session Summary
            </DialogTitle>
            <DialogDescription>
              Key takeaways and action items from your coaching conversation
            </DialogDescription>
          </DialogHeader>

          {summaryMutation.isPending ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : summaryMutation.isError ? (
            <div className="py-4 text-center">
              <p className="text-destructive mb-4">Failed to generate summary. Please try again.</p>
              <Button onClick={() => summaryMutation.mutate()} data-testid="button-retry-summary">
                Try Again
              </Button>
            </div>
          ) : summaryMutation.data ? (
            <div className="space-y-6 py-4">
              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-chart-1" />
                  Overview
                </h3>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                  {summaryMutation.data.summary}
                </p>
              </div>

              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-chart-2" />
                  Key Takeaways
                </h3>
                <ul className="space-y-2">
                  {summaryMutation.data.keyTakeaways.map((takeaway, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-chart-4 flex-shrink-0 mt-0.5" />
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Brain className="h-4 w-4 text-chart-3" />
                  Skills Discussed
                </h3>
                <div className="flex flex-wrap gap-2">
                  {summaryMutation.data.skillsDiscussed.map((skill, i) => (
                    <Badge key={i} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4 text-chart-4" />
                  Action Items
                </h3>
                <ul className="space-y-2">
                  {summaryMutation.data.actionItems.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm bg-primary/5 p-2 rounded-md">
                      <ArrowRight className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 border-t">
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Next Steps
                </h3>
                <p className="text-sm text-muted-foreground">
                  {summaryMutation.data.nextSteps}
                </p>
              </div>

              {Array.isArray(summaryMutation.data.objectionsSurfaced) && summaryMutation.data.objectionsSurfaced.length > 0 && (
                <div className="pt-2 border-t">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <Radio className="h-4 w-4 text-chart-2" />
                    Objections Surfaced
                  </h3>
                  <ul className="space-y-2">
                    {summaryMutation.data.objectionsSurfaced.map((objection, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-chart-3 flex-shrink-0 mt-0.5" />
                        <span>{objection}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {Array.isArray(summaryMutation.data.signalIntelligenceHighlights) && summaryMutation.data.signalIntelligenceHighlights.length > 0 && (
                <div className="pt-2 border-t">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-chart-4" />
                    Signal Intelligence Highlights
                  </h3>
                  <div className="space-y-3">
                    {summaryMutation.data.signalIntelligenceHighlights.map((s, i) => (
                      <div key={i} className="p-3 rounded-md border bg-muted/40">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="secondary" className="text-xs">{s.type}</Badge>
                          <span className="text-sm font-medium">{s.signal}</span>
                        </div>
                        {s.evidence && (
                          <p className="text-xs text-muted-foreground mb-1"><strong>Evidence:</strong> {s.evidence}</p>
                        )}
                        <p className="text-xs text-muted-foreground"><strong>Interpretation:</strong> {s.interpretation}</p>
                        {s.suggestedResponse && (
                          <p className="text-xs text-muted-foreground mt-1"><strong>Suggested response:</strong> {s.suggestedResponse}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
