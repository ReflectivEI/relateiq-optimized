/**
 * insightLibraryPDF.js
 * ─────────────────────────────────────────────────────────────────
 * Generates a structured PDF report for the Insight Library.
 * Sections: cover, summary stats, evolution chart (html2canvas),
 * all filtered insight entries, and pattern / risk trends.
 */
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { format, parseISO } from "date-fns";

// ── Brand palette (RGB) ──────────────────────────────────────────
const CLR = {
  primary:   [75, 140, 110],
  heading:   [20,  25,  35],
  body:      [50,  55,  70],
  muted:     [130, 135, 150],
  border:    [220, 222, 228],
  blueBg:    [235, 242, 255],
  greenBg:   [234, 248, 240],
  redBg:     [255, 237, 237],
  yellowBg:  [255, 249, 226],
  white:     [255, 255, 255],
  lightGray: [248, 249, 250],
};

const PAGE_W = 595;  // A4 pt width
const PAGE_H = 842;  // A4 pt height
const M      = 48;   // margin
const BODY_W = PAGE_W - M * 2;

// ── Helpers ──────────────────────────────────────────────────────

function setColor(doc, rgb) { doc.setTextColor(...rgb); }
function setDraw(doc, rgb)  { doc.setDrawColor(...rgb); }
function setFill(doc, rgb)  { doc.setFillColor(...rgb); }

function rule(doc, y, color = CLR.border) {
  setDraw(doc, color);
  doc.setLineWidth(0.4);
  doc.line(M, y, PAGE_W - M, y);
}

function safeText(doc, text, x, y, opts = {}) {
  const maxW = opts.maxWidth || BODY_W;
  const lines = doc.splitTextToSize(String(text || ""), maxW);
  doc.text(lines, x, y, opts);
  return y + lines.length * (opts.lineHeightFactor || 1.4) * doc.getFontSize() * 0.352778;
}

/** Wraps text and returns new Y position */
function block(doc, text, x, y, { fontSize = 10, color = CLR.body, maxWidth = BODY_W, bold = false } = {}) {
  doc.setFontSize(fontSize);
  doc.setFont("helvetica", bold ? "bold" : "normal");
  setColor(doc, color);
  return safeText(doc, text, x, y, { maxWidth, lineHeightFactor: 1.45 });
}

/** Check page overflow and add new page if needed, returns new Y */
function checkPage(doc, y, needed = 20) {
  if (y + needed > PAGE_H - M) {
    doc.addPage();
    return M + 10;
  }
  return y;
}

/** Filled pill label */
function pill(doc, text, x, y, bg, fg) {
  doc.setFontSize(8);
  const w = doc.getTextWidth(text) + 10;
  setFill(doc, bg);
  setDraw(doc, bg);
  doc.roundedRect(x, y - 7, w, 10, 3, 3, "F");
  setColor(doc, fg);
  doc.text(text, x + 5, y);
  return x + w + 4;
}

function perspectivePill(doc, perspective, x, y) {
  const MAP = {
    "Tony":      { bg: [219, 234, 254], fg: [29,  78, 216] },
    "Drew":      { bg: [243, 232, 255], fg: [109, 40, 217] },
    "Tony→Drew": { bg: [220, 252, 231], fg: [22, 101,  52] },
    "Drew→Tony": { bg: [255, 237, 213], fg: [154, 52,  18] },
  };
  const c = MAP[perspective] || { bg: [240, 240, 240], fg: [80, 80, 80] };
  pill(doc, perspective, x, y, c.bg, c.fg);
}

// ── Cover Page ───────────────────────────────────────────────────

