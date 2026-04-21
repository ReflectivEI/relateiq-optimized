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
  const resolvedClassName = showText
    ? `enterprise-icon-pill ${className}`
    : `h-10 w-10 rounded-full border border-[#0e6f72]/35 bg-[#eef8f7] text-primary hover:bg-[#d9f4f1] hover:shadow-[0_0_0_3px_rgba(14,111,114,0.10)] ${className}`;

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setModalOpen(true)}
        className={resolvedClassName}
        title="Ask AI Coach"
      >
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        {showText && <span className="text-sm text-[#2b3445]">Ask AI</span>}
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
