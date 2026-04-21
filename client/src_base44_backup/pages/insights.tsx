import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchQuestionnaire } from "@/lib/relateiq-api";
import { buildContextInsights } from "@/lib/relateiq-analysis";

export default function InsightsPage() {
  const { data: tony } = useQuery({
    queryKey: ["/api/questionnaire/Tony"],
    queryFn: () => fetchQuestionnaire("Tony"),
  });
  const { data: drew } = useQuery({
    queryKey: ["/api/questionnaire/Drew"],
    queryFn: () => fetchQuestionnaire("Drew"),
  });

  const insights = useMemo(() => {
    if (!tony?.responses?.length || !drew?.responses?.length) return [];
    return buildContextInsights(tony.responses, drew.responses);
  }, [tony, drew]);

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div>
        <h1 className="font-serif text-4xl text-foreground">Insights</h1>
        <p className="mt-2 text-muted-foreground">
          Context insights generated from the uploaded Tony and Drew questionnaire responses.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button className="bg-[hsl(145_33%_48%)] hover:bg-[hsl(145_33%_43%)]">Generate Content Insights</Button>
        <Button variant="outline">Download</Button>
        <Button variant="outline">Copy</Button>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {insights.map((insight) => (
          <Card key={insight.id} className="rounded-3xl">
            <CardHeader>
              <CardTitle>{insight.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-[15px] leading-7 text-muted-foreground">
              {insight.body}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
