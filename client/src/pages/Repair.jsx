import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProactiveRepair from "@/pages/ProactiveRepair";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Repair() {
  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 md:px-8 py-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2 font-display">Repair</h1>
          <p className="text-muted-foreground text-lg">
            Address tension early with targeted guidance and communication scripts.
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="repair" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 mb-8 bg-card/50">
            <TabsTrigger value="repair" className="rounded-lg">Proactive Repair</TabsTrigger>
            <TabsTrigger value="message" className="rounded-lg">Message Builder</TabsTrigger>
          </TabsList>

          {/* Proactive Repair Tab */}
          <TabsContent value="repair" className="space-y-6">
            <ProactiveRepair />
          </TabsContent>

          {/* Message Builder Tab */}
          <TabsContent value="message">
            <Card className="border border-border/50 bg-card/50">
              <CardHeader>
                <CardTitle className="text-2xl">Message Builder</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    Message Builder combines Proactive Repair guidance with tone options and preview before sending.
                  </p>
                </div>
                <p className="text-sm text-muted-foreground italic">
                  Full Message Builder UI coming soon. Use Proactive Repair for current guidance and scripts.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
