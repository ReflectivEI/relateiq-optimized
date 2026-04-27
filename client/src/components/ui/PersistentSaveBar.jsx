import React from "react";
import { AlertTriangle, CheckCircle2, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_COPY = {
  idle: "Ready to save",
  dirty: "Unsaved changes",
  saving: "Saving...",
  saved: "Saved",
  error: "Save failed",
};

export default function PersistentSaveBar({
  status = "idle",
  onSave,
  disabled = false,
  className,
  saveLabel = "Save Now",
  statusLabels = null,
}) {
  const label = (statusLabels && statusLabels[status]) || STATUS_COPY[status] || STATUS_COPY.idle;

  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/15 px-4 py-3", className)}>
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        {status === "saving" ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : null}
        {status === "saved" ? <CheckCircle2 className="h-4 w-4 text-primary" /> : null}
        {status === "error" ? <AlertTriangle className="h-4 w-4 text-destructive" /> : null}
        {status === "dirty" || status === "idle" ? <Save className="h-4 w-4 text-muted-foreground" /> : null}
        <span>{label}</span>
      </div>
      <Button type="button" size="sm" variant="outline" onClick={onSave} disabled={disabled || status === "saving"}>
        {status === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saveLabel}
      </Button>
    </div>
  );
}