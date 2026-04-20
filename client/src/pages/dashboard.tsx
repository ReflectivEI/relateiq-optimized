import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { fetchRelateIQState } from "@/lib/relateiq-api";

export default function DashboardPage() {
  const { data } = useQuery({
    queryKey: ["/api/state"],
    queryFn: fetchRelateIQState,
  });

  if (!data) {
    return <div className="p-6 text-sm text-muted-foreground">Loading RelateIQ workspace...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <section className="rounded-3xl border border-border/70 bg-[linear-gradient(135deg,rgba(95,133,114,0.16),rgba(255,255,255,0.92))] p-8">
        <Badge variant="secondary">Migration Complete</Badge>
        <h1 className="mt-4 font-serif text-4xl text-foreground">RelateIQ on GitHub + Cloudflare</h1>
        <p className="mt-3 max-w-3xl text-muted-foreground">
          This rebuild mirrors the live Base44 product structure, but the runtime is now portable:
          GitHub-backed source control, static frontend delivery, and a standalone Cloudflare worker API.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Profiles</CardTitle>
            <CardDescription>{data.profiles.length} active partner profiles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.profiles.map((profile) => (
              <div key={profile.person} className="rounded-xl border border-border/60 p-3">
                <p className="font-medium">{profile.person}</p>
                <p className="text-muted-foreground">{profile.communicationStyle}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Questionnaires</CardTitle>
            <CardDescription>Ready for two 94-question JSON imports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.questionnaires.map((questionnaire) => (
              <div key={questionnaire.person} className="rounded-xl border border-border/60 p-3">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{questionnaire.person}</p>
                  <Badge variant={questionnaire.importReady ? "secondary" : "outline"}>
                    {questionnaire.importedQuestions}/{questionnaire.totalQuestions}
                  </Badge>
                </div>
                <p className="mt-1 text-muted-foreground">{questionnaire.sourceFile}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tools</CardTitle>
            <CardDescription>Core relationship workflows</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {data.tools.map((tool) => (
              <Link key={tool.id} href={tool.route}>
                <div className="rounded-xl border border-border/60 p-3 transition hover:border-primary/40 hover:bg-primary/5">
                  <p className="font-medium">{tool.name}</p>
                  <p className="text-muted-foreground">{tool.purpose}</p>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Current Shared Insights</CardTitle>
          <CardDescription>Seeded from the reverse-engineered feature map and migration goals</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {data.insights.map((insight) => (
            <div key={insight.id} className="rounded-2xl border border-border/60 bg-card p-4">
              <Badge variant="outline">{insight.theme}</Badge>
              <p className="mt-3 font-medium">{insight.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{insight.body}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button asChild>
          <Link href="/questionnaire">Review Import Paths</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/repair">Open Repair Planner</Link>
        </Button>
      </div>
    </div>
  );
}
