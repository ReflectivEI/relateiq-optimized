import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchRelateIQState } from "@/lib/relateiq-api";

export default function TriggersPage() {
  const { data } = useQuery({
    queryKey: ["/api/state"],
    queryFn: fetchRelateIQState,
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-serif text-3xl">Trigger Library</h1>
        <p className="text-muted-foreground">
          A starter library based on the reverse-engineered app concepts. Real questionnaire imports can tighten these patterns further.
        </p>
      </div>
      <div className="space-y-4">
        {data?.triggers.map((trigger) => (
          <Card key={trigger.id}>
            <CardHeader>
              <CardTitle>{trigger.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>{trigger.description}</p>
              <p className="text-muted-foreground"><strong className="text-foreground">Reaction:</strong> {trigger.commonReaction}</p>
              <p className="text-muted-foreground"><strong className="text-foreground">Helps:</strong> {trigger.whatHelps}</p>
              <p className="text-muted-foreground"><strong className="text-foreground">Worsens:</strong> {trigger.whatWorsens}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
