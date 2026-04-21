/**
 * InsightCard.jsx — Individual insight card with "Give me an example" button
 * Dark theme, large readable text, lucide icons, no badges
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function InsightCard({ insight }) {
  const [showExample, setShowExample] = useState(false);

  const Icon = insight.icon;

  return (
    <Card className={cn("border-2", insight.color, "rounded-lg")}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-3 text-xl">
          <Icon className="w-6 h-6 flex-shrink-0" />
          <span>{insight.title}</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Main insight text */}
        <p className="text-base text-foreground leading-relaxed font-medium">
          {insight.content}
        </p>

        {/* Give me an example button */}
        <Button
          onClick={() => setShowExample(!showExample)}
          className="w-full border-2 border-teal-600 bg-teal-50 hover:bg-teal-100 text-teal-700 text-base font-semibold py-2 rounded-lg"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {showExample ? "Hide Example" : "Give me an example"}
        </Button>

        {/* Example dropdown */}
        {showExample && insight.examples && (
          <div className="mt-3 p-3 bg-foreground/5 border-l-4 border-teal-600 rounded space-y-2">
            {insight.examples.map((example, i) => (
              <div key={i} className="text-sm text-foreground/80">
                <span className="font-semibold">•</span> {example}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}