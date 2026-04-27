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

function isLikelyHeading(text = "") {
  return /^[A-Z][A-Za-z0-9 &:+/\-]{0,80}$/.test(text) && text.length < 90;
}

function stripMarkdown(text = "") {
  return text
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/^>\s?/gm, "")
    .trim();
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

function formatLabel(key = "") {
  return String(key)
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function serializeValue(value, depth = 0, label = "") {
  if (value == null || value === "") return [];

  if (typeof value === "string") {
    const cleaned = normalizeLine(stripMarkdown(value));
    if (!cleaned) return [];
    const blocks = [];
    if (label) blocks.push({ kind: "heading", text: formatLabel(label) });
    blocks.push({ kind: label || depth > 0 ? "paragraph" : "heading", text: cleaned });
    return blocks;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return label
      ? [{ kind: "heading", text: formatLabel(label) }, { kind: "paragraph", text: String(value) }]
      : [{ kind: "paragraph", text: String(value) }];
  }

  if (Array.isArray(value)) {
    const blocks = [];
    if (label) blocks.push({ kind: "heading", text: formatLabel(label) });
    value.forEach((item) => {
      if (typeof item === "string" || typeof item === "number") {
        const cleaned = normalizeLine(String(item));
        if (cleaned) blocks.push({ kind: "paragraph", text: `• ${cleaned}` });
      } else {
        blocks.push(...serializeValue(item, depth + 1));
      }
    });
    return blocks;
  }

  if (typeof value === "object") {
    const blocks = [];
    if (label) blocks.push({ kind: "heading", text: formatLabel(label) });
    Object.entries(value).forEach(([key, nested]) => {
      blocks.push(...serializeValue(nested, depth + 1, key));
    });
    return blocks;
  }

  return [];
}

export function serializeExportContent(content, title = "") {
  if (typeof content === "string") return content.replace(/\r/g, "").trim();
  return serializeValue(content, 0, title).map((block) => block.text).join("\n\n");
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
  const rawBlocks = String(text || "")
    .replace(/\r/g, "")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  const blocks = rawBlocks.flatMap((block) => {
    const cleaned = stripMarkdown(block);
    const lines = cleaned
      .split("\n")
      .map((line) => normalizeLine(line))
      .filter(Boolean);

    if (lines.length === 0) return [];

    if (lines.length === 1) {
      const [line] = lines;
      return [{
        kind: isLikelyHeading(line) ? "heading" : "paragraph",
        text: line,
      }];
    }

    const [first, ...rest] = lines;
    const blockItems = [];
    if (isLikelyHeading(first)) {
      blockItems.push({ kind: "heading", text: first });
      rest.forEach((line) => {
        blockItems.push({
          kind: line.startsWith("- ") || line.startsWith("* ") || line.startsWith("• ") ? "bullet" : "paragraph",
          text: line.replace(/^[-*]\s+/, "• "),
        });
      });
      return blockItems;
    }

    return lines.map((line) => ({
      kind: line.startsWith("- ") || line.startsWith("* ") || line.startsWith("• ") ? "bullet" : "paragraph",
      text: line.replace(/^[-*]\s+/, "• "),
    }));
  });

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

    const ensurePageSpace = (requiredHeight = 20) => {
      if (yPosition + requiredHeight <= pageHeight - margin) return;
      pdf.addPage();
      yPosition = margin;
    };

    blocks.forEach((block) => {
      const isHeading =
        block.kind === "heading" ||
        isLikelyHeading(block.text);
      const isBullet = block.kind === "bullet";

      pdf.setFont("helvetica", isHeading ? "bold" : "normal");
      pdf.setFontSize(isHeading ? 12 : 10.5);
      pdf.setTextColor(isHeading ? 20 : 45, isHeading ? 38 : 55, isHeading ? 63 : 55);

      const wrapped = pdf.splitTextToSize(block.text, maxWidth - (isBullet ? 10 : 0));
      ensurePageSpace((wrapped.length + 1) * (isHeading ? 16 : 14));
      wrapped.forEach((line) => {
        const xPosition = isBullet ? margin + 10 : margin;
        pdf.text(line, xPosition, yPosition);
        yPosition += isHeading ? 16 : 14;
      });

      yPosition += isHeading ? 8 : 6;
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
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}
