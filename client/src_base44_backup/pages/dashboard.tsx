import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { fetchQuestionnaire } from "@/lib/relateiq-api";
import { buildContextInsights } from "@/lib/relateiq-analysis";

export default function DashboardPage() {
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
      <div className="max-w-4xl">
        <h1 className="font-serif text-4xl text-foreground">Relationship Intelligence, Available Now</h1>
        <p className="mt-3 text-muted-foreground">
          RelateIQ can generate meaningful insights any time from AI Coach conversations, Smart Tool sessions,
          Weekly Check-Ins, and the questionnaire answers already provided.
        </p>
      </div>

      <Card className="border-[hsl(145_20%_87%)] bg-card/90">
        <CardContent className="space-y-6 p-6">
          <Button className="h-11 w-full bg-[hsl(145_33%_48%)] hover:bg-[hsl(145_33%_43%)]">
            Generate Context Insights
          </Button>

          <div className="grid gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-border/60 p-5">
              <p className="font-medium">Context Insights</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Generates from all available data: AI Coach sessions, Smart Tools entries, Weekly Check-ins,
                questionnaire answers, and stored profile information.
              </p>
              <div className="mt-4 space-y-2">
                {["AI Coach sessions", "Smart Tools entries", "Weekly Check-Ins", "Questionnaire answers"].map((label) => (
                  <div key={label} className="rounded-full border border-border/60 px-4 py-2 text-sm text-muted-foreground">
                    {label}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 p-5">
              <p className="font-medium">Full Deep Insights</p>
              <p className="mt-2 text-sm text-muted-foreground">
                A deeper layer that compares both profiles, highlights tension patterns, and suggests better timing
                and repair approaches.
              </p>
              <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <span className="rounded-full border border-[hsl(145_20%_85%)] bg-[hsl(145_30%_95%)] px-3 py-1 text-[hsl(145_25%_35%)]">
                  {tony?.responses?.length === 94 && drew?.responses?.length === 94 ? "Unlocked with profiles" : "Waiting for profiles"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {insights.map((insight) => (
          <Card key={insight.id}>
            <CardHeader>
              <CardTitle>{insight.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{insight.body}</CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/profiles">Go To Profiles</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/questionnaire">Open Questionnaire</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/insights">Open Insights</Link>
        </Button>
      </div>
    </div>
  );
}
