/**
 * PrivacyBanner — persistent privacy notice shown on data-generating pages.
 * Reinforces that data is private by default.
 */
import React, { useState } from "react";
import { Shield, X } from "lucide-react";

export default function PrivacyBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-primary/5 border border-primary/15">
      <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <p className="text-xs text-muted-foreground flex-1">
        <span className="font-medium text-foreground">Your responses are private.</span>{" "}
        Nothing is shared with your partner unless you choose to share it. Each person's profile, insights, and coach sessions are visible only to them.
      </p>
      <button onClick={() => setDismissed(true)} className="text-muted-foreground hover:text-foreground shrink-0">
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}