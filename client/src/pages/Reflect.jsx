import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Coach from "@/pages/Coach";
import { useRelationshipAuth } from "@/context/RelationshipAuthContext";

export default function Reflect() {
  const { activeRelationship } = useRelationshipAuth();
  const [mode, setMode] = useState("coach"); // "coach" or "whatHappened"

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 font-display">Reflect</h1>
          <p className="text-muted-foreground text-lg">
            Get guidance, process what's happening, or explore deeper insights about your connection.
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-2 mb-8 flex-wrap">
          <Button
            variant={mode === "coach" ? "default" : "outline"}
            onClick={() => setMode("coach")}
            className="gap-2 rounded-lg font-medium"
          >
            AI Coach
          </Button>
          <Button
            variant={mode === "whatHappened" ? "default" : "outline"}
            onClick={() => setMode("whatHappened")}
            className="gap-2 rounded-lg font-medium"
          >
            What Happened
          </Button>
          <Button
            variant="outline"
            onClick={() => {}}
            disabled
            className="gap-2 rounded-lg font-medium opacity-50"
          >
            Reflection Mirror
          </Button>
          <Button
            variant="outline"
            onClick={() => {}}
            disabled
            className="gap-2 rounded-lg font-medium opacity-50"
          >
            Check-In
          </Button>
          <Button
            variant="outline"
            onClick={() => {}}
            disabled
            className="gap-2 rounded-lg font-medium opacity-50"
          >
            Journal
          </Button>
          <Button
            variant="outline"
            onClick={() => {}}
            disabled
            className="gap-2 rounded-lg font-medium opacity-50"
          >
            Daily Connections
          </Button>
        </div>

        {/* Mode Content */}
        <div className="space-y-6">
          {mode === "coach" && (
            <div>
              <Coach />
            </div>
          )}

          {mode === "whatHappened" && (
            <Card className="border border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-2xl">What Happened</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    This guided reflection helps you process a specific moment or pattern:
                  </p>
                  <ol className="mt-3 space-y-2 text-sm text-muted-foreground list-decimal list-inside">
                    <li>Describe the situation</li>
                    <li>Explore what you're feeling</li>
                    <li>Consider what they might be experiencing</li>
                    <li>Get system insight and analysis</li>
                    <li>Receive recommended approach</li>
                  </ol>
                </div>
                <p className="text-sm text-muted-foreground italic">
                  "What Happened" analysis feature coming soon. Use AI Coach for immediate guidance.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
