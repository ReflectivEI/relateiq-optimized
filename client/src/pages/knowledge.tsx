import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Library,
  Search,
  ChevronRight,
  FileText,
  Shield,
  Beaker,
  Users,
  DollarSign,
  Scale,
  BookOpen,
  Sparkles,
  Send,
  MessageSquare,
} from "lucide-react";
import { knowledgeArticles } from "@/lib/data";
import type { KnowledgeArticle } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

const categoryIcons: Record<string, any> = {
  fda: Scale,
  "clinical-trials": Beaker,
  compliance: Shield,
  "hcp-engagement": Users,
  "market-access": DollarSign,
  pricing: DollarSign,
};

const categoryLabels: Record<string, string> = {
  fda: "FDA & Regulatory",
  "clinical-trials": "Clinical Trials",
  compliance: "Compliance",
  "hcp-engagement": "HCP Engagement",
  "market-access": "Market Access",
  pricing: "Pricing",
};

export default function KnowledgePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [aiQuestion, setAiQuestion] = useState("");
  const [aiAnswer, setAiAnswer] = useState<{ answer: string; relatedTopics: string[] } | null>(null);

  const askAiMutation = useMutation({
    mutationFn: async (data: { question: string; articleContext?: string }) => {
      const response = await apiRequest("POST", "/api/knowledge/ask", data);
      return response.json();
    },
    onSuccess: (data) => {
      setAiAnswer(data);
    },
  });

  const handleAskAi = () => {
    if (!aiQuestion.trim()) return;
    const articleContext = selectedArticle ? selectedArticle.id : undefined;
    askAiMutation.mutate({ question: aiQuestion, articleContext });
  };

  const filteredArticles = knowledgeArticles.filter((article) => {
    const matchesCategory = activeCategory === "all" || article.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (selectedArticle) {
    const IconComponent = categoryIcons[selectedArticle.category] || FileText;

    return (
      <div className="h-full overflow-auto">
        <div className="p-6">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => {
              setSelectedArticle(null);
              setAiAnswer(null);
              setAiQuestion("");
            }}
            data-testid="button-back-knowledge"
          >
            <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
            Back to Knowledge Base
          </Button>

          <div className="max-w-4xl mx-auto">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="flex items-center gap-1">
                  <IconComponent className="h-3 w-3" />
                  {categoryLabels[selectedArticle.category]}
                </Badge>
              </div>
              <h1 className="text-3xl font-bold mb-3" data-testid="text-article-title">
                {selectedArticle.title}
              </h1>
              <p className="text-lg text-muted-foreground">{selectedArticle.summary}</p>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {selectedArticle.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardContent className="p-6 prose prose-sm dark:prose-invert max-w-none">
                    {selectedArticle.content.split("\n\n").map((paragraph, index) => {
                      if (paragraph.startsWith("## ")) {
                        return (
                          <h2 key={index} className="text-xl font-semibold mt-6 mb-3">
                            {paragraph.replace("## ", "")}
                          </h2>
                        );
                      }
                      if (paragraph.startsWith("### ")) {
                        return (
                          <h3 key={index} className="text-lg font-medium mt-4 mb-2">
                            {paragraph.replace("### ", "")}
                          </h3>
                        );
                      }
                      if (paragraph.startsWith("- ")) {
                        const items = paragraph.split("\n").filter((line) => line.startsWith("- "));
                        return (
                          <ul key={index} className="list-disc pl-5 space-y-1">
                            {items.map((item, i) => (
                              <li key={i} className="text-muted-foreground">
                                {item.replace("- ", "")}
                              </li>
                            ))}
                          </ul>
                        );
                      }
                      return (
                        <p key={index} className="text-muted-foreground mb-4">
                          {paragraph}
                        </p>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-1">
                <Card className="sticky top-6">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Ask AI About This Topic
                    </CardTitle>
                    <CardDescription>
                      Get AI-powered answers related to this article
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Textarea
                        value={aiQuestion}
                        onChange={(e) => setAiQuestion(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleAskAi();
                          }
                        }}
                        placeholder="Ask a question about this topic..."
                        className="min-h-[80px] resize-none text-sm"
                        data-testid="input-ai-question"
                      />
                    </div>
                    <Button
                      onClick={handleAskAi}
                      disabled={!aiQuestion.trim() || askAiMutation.isPending}
                      className="w-full"
                      data-testid="button-ask-ai"
                    >
                      {askAiMutation.isPending ? (
                        <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      {askAiMutation.isPending ? "Thinking..." : "Ask AI"}
                    </Button>

                    {aiAnswer && (
                      <div className="space-y-3 pt-3 border-t">
                        <div className="flex items-start gap-2">
                          <MessageSquare className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                          <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                            {aiAnswer.answer}
                          </div>
                        </div>
                        {aiAnswer.relatedTopics && aiAnswer.relatedTopics.length > 0 && (
                          <div>
                            <p className="text-xs font-medium mb-2">Related Topics:</p>
                            <div className="flex flex-wrap gap-1">
                              {aiAnswer.relatedTopics.map((topic, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-6">
        <div className="flex flex-col gap-2 mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-md bg-chart-4 flex items-center justify-center">
              <Library className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold" data-testid="text-knowledge-title">Knowledge Base</h1>
              <p className="text-muted-foreground">
                Industry guides covering FDA regulations, clinical trials, and compliance
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-sm mb-2">AI-Powered Q&A</p>
                  <div className="flex gap-2">
                    <Input
                      value={aiQuestion}
                      onChange={(e) => setAiQuestion(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAskAi();
                        }
                      }}
                      placeholder="Ask any question about pharma regulations, clinical trials, compliance..."
                      className="bg-background"
                      data-testid="input-global-ai-question"
                    />
                    <Button
                      onClick={handleAskAi}
                      disabled={!aiQuestion.trim() || askAiMutation.isPending}
                      data-testid="button-global-ask-ai"
                    >
                      {askAiMutation.isPending ? (
                        <Sparkles className="h-4 w-4 animate-pulse" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {aiAnswer && (
                    <div className="mt-4 p-3 bg-background rounded-lg border">
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap mb-2">
                        {aiAnswer.answer}
                      </div>
                      {aiAnswer.relatedTopics && aiAnswer.relatedTopics.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {aiAnswer.relatedTopics.map((topic, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search articles, topics, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
              data-testid="input-search-knowledge"
            />
          </div>

          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-6">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="all" data-testid="tab-all-articles">All</TabsTrigger>
              <TabsTrigger value="fda" data-testid="tab-fda">
                <Scale className="h-3 w-3 mr-1" />
                FDA
              </TabsTrigger>
              <TabsTrigger value="clinical-trials" data-testid="tab-clinical-trials">
                <Beaker className="h-3 w-3 mr-1" />
                Clinical Trials
              </TabsTrigger>
              <TabsTrigger value="compliance" data-testid="tab-compliance">
                <Shield className="h-3 w-3 mr-1" />
                Compliance
              </TabsTrigger>
              <TabsTrigger value="hcp-engagement" data-testid="tab-hcp-engagement">
                <Users className="h-3 w-3 mr-1" />
                HCP
              </TabsTrigger>
              <TabsTrigger value="market-access" data-testid="tab-market-access">
                <DollarSign className="h-3 w-3 mr-1" />
                Market Access
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {filteredArticles.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-1">No articles found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or category filter
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredArticles.map((article) => {
                const IconComponent = categoryIcons[article.category] || FileText;
                return (
                  <Card
                    key={article.id}
                    className="hover-elevate cursor-pointer"
                    onClick={() => setSelectedArticle(article)}
                    data-testid={`card-article-${article.id}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                          <IconComponent className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Badge variant="outline" className="mb-2">
                            {categoryLabels[article.category]}
                          </Badge>
                          <h3 className="font-semibold line-clamp-2">{article.title}</h3>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {article.summary}
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {article.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {article.tags.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{article.tags.length - 3}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
