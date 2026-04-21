import React from "react";
import { ExternalLink, BookOpenCheck } from "lucide-react";
import { REFERENCE_CATALOG } from "@/lib/referenceCatalog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ReferenceAppendix() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="enterprise-section-label">Research Appendix</p>
        <h1 className="font-display text-3xl font-bold tracking-tight">Frameworks & References</h1>
        <p className="max-w-3xl text-muted-foreground">
          A shared appendix for the frameworks, psychology references, and evidence-based models used across ReflectIQ.
          When a framework is referenced anywhere in the app, it should resolve back here or to its source material.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {REFERENCE_CATALOG.map((reference) => (
          <Card
            key={reference.id}
            id={reference.id}
            className="scroll-mt-24 rounded-3xl border border-border/70 bg-card/90 shadow-sm"
          >
            <CardContent className="space-y-4 p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-primary/5">
                  <BookOpenCheck className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                    {reference.category}
                  </p>
                  <h2 className="font-display text-2xl font-semibold text-foreground">{reference.title}</h2>
                  <p className="text-sm leading-6 text-muted-foreground">{reference.description}</p>
                </div>
              </div>
              <a href={reference.url} target="_blank" rel="noreferrer">
                <Button variant="outline" className="gap-2 rounded-full border-primary/30 text-primary hover:bg-primary/5">
                  Open Source Reference
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
