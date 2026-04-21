/**
 * ExportBar — export AI content as PDF, plain text, or clipboard copy.
 * Reusable across Coach, Profiles, Insights, CheckIn, SmartTools, etc.
 */
import React, { useState } from "react";
import { Download, Copy, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildExportText } from "@/lib/aiCoachService";
import { exportTextToPDF } from "@/lib/pdfExportService";
import { toast } from "sonner";

export default function ExportBar({ ctx, content, className }) {
  const [pdfLoading, setPdfLoading] = useState(false);

  const plainText = buildExportText(ctx, content);

  const handleCopy = () => {
    navigator.clipboard.writeText(plainText);
    toast.success("Copied to clipboard — paste into Notes, email, or docs");
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([plainText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `RelateIQ-${ctx.sectionTitle?.replace(/\s+/g, "-") || "export"}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded as text file");
  };

  const handleExportPDF = async () => {
    setPdfLoading(true);
    try {
      const filename = `RelateIQ-${ctx.sectionTitle?.replace(/\s+/g, "-") || "export"}-${new Date().toISOString().slice(0, 10)}.pdf`;
      const result = await exportTextToPDF({
        text: plainText,
        filename,
        title: ctx.sectionTitle || "AI Analysis",
      });
      result?.pdf?.save(filename);
      toast.success("PDF exported");
    } catch (e) {
      toast.error("PDF export failed");
    }
    setPdfLoading(false);
  };

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className || ""}`}>
      <span className="text-xs text-muted-foreground/60 mr-1">Export:</span>

      <Button
        variant="outline"
        size="sm"
        className="h-9 rounded-full border-2 border-teal-500 bg-[#14263f] px-4 text-xs font-semibold text-white gap-1.5 hover:bg-[#0f1d31] hover:text-white"
        onClick={handleExportPDF}
        disabled={pdfLoading}
      >
        {pdfLoading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <FileText className="w-3 h-3" />
        )}
        Export to PDF
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2.5 text-xs gap-1.5"
        onClick={handleDownloadTxt}
      >
        <Download className="w-3 h-3" />
        Download
      </Button>

      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2.5 text-xs gap-1.5"
        onClick={handleCopy}
      >
        <Copy className="w-3 h-3" />
        Copy
      </Button>
    </div>
  );
}
