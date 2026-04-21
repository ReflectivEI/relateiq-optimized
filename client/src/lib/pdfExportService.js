/**
 * pdfExportService.js — Generate PDFs from rendered content
 */

import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export async function exportElementToPDF({
  element,
  filename = "response.pdf",
  title = "Relationship Analysis",
}) {
  if (!element) return null;

  try {
    // Capture element as canvas
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth - 20;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let yPosition = 10;

    // Add title
    pdf.setFontSize(16);
    pdf.text(title, 10, yPosition);
    yPosition += 15;

    // Add date
    pdf.setFontSize(10);
    pdf.setTextColor(100);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 10, yPosition);
    yPosition += 10;

    // Add content
    pdf.addImage(imgData, "PNG", 10, yPosition, imgWidth, imgHeight);

    // Handle multiple pages
    if (yPosition + imgHeight > pageHeight) {
      let heightLeft = imgHeight;
      let position = 0;

      while (heightLeft > 0) {
        position = heightLeft - pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
    }

    // Add footer
    const pageCount = pdf.internal.pages.length - 1;
    pdf.setFontSize(8);
    pdf.setTextColor(150);
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        pageHeight - 5,
        { align: "center" }
      );
    }

    // Save or return
    return {
      pdf,
      blob: pdf.output("blob"),
      filename,
    };
  } catch (err) {
    console.error("PDF export failed:", err);
    return null;
  }
}

export async function downloadPDF({ element, filename = "response.pdf", title = "Response" }) {
  const result = await exportElementToPDF({ element, filename, title });
  if (!result) return;

  const link = document.createElement("a");
  link.href = URL.createObjectURL(result.blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function generateEmailPDF({ element, title = "Response" }) {
  return exportElementToPDF({ element, filename: `${title}.pdf`, title });
}