import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Brain,
  Ear,
  Heart,
  Handshake,
  ChevronRight,
  Lightbulb,
  MessageSquare,
  Sparkles,
  Send,
  Target,
  Copy,
  Check,
  Shield,
  Search,
  Wand2,
} from "lucide-react";
import { eqFrameworks, communicationStyleModels, heuristicTemplates } from "@/lib/data";
import type { EQFramework, HeuristicTemplate } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

import { MessageSquareText } from "lucide-react";

const frameworkIcons: Record<string, any> = {
  disc: MessageSquareText,
  "active-listening": Ear,
  "empathy-mapping": Heart,
  "rapport-building": Handshake,
};

const heuristicCategoryIcons: Record<string, any> = {
  objection: Shield,
  "value-proposition": Sparkles,
  closing: Target,
  discovery: Search,
  rapport: Handshake,
};

const heuristicCategoryLabels: Record<string, string> = {
  objection: "Objection Handling",
  "value-proposition": "Value Proposition",
  closing: "Closing Techniques",
  discovery: "Discovery Questions",
  rapport: "Rapport Building",
};

export default function FrameworksPage() {
  const [activeTab, setActiveTab] = useState("communication");
  const [selectedFramework, setSelectedFramework] = useState<EQFramework | null>(null);
  const [situation, setSituation] = useState("");
  const [aiAdvice, setAiAdvice] = useState<{ advice: string; practiceExercise: string; tips: string[] } | null>(null);
  const [activeHeuristicCategory, setActiveHeuristicCategory] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<HeuristicTemplate | null>(null);
  const [heuristicSituation, setHeuristicSituation] = useState("");
  const [customization, setCustomization] = useState<{ customizedTemplate: string; example: string; tips: string[] } | null>(null);

  const getAdviceMutation = useMutation({
    mutationFn: async (data: { frameworkId: string; frameworkName: string; situation: string }) => {
      const response = await apiRequest("POST", "/api/frameworks/advice", data);
      return response.json();
    },
    onSuccess: (data) => {
      setAiAdvice(data);
    },
  });

  const customizeMutation = useMutation({
    mutationFn: async (data: { templateName: string; templatePattern: string; userSituation: string }) => {
      const response = await apiRequest("POST", "/api/heuristics/customize", data);
      return response.json();
    },
    onSuccess: (data) => {
      setCustomization(data);
    },
  });

  const handleGetAdvice = () => {
    if (!situation.trim() || !selectedFramework) return;
    getAdviceMutation.mutate({
      frameworkId: selectedFramework.id,
      frameworkName: selectedFramework.name,
      situation,
    });
  };

  const handleCustomize = () => {
    if (!selectedTemplate || !heuristicSituation.trim()) return;
    customizeMutation.mutate({
      templateName: selectedTemplate.name,
      templatePattern: selectedTemplate.template,
      userSituation: heuristicSituation,
    });
  };

  const filteredTemplates =
    activeHeuristicCategory === "all"
      ? heuristicTemplates
      : heuristicTemplates.filter((t) => t.category === activeHeuristicCategory);

  const handleCopy = async (template: HeuristicTemplate) => {
    await navigator.clipboard.writeText(template.template);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyCustomized = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId("customized");
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (selectedFramework) {
    const IconComponent = frameworkIcons[selectedFramework.id] || Brain;

    return (
      <div className="h-full overflow-auto">
        <div className="p-6">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => {
              setSelectedFramework(null);
              setAiAdvice(null);
              setSituation("");
            }}
            data-testid="button-back-frameworks"
          >
            <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
            Back to Frameworks
          </Button>

          <div className="max-w-4xl mx-auto">
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className={`h-14 w-14 rounded-md bg-${selectedFramework.color} flex items-center justify-center`}>
                    <IconComponent className="h-7 w-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl" data-testid="text-framework-detail-title">
                      {selectedFramework.name}
                    </CardTitle>
                    <CardDescription className="mt-2 text-base">
                      {selectedFramework.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Framework Advisor
                </CardTitle>
                <CardDescription>
                  Describe your situation and get personalized advice on applying {selectedFramework.name}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={situation}
                  onChange={(e) => setSituation(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleGetAdvice();
                    }
                  }}
                  placeholder="Describe your sales situation... e.g., 'I'm meeting with a skeptical oncologist who prefers data-driven discussions'"
                  className="min-h-[80px] resize-none bg-background"
                  data-testid="input-framework-situation"
                />
                <Button
                  onClick={handleGetAdvice}
                  disabled={!situation.trim() || getAdviceMutation.isPending}
                  className="w-full"
                  data-testid="button-get-framework-advice"
                >
                  {getAdviceMutation.isPending ? (
                    <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {getAdviceMutation.isPending ? "Getting Personalized Advice..." : "Get AI Advice"}
                </Button>

                {aiAdvice && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        Personalized Advice
                      </h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {aiAdvice.advice}
                      </p>
                    </div>

                    <div className="p-3 bg-background rounded-lg border">
                      <h4 className="font-medium mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4 text-chart-2" />
                        Practice Exercise
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {aiAdvice.practiceExercise}
                      </p>
                    </div>

                    {aiAdvice.tips && aiAdvice.tips.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Quick Tips:</h4>
                        <ul className="space-y-1">
                          {aiAdvice.tips.map((tip, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <ChevronRight className="h-4 w-4 flex-shrink-0 mt-0.5 text-primary" />
                              {tip}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    Key Principles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {selectedFramework.principles.map((principle, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className={`h-6 w-6 rounded-full bg-${selectedFramework.color}/10 flex items-center justify-center flex-shrink-0`}>
                          <span className={`text-xs font-medium text-${selectedFramework.color}`}>{index + 1}</span>
                        </div>
                        <span className="text-sm">{principle}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Quick Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">In pharma sales contexts:</p>
                    <p className="text-sm text-muted-foreground">
                      Apply this framework when meeting with healthcare providers to build stronger relationships and understand their unique prescribing motivations.
                    </p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Practice daily:</p>
                    <p className="text-sm text-muted-foreground">
                      Use the role-play simulator to practice applying this framework in realistic pharma scenarios.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Techniques & Examples</CardTitle>
                <CardDescription>
                  Practical techniques with real-world pharma sales examples
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {selectedFramework.techniques.map((technique, index) => (
                    <div key={index} className="border-l-2 border-primary pl-4">
                      <h4 className="font-semibold mb-1">{technique.name}</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {technique.description}
                      </p>
                      <div className="bg-muted p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Example:</p>
                        <p className="text-sm italic">"{technique.example}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-6">
        <div className="flex flex-col gap-2 mb-6">
          <h1 className="text-2xl font-bold" data-testid="text-frameworks-title">Selling & Coaching Frameworks</h1>
          <div className="text-muted-foreground space-y-2">
            <p>
              ReflectivAI is powered by Signal Intelligence — the ability to notice, interpret, and respond appropriately to observable signals during professional interactions.
            </p>
            <p>
              Our AI highlights meaningful behavioral signals. Sales professionals apply judgment using demonstrated emotional intelligence capabilities, communication models, and coaching tools that work in real conversations.
            </p>
          </div>
        </div>

        {/* Three-Layer Hierarchy Overview */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-green-600">1</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Emotional Intelligence</p>
                  <p className="text-xs text-muted-foreground">Core measurement layer - what we measure and optimize</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-blue-600">2</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Behavioral Models</p>
                  <p className="text-xs text-muted-foreground">Supporting insight layer - how to adapt communication</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-purple-600">3</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Coaching Tools</p>
                  <p className="text-xs text-muted-foreground">Action layer - how improvement happens</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="communication" data-testid="tab-communication-styles">
              <MessageSquareText className="h-4 w-4 mr-2" />
              Layer 2: Behavioral Models
            </TabsTrigger>
            <TabsTrigger value="empathy" data-testid="tab-empathy-adaptation">
              <Heart className="h-4 w-4 mr-2" />
              Layer 1: EI Frameworks
            </TabsTrigger>
            <TabsTrigger value="heuristics" data-testid="tab-heuristics">
              <Target className="h-4 w-4 mr-2" />
              Layer 3: Coaching Tools
            </TabsTrigger>
          </TabsList>

          <TabsContent value="communication" className="mt-6">
            <Card className="mb-6 border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <MessageSquareText className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-400">Important Distinction</p>
                    <p className="text-sm text-muted-foreground">
                      DISC is an optional behavioral communication lens that can support emotionally intelligent interactions—but it is not an emotional intelligence framework. It describes observable communication preferences, not emotional capability or demonstrated skills.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6 mb-8">
              {communicationStyleModels.map((framework) => {
                const IconComponent = frameworkIcons[framework.id] || MessageSquareText;
                return (
                  <Card
                    key={framework.id}
                    className="hover-elevate cursor-pointer"
                    onClick={() => setSelectedFramework(framework)}
                    data-testid={`card-framework-${framework.id}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`h-12 w-12 rounded-md bg-${framework.color} flex items-center justify-center flex-shrink-0`}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{framework.name}</h3>
                            <Badge variant="outline" className="text-xs">Behavioral Model</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {framework.description}
                          </p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Communication Styles:</h4>
                        <ul className="space-y-1">
                          {framework.principles.map((principle, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <ChevronRight className="h-4 w-4 flex-shrink-0 mt-0.5" />
                              <span>{principle}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {framework.techniques.length} techniques
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI Advisor
                          </Badge>
                        </div>
                        <Button variant="ghost" size="sm">
                          Learn More
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="empathy" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {eqFrameworks.map((framework) => {
                const IconComponent = frameworkIcons[framework.id] || Heart;
                return (
                  <Card
                    key={framework.id}
                    className="hover-elevate cursor-pointer"
                    onClick={() => setSelectedFramework(framework)}
                    data-testid={`card-framework-${framework.id}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`h-12 w-12 rounded-md bg-${framework.color} flex items-center justify-center flex-shrink-0`}>
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-lg">{framework.name}</h3>
                            <Badge variant="outline" className="text-xs text-primary border-primary/30">EI Skill</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {framework.description}
                          </p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h4 className="text-sm font-medium mb-2">Key Principles:</h4>
                        <ul className="space-y-1">
                          {framework.principles.slice(0, 3).map((principle, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <ChevronRight className="h-4 w-4 flex-shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{principle}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">
                            {framework.techniques.length} techniques
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            <Sparkles className="h-3 w-3 mr-1" />
                            AI Advisor
                          </Badge>
                        </div>
                        <Button variant="ghost" size="sm">
                          Learn More
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Why Emotional Intelligence Matters in Pharma Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4">
                    <div className="h-12 w-12 rounded-full bg-chart-1/10 flex items-center justify-center mx-auto mb-3">
                      <Heart className="h-6 w-6 text-chart-1" />
                    </div>
                    <h4 className="font-medium mb-1">Build Trust</h4>
                    <p className="text-sm text-muted-foreground">
                      Healthcare providers are more likely to engage with reps who demonstrate genuine understanding
                    </p>
                  </div>
                  <div className="text-center p-4">
                    <div className="h-12 w-12 rounded-full bg-chart-2/10 flex items-center justify-center mx-auto mb-3">
                      <Ear className="h-6 w-6 text-chart-2" />
                    </div>
                    <h4 className="font-medium mb-1">Understand Needs</h4>
                    <p className="text-sm text-muted-foreground">
                      EI skills help uncover the real challenges and priorities of your stakeholders
                    </p>
                  </div>
                  <div className="text-center p-4">
                    <div className="h-12 w-12 rounded-full bg-chart-3/10 flex items-center justify-center mx-auto mb-3">
                      <Handshake className="h-6 w-6 text-chart-3" />
                    </div>
                    <h4 className="font-medium mb-1">Close More</h4>
                    <p className="text-sm text-muted-foreground">
                      Strong emotional connections lead to higher engagement and better outcomes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="heuristics" className="mt-6">
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm mb-1">AI-Powered Template Customization</p>
                    <p className="text-sm text-muted-foreground">
                      Click "Customize with AI" on any template to personalize it for your specific situation. Signal Intelligence highlights observable cues that suggest when and how to adapt.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs value={activeHeuristicCategory} onValueChange={setActiveHeuristicCategory} className="mb-6">
              <TabsList className="flex-wrap h-auto gap-1">
                <TabsTrigger value="all" data-testid="tab-all-heuristics">All</TabsTrigger>
                <TabsTrigger value="discovery" data-testid="tab-discovery-heuristics">
                  <Search className="h-3 w-3 mr-1" />
                  Discovery
                </TabsTrigger>
                <TabsTrigger value="objection" data-testid="tab-objection-heuristics">
                  <Shield className="h-3 w-3 mr-1" />
                  Objection
                </TabsTrigger>
                <TabsTrigger value="value-proposition" data-testid="tab-value-heuristics">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Value Prop
                </TabsTrigger>
                <TabsTrigger value="closing" data-testid="tab-closing-heuristics">
                  <Target className="h-3 w-3 mr-1" />
                  Closing
                </TabsTrigger>
                <TabsTrigger value="rapport" data-testid="tab-rapport-heuristics">
                  <Handshake className="h-3 w-3 mr-1" />
                  Rapport
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredTemplates.map((template) => {
                const IconComponent = heuristicCategoryIcons[template.category] || MessageSquare;
                return (
                  <Card key={template.id} data-testid={`card-heuristic-${template.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center">
                            <IconComponent className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <CardTitle className="text-base">{template.name}</CardTitle>
                            <Badge variant="outline" className="mt-1">
                              {heuristicCategoryLabels[template.category]}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedTemplate(template);
                              setHeuristicSituation("");
                              setCustomization(null);
                            }}
                            data-testid={`button-customize-${template.id}`}
                          >
                            <Wand2 className="h-4 w-4 mr-1" />
                            Customize
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(template)}
                            data-testid={`button-copy-${template.id}`}
                          >
                            {copiedId === template.id ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Template</h4>
                        <div className="bg-muted p-3 rounded-lg">
                          <p className="text-sm font-medium">{template.template}</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2">Example</h4>
                        <div className="bg-primary/5 p-3 rounded-lg border-l-2 border-primary">
                          <p className="text-sm text-muted-foreground italic">"{template.example}"</p>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2">When to Use</h4>
                        <p className="text-sm text-muted-foreground">{template.useCase}</p>
                      </div>

                      <div className="flex flex-wrap gap-1 pt-2 border-t">
                        <span className="text-xs text-muted-foreground mr-1">EI Principles:</span>
                        {template.eqPrinciples.map((principle) => (
                          <Badge key={principle} variant="secondary" className="text-xs">
                            <Brain className="h-2 w-2 mr-1" />
                            {principle.replace("-", " ")}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Using Heuristic Templates Effectively</CardTitle>
                <CardDescription>Tips for natural, authentic application</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">1. Adapt, Don't Recite</h4>
                    <p className="text-sm text-muted-foreground">
                      Use the AI customization feature to adapt templates to your specific situation and stakeholder
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">2. Practice First</h4>
                    <p className="text-sm text-muted-foreground">
                      Use the role-play simulator to practice delivering templates naturally before real meetings
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">3. Be Authentic</h4>
                    <p className="text-sm text-muted-foreground">
                      Adapt the language to match your personal style while maintaining the structural effectiveness
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!selectedTemplate} onOpenChange={(open) => !open && setSelectedTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              Customize Template with AI
            </DialogTitle>
            <DialogDescription>
              Describe your specific situation and get a personalized version of the "{selectedTemplate?.name}" template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">Original Template:</p>
              <p className="text-sm text-muted-foreground">{selectedTemplate?.template}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Describe your situation:</label>
              <Textarea
                value={heuristicSituation}
                onChange={(e) => setHeuristicSituation(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleCustomize();
                  }
                }}
                placeholder="e.g., Meeting with a skeptical cardiologist who is concerned about drug costs for elderly patients"
                className="min-h-[80px] resize-none"
                data-testid="input-customization-situation"
              />
            </div>

            <Button
              onClick={handleCustomize}
              disabled={!heuristicSituation.trim() || customizeMutation.isPending}
              className="w-full"
              data-testid="button-generate-customization"
            >
              {customizeMutation.isPending ? (
                <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {customizeMutation.isPending ? "Generating..." : "Generate Personalized Template"}
            </Button>

            {customization && (
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Customized Template:</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopyCustomized(customization.customizedTemplate)}
                      data-testid="button-copy-customized"
                    >
                      {copiedId === "customized" ? (
                        <>
                          <Check className="h-4 w-4 mr-1 text-green-500" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <div className="p-3 bg-primary/5 rounded-lg border-l-2 border-primary">
                    <p className="text-sm whitespace-pre-wrap">{customization.customizedTemplate}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Example Dialogue:</h4>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground italic">"{customization.example}"</p>
                  </div>
                </div>

                {customization.tips && customization.tips.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Tips for Delivery:</h4>
                    <ul className="space-y-1">
                      {customization.tips.map((tip, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
