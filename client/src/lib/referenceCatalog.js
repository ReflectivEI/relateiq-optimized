export const REFERENCE_CATALOG = [
  {
    id: "GOTTMAN",
    shortLabel: "GOTTMAN",
    title: "Gottman Method",
    category: "Conflict & Repair",
    description:
      "Research-backed guidance on conflict patterns, repair bids, turning toward connection, and reducing escalation.",
    url: "https://www.gottman.com",
  },
  {
    id: "EFT",
    shortLabel: "EFT",
    title: "Emotionally Focused Therapy",
    category: "Attachment & Bonding",
    description:
      "A relationship framework centered on emotional safety, attachment needs, reassurance, and reconnection.",
    url: "https://iceeft.com/what-is-eft/",
  },
  {
    id: "CBT",
    shortLabel: "CBT",
    title: "Cognitive Behavioral Therapy",
    category: "Thought Patterns",
    description:
      "Helps identify interpretation loops, cognitive distortions, and more grounded ways to frame difficult moments.",
    url: "https://www.psychologytoday.com/us/therapy-types/cognitive-behavioral-therapy",
  },
  {
    id: "IMAGO",
    shortLabel: "IMAGO",
    title: "Imago Relationship Therapy",
    category: "History & Perception",
    description:
      "Focuses on recurring loops, mirrored wounds, and how past patterns shape present-day relationship reactions.",
    url: "https://imagorelationships.org/imago-relationship-therapy/",
  },
  {
    id: "LGBTQ_RELATIONAL",
    shortLabel: "LGBTQ+",
    title: "LGBTQ+ Relational Dynamics",
    category: "Identity & Context",
    description:
      "Explains how minority stress, identity safety, and validation gaps can influence same-sex relationship dynamics.",
    url: "https://www.thetrevorproject.org/resources/",
  },
  {
    id: "NVC",
    shortLabel: "NVC",
    title: "Nonviolent Communication",
    category: "Communication",
    description:
      "A communication framework for expressing needs clearly, listening compassionately, and reducing blame in conflict.",
    url: "https://www.cnvc.org/learn-nvc/what-is-nvc",
  },
  {
    id: "POLYVAGAL",
    shortLabel: "POLYVAGAL",
    title: "Polyvagal Theory",
    category: "Nervous System Regulation",
    description:
      "A framework for understanding stress states, shutdown, overwhelm, and what helps the nervous system feel safe enough to reconnect.",
    url: "https://www.polyvagalinstitute.org/whatispolyvagaltheory",
  },
];

export const REFERENCE_BY_ID = Object.fromEntries(
  REFERENCE_CATALOG.map((entry) => [entry.id, entry])
);

export function resolveReference(referenceId) {
  if (!referenceId) return null;
  return REFERENCE_BY_ID[referenceId] || REFERENCE_BY_ID[String(referenceId).toUpperCase()] || null;
}
