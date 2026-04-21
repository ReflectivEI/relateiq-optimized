import jsPDF from "jspdf";

const BLOCK_TAGS = new Set([
  "P",
  "DIV",
  "SECTION",
  "ARTICLE",
  "LI",
  "UL",
  "OL",
  "BLOCKQUOTE",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
]);

function shouldSkipNode(node) {
  if (!(node instanceof HTMLElement)) return false;
  if (node.hidden) return true;
  if (node.dataset?.exportIgnore === "true") return true;
  if (node.getAttribute("aria-hidden") === "true") return true;
  if (["BUTTON", "INPUT", "TEXTAREA", "SELECT", "SVG"].includes(node.tagName)) return true;
  if (node.closest("[data-export-ignore='true']")) return true;
  const className = node.className || "";
  return typeof className === "string" && /tabs-list|tabs-trigger|tooltip|popover|dialog-close/i.test(className);
}

function normalizeLine(value = "") {
  return value.replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();
}

function collectBlocks(node, blocks = []) {
  if (!(node instanceof HTMLElement)) return blocks;
  if (shouldSkipNode(node)) return blocks;

  const children = Array.from(node.children).filter((child) => child instanceof HTMLElement);
  const isLeafBlock = BLOCK_TAGS.has(node.tagName) && children.length === 0;
  const isHeading = /^H[1-6]$/.test(node.tagName);

  if (isLeafBlock || isHeading) {
    const text = normalizeLine(node.innerText || node.textContent || "");
    if (text) {
      blocks.push({
        kind: isHeading ? "heading" : "paragraph",
        text,
      });
    }
    return blocks;
  }

  if (children.length === 0) {
    const text = normalizeLine(node.innerText || node.textContent || "");
    if (text) {
      blocks.push({
        kind: "paragraph",
        text,
      });
    }
    return blocks;
  }

  children.forEach((child) => collectBlocks(child, blocks));
  return blocks;
}

function dedupeBlocks(blocks = []) {
  const seen = new Set();
  return blocks.filter((block) => {
    const key = `${block.kind}:${block.text}`;
    if (!block.text || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractBlocks(element) {
  const blocks = dedupeBlocks(collectBlocks(element, []));
  if (blocks.length > 0) return blocks;

  const fallbackText = normalizeLine(element?.innerText || element?.textContent || "");
  return fallbackText ? [{ kind: "paragraph", text: fallbackText }] : [];
}

export async function exportElementToPDF({
  element,
  filename = "response.pdf",
  title = "Relationship Analysis",
}) {
  if (!element) return null;
  return exportBlocksToPDF({
    blocks: extractBlocks(element),
    filename,
    title,
  });
}

export async function exportTextToPDF({
  text,
  filename = "response.pdf",
  title = "Relationship Analysis",
}) {
  const blocks = String(text || "")
    .replace(/\r/g, "")
    .split(/\n+/)
    .map((line) => normalizeLine(line.replace(/^#{1,6}\s*/, "").replace(/\*\*/g, "").replace(/`/g, "")))
    .filter(Boolean)
    .map((line) => ({
      kind: /^[A-Z][A-Za-z0-9 &:+/-]{0,80}$/.test(line) && line.length < 90 ? "heading" : "paragraph",
      text: line,
    }));

  return exportBlocksToPDF({ blocks, filename, title });
}

async function exportBlocksToPDF({ blocks, filename, title }) {
  try {
    const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 48;
    const maxWidth = pageWidth - margin * 2;
    let yPosition = margin;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.setTextColor(20, 38, 63);
    pdf.text(title, margin, yPosition);
    yPosition += 24;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, yPosition);
    yPosition += 18;

    pdf.setDrawColor(203, 213, 225);
    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 20;

    blocks.forEach((block) => {
      const isHeading =
        block.kind === "heading" ||
        (/^[A-Z][A-Za-z0-9 &:+/-]{0,80}$/.test(block.text) && block.text.length < 90);

      pdf.setFont("helvetica", isHeading ? "bold" : "normal");
      pdf.setFontSize(isHeading ? 12 : 10);
      pdf.setTextColor(isHeading ? 20 : 45, isHeading ? 38 : 55, isHeading ? 63 : 55);

      const wrapped = pdf.splitTextToSize(block.text, maxWidth);
      wrapped.forEach((line) => {
        if (yPosition > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(line, margin, yPosition);
        yPosition += isHeading ? 16 : 14;
      });

      yPosition += isHeading ? 6 : 4;
    });

    const totalPages = pdf.getNumberOfPages();
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(148, 163, 184);
    for (let page = 1; page <= totalPages; page += 1) {
      pdf.setPage(page);
      pdf.text(`Page ${page} of ${totalPages}`, pageWidth / 2, pageHeight - 18, { align: "center" });
    }

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
