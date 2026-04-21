import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { postRepair } from "@/lib/relateiq-api";

export default function RepairPage() {
  const [speaker, setSpeaker] = useState<"Tony" | "Drew">("Tony");
  const [issue, setIssue] = useState("");
  const [desiredOutcome, setDesiredOutcome] = useState("");

  const mutation = useMutation({
    mutationFn: postRepair,
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-serif text-3xl">Repair Planner</h1>
        <p className="text-muted-foreground">
          Built to support the app’s repair workflow with direct Cloudflare-backed data handling.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Plan the repair move</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant={speaker === "Tony" ? "default" : "outline"} onClick={() => setSpeaker("Tony")}>
              Tony
            </Button>
            <Button variant={speaker === "Drew" ? "default" : "outline"} onClick={() => setSpeaker("Drew")}>
              Drew
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="issue">What happened?</Label>
            <Textarea id="issue" value={issue} onChange={(event) => setIssue(event.target.value)} placeholder="Describe the conflict, misunderstanding, or distance." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="outcome">Desired outcome</Label>
            <Input id="outcome" value={desiredOutcome} onChange={(event) => setDesiredOutcome(event.target.value)} placeholder="e.g. reconnection, better clarity, a reset" />
          </div>
          <Button
            onClick={() => mutation.mutate({ speaker, issue, desiredOutcome })}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Planning..." : "Generate Repair Guidance"}
          </Button>
        </CardContent>
      </Card>

      {mutation.data ? (
        <Card>
          <CardHeader>
            <CardTitle>Repair Guidance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>{mutation.data.summary}</p>
            <div>
              <p className="font-medium">Scripts</p>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                {mutation.data.scripts.map((item: string) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="font-medium">Avoid</p>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                {mutation.data.avoid.map((item: string) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
