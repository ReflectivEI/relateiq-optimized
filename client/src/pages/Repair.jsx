import React from "react";
import ProactiveRepair from "@/pages/ProactiveRepair";
import RelationshipChat from "@/pages/RelationshipChat";
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
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Build and refine repair language using full relationship context, then move finalized messages into Inbox.
              </p>
              <RelationshipChat />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
