/**
 * ResponseExportBar.jsx — PDF export + direct send button for all response sections
 */

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2, Send } from "lucide-react";
import { downloadPDF, exportTextToPDF, serializeExportContent } from "@/lib/pdfExportService";
import { useRelationshipAuth } from "@/context/RelationshipAuthContext";
import { getPartnerName } from "@/lib/relationshipParticipants";
import { queueSharedMessageDraft } from "@/lib/messageShare";
import { toast } from "sonner";

export default function ResponseExportBar({
  contentRef,
  content = null,
  filename = "response.pdf",
  title = "Response",
  showShare = true,
  shareSourceLabel = null,
}) {
  const [exporting, setExporting] = useState(false);
  const navigate = useNavigate();
  const { user, activeRelationshipId, activeRelationship } = useRelationshipAuth();
  const currentPersonName = activeRelationship?.current_person_name || user?.name || "";
  const partnerName = getPartnerName(currentPersonName, activeRelationship?.participant_names || []);

  const resolvedShareBody = content
    ? serializeExportContent(content, title)
    : String(contentRef?.current?.innerText || contentRef?.current?.textContent || "").trim();

  const handleExportPDF = async () => {
    if (!content && !contentRef?.current) {
      toast.error("Content not found");
      return;
    }

    setExporting(true);
    try {
      if (content) {
        const result = await exportTextToPDF({
          text: serializeExportContent(content, title),
          filename,
          title,
        });
        if (!result?.blob) throw new Error("Failed to create PDF");
        const link = document.createElement("a");
        link.href = URL.createObjectURL(result.blob);
        link.download = filename;
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      } else {
        await downloadPDF({
          element: contentRef.current,
          filename,
          title,
        });
      }
      toast.success("PDF downloaded successfully");
    } catch (err) {
      toast.error("Failed to export PDF");
      console.error(err);
    } finally {
      setExporting(false);
    }
  };

  const handleShare = () => {
    if (!resolvedShareBody) {
      toast.error("Content not found");
      return;
    }

    if (!activeRelationshipId || !partnerName) {
      toast.error("Connection partner not found");
      return;
    }

    queueSharedMessageDraft({
      relationshipId: activeRelationshipId,
      sourceLabel: shareSourceLabel || title,
      title,
      body: resolvedShareBody,
      recipientName: partnerName,
    });

    navigate("/tester-inbox");
    toast.success(`Draft loaded for ${partnerName}.`);
  };

  return (
    <div className="flex gap-3 flex-wrap" data-export-ignore="true">
      <Button
        onClick={handleExportPDF}
        disabled={exporting}
        variant="outline"
        className="gap-2 text-sm rounded-full border-2 border-teal-500 bg-[#14263f] px-4 font-semibold text-white hover:bg-[#0f1d31] hover:text-white"
      >
        {exporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <FileDown className="w-4 h-4" />
        )}
        {exporting ? "Exporting..." : "Export to PDF"}
      </Button>

      {showShare && (
        <Button
          onClick={handleShare}
          disabled={exporting || !resolvedShareBody}
          className="gap-2 rounded-full border-2 border-[#0e6f72] bg-[#e8f7f6] text-[#0e6f72] hover:border-[#0b5c5e] hover:bg-[#d7f0ed] hover:text-[#0b5c5e]"
        >
          <Send className="w-4 h-4" />
          {`Share with ${partnerName || "Partner"}`}
        </Button>
      )}
    </div>
  );
}
