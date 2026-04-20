import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { postCoach } from "@/lib/relateiq-api";

export default function CoachPage() {
  const [speaker, setSpeaker] = useState<"Tony" | "Drew">("Tony");
  const [topic, setTopic] = useState("");
  const [goal, setGoal] = useState("");

  const mutation = useMutation({
    mutationFn: postCoach,
  });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-serif text-3xl">Conversation Coach</h1>
        <p className="text-muted-foreground">
          A Cloudflare-backed drafting tool tuned for relationship pacing, tone, and repair readiness.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Draft a better opening</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Speaker</Label>
            <div className="flex gap-2">
              <Button variant={speaker === "Tony" ? "default" : "outline"} onClick={() => setSpeaker("Tony")}>
                Tony
              </Button>
              <Button variant={speaker === "Drew" ? "default" : "outline"} onClick={() => setSpeaker("Drew")}>
                Drew
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="topic">Topic</Label>
            <Input id="topic" value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="What are you trying to talk about?" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="goal">Goal</Label>
            <Textarea id="goal" value={goal} onChange={(event) => setGoal(event.target.value)} placeholder="What would a good outcome look like?" />
          </div>
          <Button
            onClick={() => mutation.mutate({ speaker, topic, goal })}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Generating..." : "Generate Guidance"}
          </Button>
        </CardContent>
      </Card>

      {mutation.data ? (
        <Card>
          <CardHeader>
            <CardTitle>Guidance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>{mutation.data.response}</p>
            <div>
              <p className="font-medium">Suggested openers</p>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                {mutation.data.suggestedOpeners.map((item: string) => (
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
