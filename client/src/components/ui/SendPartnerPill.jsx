import React from "react";
import { useNavigate } from "react-router-dom";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRelationshipAuth } from "@/context/RelationshipAuthContext";
import { queueSharedMessageDraft } from "@/lib/messageShare";
import { serializeExportContent } from "@/lib/pdfExportService";
import { getPartnerName } from "@/lib/relationshipParticipants";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function SendPartnerPill({
  content,
  title = "RelateIQ",
  sourceLabel = null,
  className,
  size = "sm",
  variant = "outline",
}) {
  const navigate = useNavigate();
  const { user, activeRelationshipId, activeRelationship } = useRelationshipAuth();
  const currentPersonName = activeRelationship?.current_person_name || user?.name || "";
  const partnerName = getPartnerName(currentPersonName, activeRelationship?.participant_names || []);
  const serializedBody = typeof content === "string" ? content.trim() : serializeExportContent(content, title);

  const handleShare = () => {
    if (!serializedBody) {
      toast.error("Content not found");
      return;
    }

    if (!activeRelationshipId || !partnerName) {
      toast.error("Connection partner not found");
      return;
    }

    queueSharedMessageDraft({
      relationshipId: activeRelationshipId,
      sourceLabel: sourceLabel || title,
      title,
      body: serializedBody,
      recipientName: partnerName,
    });

    navigate("/tester-inbox");
    toast.success(`Draft loaded for ${partnerName}.`);
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleShare}
      disabled={!serializedBody || !partnerName}
      className={cn(
        "gap-2 rounded-full border-2 border-[#0e6f72] bg-[#e8f7f6] text-[#0e6f72] hover:border-[#0b5c5e] hover:bg-[#d7f0ed] hover:text-[#0b5c5e]",
        className,
      )}
    >
      <Send className="h-4 w-4" />
      {`Send to ${partnerName || "Partner"}`}
    </Button>
  );
}