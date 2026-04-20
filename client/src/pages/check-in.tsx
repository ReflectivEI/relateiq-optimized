import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { postCheckIn } from "@/lib/relateiq-api";

export default function CheckInPage() {
  const [speaker, setSpeaker] = useState<"Tony" | "Drew">("Tony");
  const [mood, setMood] = useState("");
  const [notes, setNotes] = useState("");
  const mutation = useMutation({ mutationFn: postCheckIn });

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="font-serif text-3xl">Check-In</h1>
        <p className="text-muted-foreground">
          A quick state capture for emotional temperature, bandwidth, and the next best relational move.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Current state</CardTitle>
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
            <Label htmlFor="mood">Mood / energy</Label>
            <Input id="mood" value={mood} onChange={(event) => setMood(event.target.value)} placeholder="e.g. overloaded, hopeful, raw, disconnected" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="What happened or what feels unfinished?" />
          </div>
          <Button onClick={() => mutation.mutate({ speaker, mood, notes })} disabled={mutation.isPending}>
            {mutation.isPending ? "Checking in..." : "Generate Check-In Guidance"}
          </Button>
        </CardContent>
      </Card>
      {mutation.data ? (
        <Card>
          <CardHeader>
            <CardTitle>Check-In Guidance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>{mutation.data.summary}</p>
            <p className="text-muted-foreground">{mutation.data.nextStep}</p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
