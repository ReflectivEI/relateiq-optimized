/**
 * AskAIButton — Global Ask AI trigger button.
 * Opens AskAIModal with structured context.
 * Works across all sections without drift.
 */
import React, { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import AskAIModal from "./AskAIModal";

export default function AskAIButton({
  context,
  modalTitle = "Ask AI Coach",
  className = "",
  size = "sm",
  showText = false,
  variant = "ghost",
}) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setModalOpen(true)}
        className={`gap-1.5 text-primary hover:bg-primary/10 ${className}`}
        title="Ask AI Coach"
      >
        <Sparkles className="w-3.5 h-3.5" />
        {showText && <span className="text-xs">Ask AI</span>}
      </Button>

      <AskAIModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        context={context}
        title={modalTitle}
      />
    </>
  );
}