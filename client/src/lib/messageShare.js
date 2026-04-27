const SHARE_DRAFT_STORAGE_KEY = "relateiq.sharedMessageDraft.v1";

function normalizeLine(value = "") {
    return String(value).replace(/\r/g, "").replace(/[ \t]+/g, " ").trim();
}

export function buildSharedMessageBody({
    sourceLabel,
    title,
    body,
}) {
    const sections = [];

    if (sourceLabel) {
        sections.push(`Shared from ${sourceLabel}`);
    }

    if (title && title !== sourceLabel) {
        sections.push(normalizeLine(title));
    }

    if (body) {
        sections.push(String(body).replace(/\r/g, "").trim());
    }

    return sections.filter(Boolean).join("\n\n").trim();
}

export function queueSharedMessageDraft(payload) {
    if (typeof window === "undefined") return;

    const draft = {
        relationshipId: payload.relationshipId || "",
        sourceLabel: payload.sourceLabel || "RelateIQ",
        recipientName: payload.recipientName || "",
        message: buildSharedMessageBody(payload),
        createdAt: new Date().toISOString(),
    };

    window.localStorage.setItem(SHARE_DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

export function readSharedMessageDraft(relationshipId) {
    if (typeof window === "undefined") return null;

    const raw = window.localStorage.getItem(SHARE_DRAFT_STORAGE_KEY);
    if (!raw) return null;

    try {
        const parsed = JSON.parse(raw);
        if (!parsed?.message) return null;
        if (relationshipId && parsed.relationshipId && parsed.relationshipId !== relationshipId) return null;
        return parsed;
    } catch {
        return null;
    }
}

export function clearSharedMessageDraft() {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(SHARE_DRAFT_STORAGE_KEY);
}