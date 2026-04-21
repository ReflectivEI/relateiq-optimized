/**
 * EmptyState — consistent empty/error state for all pages.
 * Always shows an explanation + actionable next step. Never blank.
 */
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function EmptyState({ icon: Icon, title, description, actionLabel, onAction, secondaryLabel, onSecondary, className }) {
  return (
    <Card className={cn("border-dashed border-border/60", className)}>
      <CardContent className="p-8 text-center space-y-4">
        {Icon && (
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto">
            <Icon className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        <div className="space-y-1.5">
          <h3 className="font-medium text-foreground">{title}</h3>
          {description && <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">{description}</p>}
        </div>
        {(actionLabel || secondaryLabel) && (
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {actionLabel && onAction && (
              <Button size="sm" onClick={onAction} className="gap-2">{actionLabel}</Button>
            )}
            {secondaryLabel && onSecondary && (
              <Button size="sm" variant="outline" onClick={onSecondary}>{secondaryLabel}</Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}