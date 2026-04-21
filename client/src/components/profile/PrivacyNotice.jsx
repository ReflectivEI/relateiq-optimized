/**
 * PrivacyNotice — inline privacy reminder shown throughout the app.
 * Communicates that responses are private by default.
 */
import React, { useState } from "react";
import { Shield, X } from "lucide-react";

export default function PrivacyNotice({ className = "" }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl bg-muted/50 border border-border/40 ${className}`}>
      <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <p className="text-sm text-muted-foreground flex-1 leading-relaxed">
        <span className="font-medium text-foreground">Your responses are private.</span>{" "}
        You decide what to share and when. Nothing is visible to your partner unless you choose to share it.
      </p>
      <button onClick={() => setDismissed(true)} className="text-muted-foreground/50 hover:text-muted-foreground transition-colors">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}