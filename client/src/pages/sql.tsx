import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Database,
  Send,
  Copy,
  Check,
  History,
  Sparkles,
  Code,
  ChevronRight,
  Lightbulb,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { sampleSqlQueries } from "@/lib/data";
import type { SQLQuery } from "@shared/schema";

export default function SqlPage() {
  const [input, setInput] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: queryHistory = [], isLoading } = useQuery<SQLQuery[]>({
    queryKey: ["/api/sql/history"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/sql/history");
      const data = await response.json();
      return (data?.queries as SQLQuery[] | undefined) ?? [];
    },
  });

  const translateMutation = useMutation({
    mutationFn: async (naturalLanguage: string) => {
      const response = await apiRequest("POST", "/api/sql/translate", { question: naturalLanguage });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sql/history"] });
    },
  });

  const handleTranslate = () => {
    if (!input.trim() || translateMutation.isPending) return;
    translateMutation.mutate(input);
    setInput("");
  };

  const handleCopy = async (sql: string, id: string) => {
    await navigator.clipboard.writeText(sql);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleExampleClick = (example: { natural: string }) => {
    setInput(example.natural);
  };

  const latestQuery = translateMutation.data as SQLQuery | undefined;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="p-6 border-b flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-md bg-chart-3 flex items-center justify-center">
            <Database className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold" data-testid="text-sql-title">SQL Query Translator</h1>
            <p className="text-sm text-muted-foreground">
              Convert natural language questions into SQL queries for sales data analysis
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-6 p-6 overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleTranslate();
                    }
                  }}
                  placeholder="Ask a question in plain English, e.g., 'Show me top 10 prescribers by territory'"
                  className="min-h-[80px] resize-none"
                  data-testid="input-sql-question"
                />
                <Button
                  onClick={handleTranslate}
                  disabled={!input.trim() || translateMutation.isPending}
                  className="self-end"
                  data-testid="button-translate-sql"
                >
                  {translateMutation.isPending ? (
                    <Sparkles className="h-4 w-4 animate-pulse" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {translateMutation.isPending && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          )}

          {latestQuery && (
            <Card className="mb-6 border-primary">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Code className="h-4 w-4 text-primary" />
                    Generated SQL Query
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(latestQuery.sqlQuery, latestQuery.id)}
                    data-testid="button-copy-sql"
                  >
                    {copied === latestQuery.id ? (
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
                <CardDescription>{latestQuery.naturalLanguage}</CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto">
                  <code className="text-sm font-mono" data-testid="text-generated-sql">
                    {latestQuery.sqlQuery}
                  </code>
                </pre>
                {latestQuery.explanation && (
                  <div className="mt-4 p-3 bg-primary/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <Lightbulb className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Explanation</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{latestQuery.explanation}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="flex-1 overflow-hidden flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <History className="h-4 w-4" />
                Query History
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-hidden">
              <ScrollArea className="h-full">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-3 border rounded-lg">
                        <Skeleton className="h-4 w-3/4 mb-2" />
                        <Skeleton className="h-16 w-full" />
                      </div>
                    ))}
                  </div>
                ) : queryHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Database className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No queries yet. Try asking a question!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {queryHistory.map((query) => (
                      <div key={query.id} className="p-3 border rounded-lg hover-elevate">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-medium">{query.naturalLanguage}</p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 flex-shrink-0"
                            onClick={() => handleCopy(query.sqlQuery, query.id)}
                          >
                            {copied === query.id ? (
                              <Check className="h-3 w-3 text-chart-4" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                        <pre className="bg-muted p-2 rounded text-xs font-mono overflow-x-auto">
                          {query.sqlQuery}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        <Card className="w-80 flex-shrink-0 hidden lg:flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Example Questions
            </CardTitle>
            <CardDescription>Click to try these examples</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="space-y-2">
                {sampleSqlQueries.map((example, index) => (
                  <button
                    key={index}
                    onClick={() => handleExampleClick(example)}
                    className="w-full text-left p-3 rounded-lg border hover-elevate"
                    data-testid={`button-example-${index}`}
                  >
                    <p className="text-sm mb-2">{example.natural}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <ChevronRight className="h-3 w-3" />
                      Click to try
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