function drawCover(doc, stats, filterLabel) {
  // Top bar
  setFill(doc, CLR.primary);
  doc.rect(0, 0, PAGE_W, 8, "F");

  // Title block
  let y = 110;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  setColor(doc, CLR.heading);
  doc.text("Insight Library", M, y);
  y += 12;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  setColor(doc, CLR.primary);
  doc.text("Relationship Analysis Report", M, y);
  y += 28;

  rule(doc, y, CLR.primary);
  y += 16;

  // Filter context
  doc.setFontSize(10);
  setColor(doc, CLR.muted);
  doc.text(`Filter: ${filterLabel}`, M, y);
  y += 10;
  doc.text(`Generated: ${format(new Date(), "MMMM d, yyyy 'at' h:mm a")}`, M, y);
  y += 30;

  // Stats grid
  const statItems = [
    { label: "Total Analyses", value: stats.total },
    { label: "In Report",      value: stats.filtered },
    { label: "Avg Confidence", value: `${stats.avgConfidence}%` },
    { label: "Perspectives",   value: stats.perspectiveCount },
  ];
  const cellW = BODY_W / 4;
  statItems.forEach((s, i) => {
    const cx = M + i * cellW;
    setFill(doc, CLR.lightGray);
    setDraw(doc, CLR.border);
    doc.roundedRect(cx, y, cellW - 6, 44, 4, 4, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    setColor(doc, CLR.primary);
    doc.text(String(s.value), cx + (cellW - 6) / 2, y + 20, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    setColor(doc, CLR.muted);
    doc.text(s.label, cx + (cellW - 6) / 2, y + 34, { align: "center" });
  });
  y += 60;

  // Bottom disclaimer
  const discY = PAGE_H - 50;
  rule(doc, discY, CLR.border);
  doc.setFontSize(8);
  setColor(doc, CLR.muted);
  doc.text(
    "Context: Us provides evidence-informed relationship coaching insights and is not a substitute for licensed therapy.",
    PAGE_W / 2, discY + 12,
    { align: "center" }
  );
}

// ── Section Header ───────────────────────────────────────────────

function sectionHeader(doc, title, y) {
  y = checkPage(doc, y, 28);
  setFill(doc, CLR.primary);
  doc.rect(M, y, 3, 16, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  setColor(doc, CLR.heading);
  doc.text(title, M + 10, y + 11);
  return y + 24;
}

// ── Insight Entry Block ──────────────────────────────────────────

function drawEntry(doc, entry, y) {
  const confPct = entry.confidence_score != null ? Math.round(entry.confidence_score * 100) : null;
  const dateLabel = entry.created_date
    ? format(parseISO(entry.created_date), "MMM d, yyyy")
    : (entry.week_label || "");

  const estHeight = 60
    + (entry.behavioral_patterns?.length > 0 ? 20 + Math.ceil(entry.behavioral_patterns.length / 3) * 12 : 0)
    + (entry.risk_flags?.length > 0 ? 16 + Math.ceil(entry.risk_flags.length / 3) * 12 : 0)
    + (entry.strengths?.length > 0 ? 16 + Math.ceil(entry.strengths.length / 3) * 12 : 0)
    + (entry.note ? 20 : 0);

  y = checkPage(doc, y, Math.min(estHeight, 120));

  // Card background
  setFill(doc, CLR.lightGray);
  setDraw(doc, CLR.border);
  doc.roundedRect(M, y, BODY_W, 10, 3, 3, "F"); // header strip
  setFill(doc, [252, 252, 253]);
  doc.roundedRect(M, y, BODY_W, 10, 3, 3, "S");

  // Header row
  let hx = M + 8;
  perspectivePill(doc, entry.perspective, hx, y + 7.5);
  hx += doc.getTextWidth(entry.perspective) + 20;

  if (entry.mode) {
    doc.setFontSize(7);
    setColor(doc, CLR.muted);
    doc.text(entry.mode, hx, y + 7.5);
    hx += doc.getTextWidth(entry.mode) + 10;
  }
  if (confPct != null) {
    doc.setFontSize(7);
    setColor(doc, CLR.muted);
    doc.text(`${confPct}% conf.`, hx, y + 7.5);
  }
  // Date right-aligned
  doc.setFontSize(7);
  setColor(doc, CLR.muted);
  doc.text(dateLabel, PAGE_W - M - 8, y + 7.5, { align: "right" });

  y += 14;

  // Core insight
  y = block(doc, entry.core_insight, M + 8, y + 5, { fontSize: 9.5, color: CLR.body, maxWidth: BODY_W - 16 });
  y += 4;

  // Scenario
  if (entry.scenario) {
    y = block(doc, `Scenario: ${entry.scenario}`, M + 8, y, { fontSize: 8, color: CLR.muted, maxWidth: BODY_W - 16 });
    y += 3;
  }

  // Tags row helper
  const tagsRow = (doc, items, bgColor, fgColor, startY) => {
    let tx = M + 8;
    let rowY = startY;
    items.forEach((item) => {
      const tw = doc.getTextWidth(item) + 10;
      if (tx + tw > PAGE_W - M - 8) { tx = M + 8; rowY += 12; }
      setFill(doc, bgColor);
      setDraw(doc, bgColor);
      doc.roundedRect(tx, rowY - 6.5, tw, 9, 2.5, 2.5, "F");
      doc.setFontSize(7.5);
      setColor(doc, fgColor);
      doc.text(item, tx + 5, rowY);
      tx += tw + 4;
    });
    return rowY + 12;
  };

  if (entry.behavioral_patterns?.length > 0) {
    y = checkPage(doc, y, 20);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    setColor(doc, CLR.muted);
    doc.text("PATTERNS", M + 8, y);
    y += 5;
    y = tagsRow(doc, entry.behavioral_patterns.slice(0, 8), [235, 242, 255], [29, 78, 216], y);
  }

  if (entry.risk_flags?.length > 0) {
    y = checkPage(doc, y, 20);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    setColor(doc, CLR.muted);
    doc.text("RISKS", M + 8, y);
    y += 5;
    y = tagsRow(doc, entry.risk_flags.slice(0, 6), [255, 237, 237], [185, 28, 28], y);
  }

  if (entry.strengths?.length > 0) {
    y = checkPage(doc, y, 20);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "bold");
    setColor(doc, CLR.muted);
    doc.text("STRENGTHS", M + 8, y);
    y += 5;
    y = tagsRow(doc, entry.strengths.slice(0, 6), [220, 252, 231], [22, 101, 52], y);
  }

  if (entry.note) {
    y = checkPage(doc, y, 16);
    y = block(doc, `Note: ${entry.note}`, M + 8, y, { fontSize: 8, color: CLR.muted, maxWidth: BODY_W - 16 });
  }

  // Bottom border
  rule(doc, y + 4, CLR.border);
  return y + 12;
}

// ── Pattern Trends Section ───────────────────────────────────────

function countItems(entries, field) {
  const counts = {};
  entries.forEach((e) => {
    (e[field] || []).forEach((item) => {
      const key = item.toLowerCase().slice(0, 80);
      if (!counts[key]) counts[key] = { text: item, count: 0 };
      counts[key].count++;
    });
  });
  return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 12);
}

function drawPatternTrends(doc, entries, y) {
  y = sectionHeader(doc, "Pattern & Risk Trends", y);

  const patterns = countItems(entries, "behavioral_patterns");
  const risks    = countItems(entries, "risk_flags");

  const drawList = (doc, items, y, bgColor, fgColor) => {
    items.forEach((item) => {
      y = checkPage(doc, y, 14);
      // Bar background
      const barMaxW = BODY_W - 60;
      const barW = Math.round((item.count / (items[0]?.count || 1)) * barMaxW);
      setFill(doc, bgColor);
      doc.roundedRect(M, y - 7, barW, 10, 2, 2, "F");
      // Label
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      setColor(doc, fgColor);
      const label = item.text.length > 70 ? item.text.slice(0, 67) + "…" : item.text;
      doc.text(label, M + 6, y);
      // Count badge
      setFill(doc, fgColor);
      const bx = PAGE_W - M - 22;
      doc.roundedRect(bx, y - 7, 20, 10, 2, 2, "F");
      setColor(doc, CLR.white);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.text(`x${item.count}`, bx + 10, y, { align: "center" });
      y += 14;
    });
    return y;
  };

  if (patterns.length > 0) {
    y = checkPage(doc, y, 20);
    block(doc, "Recurring Behavioral Patterns", M, y, { fontSize: 10, color: CLR.heading, bold: true });
    y += 14;
    y = drawList(doc, patterns, y, [219, 234, 254], [29, 78, 216]);
    y += 8;
  }

  if (risks.length > 0) {
    y = checkPage(doc, y, 20);
    block(doc, "Recurring Risk Flags", M, y, { fontSize: 10, color: CLR.heading, bold: true });
    y += 14;
    y = drawList(doc, risks, y, [255, 237, 237], [185, 28, 28]);
    y += 8;
  }

  return y;
}

// ── Page Footer ──────────────────────────────────────────────────

function addFooters(doc) {
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    rule(doc, PAGE_H - 28, CLR.border);
    doc.setFontSize(7.5);
    setColor(doc, CLR.muted);
    doc.text("Context: Us — Insight Library Report", M, PAGE_H - 16);
    doc.text(`Page ${i} of ${total}`, PAGE_W - M, PAGE_H - 16, { align: "right" });
    // top accent bar on every page (except cover already has it)
    if (i > 1) {
      setFill(doc, CLR.primary);
      doc.rect(0, 0, PAGE_W, 4, "F");
    }
  }
}

