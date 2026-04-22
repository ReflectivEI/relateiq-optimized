/**
 * ResponseExportBar.jsx — PDF export + email button for all response sections
 */

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Mail, Loader2 } from "lucide-react";
import { downloadPDF, exportTextToPDF, generateEmailPDF, serializeExportContent } from "@/lib/pdfExportService";
import { openEmailWithPDF } from "@/lib/emailService";
import { toast } from "sonner";

export default function ResponseExportBar({ 
  contentRef, 
  content = null,
  filename = "response.pdf",
  title = "Response",
  showEmail = true 
}) {
  const [exporting, setExporting] = useState(false);
  const [emailing, setEmailing] = useState(false);

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

  const handleEmailPDF = async () => {
    if (!content && !contentRef?.current) {
      toast.error("Content not found");
      return;
    }

    setEmailing(true);
    try {
      const result = content
        ? await exportTextToPDF({
            text: serializeExportContent(content, title),
            filename: `${title}.pdf`,
            title,
          })
        : await generateEmailPDF({
            element: contentRef.current,
            title,
          });

      if (result?.blob) {
        // Open email with PDF
        openEmailWithPDF({
          pdfBlob: result.blob,
          filename,
          subject: `My ${title}`,
          body: `I wanted to share this with you.`,
        });
        toast.success("Opening email client...");
      }
    } catch (err) {
      toast.error("Failed to prepare PDF for email");
      console.error(err);
    } finally {
      setEmailing(false);
    }
  };

  return (
    <div className="flex gap-3 flex-wrap" data-export-ignore="true">
      <Button
        onClick={handleExportPDF}
        disabled={exporting || emailing}
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

      {showEmail && (
        <Button
          onClick={handleEmailPDF}
          disabled={exporting || emailing}
          className="border-2 border-teal-600 bg-teal-50 hover:bg-teal-100 text-teal-700 gap-2 text-sm font-semibold"
        >
          {emailing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Mail className="w-4 h-4" />
          )}
          {emailing ? "Preparing..." : "PDF & Email"}
        </Button>
      )}
    </div>
  );
}
