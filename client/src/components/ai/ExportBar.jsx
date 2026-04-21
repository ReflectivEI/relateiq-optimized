/**
 * ExportBar — export AI content as PDF, plain text, or clipboard copy.
 * Reusable across Coach, Profiles, Insights, CheckIn, SmartTools, etc.
 */
import React, { useState } from "react";
import { Download, Copy, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildExportText } from "@/lib/aiCoachService";
import { toast } from "sonner";
import jsPDF from "jspdf";

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
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const margin = 48;
      const pageWidth = doc.internal.pageSize.getWidth();
      const maxWidth = pageWidth - margin * 2;
      let y = margin;

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(60, 90, 70);
      doc.text("RelateIQ", margin, y);
      y += 26;

      // Section title
      doc.setFontSize(13);
      doc.setTextColor(30, 30, 30);
      doc.text(ctx.sectionTitle || "AI Analysis", margin, y);
      y += 20;

      // Meta info
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      const date = new Date(ctx.timestamp).toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
      });
      doc.text(`Generated: ${date}  ·  Scope: ${ctx.scope}  ·  Source: ${ctx.page}`, margin, y);
      y += 12;

      // Divider
      doc.setDrawColor(200, 220, 205);
      doc.line(margin, y, pageWidth - margin, y);
      y += 18;

      // Content — strip markdown symbols and split into lines
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(40, 40, 40);

      const rawText = (content || ctx.originalOutput || "")
        .replace(/#{1,6}\s?/g, "")
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/`/g, "");

      const lines = rawText.split("\n");
      for (const line of lines) {
        if (!line.trim()) { y += 6; continue; }

        const isBullet = line.trim().startsWith("- ") || line.trim().startsWith("• ");
        const textLine = isBullet ? "  • " + line.trim().replace(/^[-•]\s/, "") : line.trim();

        const wrapped = doc.splitTextToSize(textLine, maxWidth);
        for (const wl of wrapped) {
          if (y > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            y = margin;
          }
          doc.text(wl, margin, y);
          y += 14;
        }
      }

      // Footer
      y = Math.max(y + 20, doc.internal.pageSize.getHeight() - 36);
      doc.setFontSize(8);
      doc.setTextColor(160, 160, 160);
      doc.line(margin, y - 8, pageWidth - margin, y - 8);
      doc.text(
        "RelateIQ provides evidence-informed relationship coaching insights and is not a substitute for licensed therapy.",
        margin,
        y
      );

      const filename = `RelateIQ-${ctx.sectionTitle?.replace(/\s+/g, "-") || "export"}-${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);
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
