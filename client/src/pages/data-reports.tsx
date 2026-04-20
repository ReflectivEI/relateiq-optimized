import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Database, Send, Clock, AlertTriangle, ShieldCheck } from "lucide-react";
import type { SQLQuery } from "@shared/schema";

const exampleQuestions = [
  "Show me the top 10 prescribers by total prescriptions",
  "What is the market share by product in the last quarter?",
  "List all HCPs who increased Rx volume month over month",
  "Compare territory performance for Q3 vs Q4",
];

export default function DataReportsPage() {
  const [question, setQuestion] = useState("");
  const { toast } = useToast();

  const { data: queryHistory, isLoading: historyLoading } = useQuery<SQLQuery[]>({
    queryKey: ["/api/sql/history"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/sql/history");
      const data = await response.json();
      return (data?.queries as SQLQuery[] | undefined) ?? [];
    },
  });

  const translateMutation = useMutation({
    mutationFn: async (naturalLanguageQuery: string) => {
      const response = await apiRequest("POST", "/api/sql/translate", { question: naturalLanguageQuery });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sql/history"] });
      setQuestion("");
    },
    onError: (error: Error) => {
      toast({
        title: "Translation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      translateMutation.mutate(question.trim());
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Database className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold" data-testid="text-data-reports-title">Data and Reports</h1>
            <Badge variant="secondary" className="ml-2">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Manager Access
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Translate natural language questions into SQL queries for sales data analysis
          </p>
        </div>

        {/* Manager Level Callout */}
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Data and Reports supports performance trends, coaching insights, and reporting for managers and leadership.
                This feature is not intended for daily sales representative workflows.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ask a Question</CardTitle>
                <CardDescription>
                  Enter a natural language question about your sales data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Textarea
                    placeholder="e.g., Show me the top 10 prescribers by total prescriptions in the last quarter"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    rows={3}
                    data-testid="input-sql-question"
                  />
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                      {exampleQuestions.slice(0, 2).map((q, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          type="button"
                          onClick={() => setQuestion(q)}
                          data-testid={`button-example-${i}`}
                        >
                          {q.slice(0, 30)}...
                        </Button>
                      ))}
                    </div>
                    <Button
                      type="submit"
                      disabled={!question.trim() || translateMutation.isPending}
                      data-testid="button-translate"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {translateMutation.isPending ? "Translating..." : "Translate"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {translateMutation.data && (
              <Card>
                <CardHeader>
                  <CardTitle>Generated SQL</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted p-4 rounded-md font-mono text-sm overflow-x-auto">
                    <pre>{translateMutation.data.sqlQuery}</pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Query History
              </CardTitle>
              <CardDescription>Recent translations</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {historyLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : queryHistory && queryHistory.length > 0 ? (
                  <div className="space-y-3">
                    {queryHistory.map((query) => (
                      <div
                        key={query.id}
                        className="p-3 rounded-md border hover-elevate cursor-pointer"
                        onClick={() => setQuestion(query.naturalLanguage)}
                        data-testid={`query-history-${query.id}`}
                      >
                        <p className="text-sm font-medium line-clamp-2">{query.naturalLanguage}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(query.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No queries yet. Ask a question to get started.
                  </p>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
