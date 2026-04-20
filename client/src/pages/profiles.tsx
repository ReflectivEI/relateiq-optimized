import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchRelateIQState } from "@/lib/relateiq-api";

export default function ProfilesPage() {
  const { data } = useQuery({
    queryKey: ["/api/state"],
    queryFn: fetchRelateIQState,
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-serif text-3xl">Profiles</h1>
        <p className="text-muted-foreground">
          Relationship summaries for Tony and Drew. These are ready to be enriched once the real questionnaire exports are added.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {data?.profiles.map((profile) => (
          <Card key={profile.person}>
            <CardHeader>
              <CardTitle>{profile.person}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <p>{profile.summary}</p>
              <div>
                <p className="font-medium">Communication style</p>
                <p className="text-muted-foreground">{profile.communicationStyle}</p>
              </div>
              <div>
                <p className="font-medium">Needs under stress</p>
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                  {profile.likelyNeedsUnderStress.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="font-medium">Repair preferences</p>
                <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                  {profile.repairPreferences.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
