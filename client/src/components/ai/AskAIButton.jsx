/**
 * AskAIButton — compact "Ask AI" button for embedding in any section.
 * Opens AskCoachDrawer pre-filled with section context.
 */
import React from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AskAIButton({
  page,
  sectionTitle,
  scope = "this connection",
  onClick,
  className = "",
  size = "sm",
  showText = false,
}) {
  return (
    <Button
      variant="ghost"
      size={size}
      onClick={onClick}
      className={`gap-1.5 text-primary hover:bg-primary/10 ${className}`}
      title={`Ask AI Coach about ${sectionTitle}`}
    >
      <Sparkles className="w-3.5 h-3.5" />
      {showText && <span className="text-xs">Ask AI</span>}
    </Button>
  );
}