// ── Main Export Function ─────────────────────────────────────────

/**
 * @param {object} opts
 * @param {Array}  opts.entries        - filtered InsightEntry records
 * @param {Array}  opts.allEntries     - all entries (for stats)
 * @param {string} opts.filterLabel    - human-readable filter description
 * @param {HTMLElement|null} opts.chartEl - DOM element of the chart (or null)
 */
export async function exportInsightLibraryPDF({ entries, allEntries, filterLabel, chartEl }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const stats = {
    total:            allEntries.length,
    filtered:         entries.length,
    avgConfidence:    entries.length
      ? Math.round(entries.reduce((s, e) => s + (e.confidence_score || 0), 0) / entries.length * 100)
      : 0,
    perspectiveCount: new Set(allEntries.map((e) => e.perspective)).size,
  };

  // ── Cover
  drawCover(doc, stats, filterLabel);

  // ── Evolution Chart (html2canvas screenshot)
  if (chartEl) {
    try {
      const canvas = await html2canvas(chartEl, { scale: 2, backgroundColor: "#ffffff", logging: false });
      const imgData = canvas.toDataURL("image/png");
      doc.addPage();
      let y = M + 10;
      y = sectionHeader(doc, "Confidence Score Evolution", y);
      const imgH = (canvas.height / canvas.width) * BODY_W;
      doc.addImage(imgData, "PNG", M, y, BODY_W, imgH);
    } catch (_) {
      // chart capture failed — skip silently
    }
  }

  // ── Insight Entries
  if (entries.length > 0) {
    doc.addPage();
    let y = M + 10;
    y = sectionHeader(doc, `Insight Entries (${entries.length})`, y);
    for (const entry of entries) {
      y = drawEntry(doc, entry, y);
    }
  }

  // ── Pattern Trends
  if (allEntries.length >= 2) {
    doc.addPage();
    let y = M + 10;
    drawPatternTrends(doc, allEntries, y);
  }

  addFooters(doc);

  const filename = `ContextUs-InsightReport-${format(new Date(), "yyyy-MM-dd")}.pdf`;
  doc.save(filename);
}