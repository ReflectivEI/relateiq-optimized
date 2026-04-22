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
    setTimeout(() => URL.revokeObjectURL(url), 1000);
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
    <div className={`space-y-2 ${className || ""}`}>
      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Export</span>
      <div className="flex items-center gap-2 flex-wrap">

        <Button
          variant="outline"
          size="sm"
          className="h-10 rounded-full border-2 border-teal-500 bg-[#14263f] px-4 text-sm font-semibold text-white gap-1.5 hover:bg-[#0f1d31] hover:text-white"
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
          className="h-10 rounded-full border-2 border-primary/35 bg-white px-4 text-sm font-medium text-primary gap-1.5 hover:bg-primary/5"
          onClick={handleDownloadTxt}
        >
          <Download className="w-3 h-3" />
          Download
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-10 rounded-full border-2 border-primary/35 bg-white px-4 text-sm font-medium text-primary gap-1.5 hover:bg-primary/5"
          onClick={handleCopy}
        >
          <Copy className="w-3 h-3" />
          Copy
        </Button>
      </div>
    </div>
  );
}
