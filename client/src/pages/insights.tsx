import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchRelateIQState } from "@/lib/relateiq-api";

export default function InsightsPage() {
  const { data } = useQuery({
    queryKey: ["/api/state"],
    queryFn: fetchRelateIQState,
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-serif text-3xl">Insights</h1>
        <p className="text-muted-foreground">
          Seed insights from the reverse-engineered product structure and the new relationship-support architecture.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data?.insights.map((insight) => (
          <Card key={insight.id}>
            <CardHeader>
              <CardTitle>{insight.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {insight.body}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
