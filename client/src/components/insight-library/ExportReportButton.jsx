/**
 * ExportReportButton — triggers the full Insight Library PDF export.
 * Accepts a ref to the chart DOM element for screenshot capture.
 */
import React, { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportInsightLibraryPDF } from "@/lib/insightLibraryPDF";
import { toast } from "sonner";

export default function ExportReportButton({ entries, allEntries, filterLabel, chartRef }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await exportInsightLibraryPDF({
        entries,
        allEntries,
        filterLabel,
        chartEl: chartRef?.current || null,
      });
      toast.success("PDF report exported");
    } catch (err) {
      toast.error("Export failed — please try again");
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={loading || entries.length === 0}
      className="gap-2"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
      {loading ? "Exporting…" : "Export PDF Report"}
    </Button>
  );
}