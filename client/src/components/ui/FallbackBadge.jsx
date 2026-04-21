/**
 * FallbackBadge — shown when AI output is a fallback, not a full result.
 * Surfaces trust-critical information to the user.
 */
import React from "react";
import { AlertCircle } from "lucide-react";

export default function FallbackBadge() {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 text-xs w-fit">
      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
      Partial insight based on available data — regenerate for full analysis
    </div>
  );
}