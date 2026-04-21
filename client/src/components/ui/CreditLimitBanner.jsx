/**
 * CreditLimitBanner — shown when the monthly AI integration credits are exhausted.
 */
import React from "react";
import { AlertCircle } from "lucide-react";

export default function CreditLimitBanner() {
  return (
    <div className="flex items-start gap-3 px-4 py-4 rounded-xl bg-orange-500/10 border border-orange-400/30">
      <AlertCircle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-orange-300">AI provider limit reached</p>
        <p className="text-sm text-orange-200/80 leading-relaxed">
          The AI provider is currently rate-limited or out of credits for this request. The deterministic layers still work, and you can retry once capacity resets.
        </p>
      </div>
    </div>
  );
}
