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
  Target,
  Copy,
  Check,
  MessageSquare,
  Shield,
  Sparkles,
  Search,
  Handshake,
  Brain,
  Send,
  Wand2,
} from "lucide-react";
import { heuristicTemplates } from "@/lib/data";
import type { HeuristicTemplate } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const categoryIcons: Record<string, any> = {
  objection: Shield,
  "value-proposition": Sparkles,
  closing: Target,
  discovery: Search,
  rapport: Handshake,
};

const categoryLabels: Record<string, string> = {
  objection: "Objection Handling",
  "value-proposition": "Value Proposition",
  closing: "Closing Techniques",
  discovery: "Discovery Questions",
  rapport: "Rapport Building",
};

export default function HeuristicsPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<HeuristicTemplate | null>(null);
  const [situation, setSituation] = useState("");
  const [customization, setCustomization] = useState<{ customizedTemplate: string; example: string; tips: string[] } | null>(null);

  const customizeMutation = useMutation({
    mutationFn: async (data: { templateName: string; templatePattern: string; userSituation: string }) => {
      const response = await apiRequest("POST", "/api/heuristics/customize", data);
      return response.json();
    },
    onSuccess: (data) => {
      setCustomization(data);
    },
  });

  const handleCustomize = () => {
    if (!selectedTemplate || !situation.trim()) return;
    customizeMutation.mutate({
      templateName: selectedTemplate.name,
      templatePattern: selectedTemplate.template,
      userSituation: situation,
    });
  };

  const filteredTemplates =
    activeCategory === "all"
      ? heuristicTemplates
      : heuristicTemplates.filter((t) => t.category === activeCategory);

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

  return (
    <div className="h-full overflow-auto">
      <div className="p-6">
        <div className="flex flex-col gap-2 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-chart-1 flex items-center justify-center">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-heuristics-title">Heuristic Language Templates</h1>
              <p className="text-muted-foreground">
                Proven language patterns for pharma sales conversations
              </p>
            </div>
          </div>
        </div>

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

        <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-6">
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
            const IconComponent = categoryIcons[template.category] || MessageSquare;
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
                          {categoryLabels[template.category]}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setSituation("");
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
                          <Check className="h-4 w-4 text-chart-4" />
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
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
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
              disabled={!situation.trim() || customizeMutation.isPending}
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
                          <Check className="h-4 w-4 mr-1 text-chart-4" />
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
                          <Check className="h-4 w-4 text-chart-4 flex-shrink-0 mt-0.5" />
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
