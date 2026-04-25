export function getRelationshipParticipants(activeRelationship, userName) {
  const seeded = [
    ...(Array.isArray(activeRelationship?.participant_names) ? activeRelationship.participant_names : []),
    ...(Array.isArray(activeRelationship?.participants) ? activeRelationship.participants : []),
  ].filter(Boolean);

  const unique = [...new Set(seeded.map((name) => String(name).trim()).filter(Boolean))];
  if (unique.length >= 2) return unique.slice(0, 2);

  if (unique.length === 1) {
    const fallbackOther =
      userName && unique[0] === userName ? "Other Person" : userName || "Other Person";
    return [unique[0], fallbackOther];
  }

  if (userName) return [userName, "Other Person"];
  return ["Tony", "Drew"];
}

export function getRelationshipLabel(activeRelationship, participants) {
  if (activeRelationship?.name) return activeRelationship.name;
  return participants.join(" & ");
}

export function getPartnerName(person, participants) {
  return participants.find((participant) => participant !== person) || participants[1] || "Other Person";
}

export function getCounterpartLabel(activeRelationshipOrType) {
  return getRelationshipTerms(activeRelationshipOrType).counterpart;
}

export function getDisplayLabel(value) {
  return String(value || "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

export function getPerspectiveLabels(participants = ["Tony", "Drew"]) {
  const [primaryPerson = "Tony", secondaryPerson = "Drew"] = participants;
  return {
    [primaryPerson]: `${primaryPerson} (Individual)`,
    [secondaryPerson]: `${secondaryPerson} (Individual)`,
    [`${primaryPerson}→${secondaryPerson}`]: `${primaryPerson} → ${secondaryPerson}`,
    [`${secondaryPerson}→${primaryPerson}`]: `${secondaryPerson} → ${primaryPerson}`,
    [`${primaryPerson}+${secondaryPerson}`]: `${primaryPerson} & ${secondaryPerson}`,
    Tony: `${primaryPerson} (Individual)`,
    Drew: `${secondaryPerson} (Individual)`,
    "Tony→Drew": `${primaryPerson} → ${secondaryPerson}`,
    "Drew→Tony": `${secondaryPerson} → ${primaryPerson}`,
    "Tony+Drew": `${primaryPerson} & ${secondaryPerson}`,
  };
}

export function getActivePerspectiveKeys(participants = ["Tony", "Drew"]) {
  const [primaryPerson = "Tony", secondaryPerson = "Drew"] = participants;
  return [
    primaryPerson,
    secondaryPerson,
    `${primaryPerson}→${secondaryPerson}`,
    `${secondaryPerson}→${primaryPerson}`,
    `${primaryPerson}+${secondaryPerson}`,
  ];
}

export function isPerspectiveInActivePair(value, participants = ["Tony", "Drew"]) {
  if (!value) return true;
  const [primaryPerson = "Tony", secondaryPerson = "Drew"] = participants;
  const activePairKeys = new Set(getActivePerspectiveKeys(participants));
  if (activePairKeys.has(value)) return true;

  const isBaselinePair = primaryPerson === "Tony" && secondaryPerson === "Drew";
  if (!isBaselinePair) return false;

  const baselineKeys = new Set(["Tony", "Drew", "Tony→Drew", "Drew→Tony", "Tony+Drew"]);
  return baselineKeys.has(value);
}

export function getDisplayPerspective(value, participants = ["Tony", "Drew"]) {
  const labels = getPerspectiveLabels(participants);
  return labels[value] || getDisplayLabel(value);
}

export function normalizeRelationshipType(activeRelationshipOrType) {
  const raw =
    typeof activeRelationshipOrType === "string"
      ? activeRelationshipOrType
      : activeRelationshipOrType?.type || "romantic";
  const normalized = String(raw || "romantic").toLowerCase();
  if (["romantic", "friendship", "family", "other"].includes(normalized)) return normalized;
  return "other";
}

export function getRelationshipTerms(activeRelationshipOrType) {
  const type = normalizeRelationshipType(activeRelationshipOrType);
  switch (type) {
    case "friendship":
      return {
        type,
        typeLabel: "Friendship",
        bond: "friendship",
        bondPlural: "friendships",
        counterpart: "friend",
        counterpartPlural: "friends",
        closeness: "closeness",
        connectionSummary: "shared understanding",
      };
    case "family":
      return {
        type,
        typeLabel: "Family",
        bond: "family connection",
        bondPlural: "family connections",
        counterpart: "family member",
        counterpartPlural: "family members",
        closeness: "trust and closeness",
        connectionSummary: "clearer support",
      };
    case "other":
      return {
        type,
        typeLabel: "Other",
        bond: "connection",
        bondPlural: "connections",
        counterpart: "other person",
        counterpartPlural: "other people",
        closeness: "trust and connection",
        connectionSummary: "clearer understanding",
      };
    case "romantic":
    default:
      return {
        type,
        typeLabel: "Partners",
        bond: "relationship",
        bondPlural: "relationships",
        counterpart: "partner",
        counterpartPlural: "partners",
        closeness: "intimacy",
        connectionSummary: "relationship intelligence",
      };
  }
}

export function replaceParticipantNames(text, participants = ["Tony", "Drew"]) {
  if (!text) return text;
  const [primaryPerson = "Tony", secondaryPerson = "Drew"] = participants;
  return String(text)
    .replace(/\bTony & Drew\b/g, `${primaryPerson} & ${secondaryPerson}`)
    .replace(/\bTony\b/g, primaryPerson)
    .replace(/\bDrew\b/g, secondaryPerson)
    .replace(/\bTony→Drew\b/g, `${primaryPerson}→${secondaryPerson}`)
    .replace(/\bDrew→Tony\b/g, `${secondaryPerson}→${primaryPerson}`)
    .replace(/\bTony\+Drew\b/g, `${primaryPerson}+${secondaryPerson}`);
}

function matchCase(source, replacement) {
  if (source === source.toUpperCase()) return replacement.toUpperCase();
  if (source[0] === source[0]?.toUpperCase()) {
    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

export function rewriteRelationshipCopy(text, activeRelationshipOrType) {
  if (!text) return text;
  const terms = getRelationshipTerms(activeRelationshipOrType);
  if (terms.type === "romantic") return String(text);

  const replacements = [
    [/\bpartners\b/gi, terms.counterpartPlural],
    [/\bpartner\b/gi, terms.counterpart],
    [/\bcouples\b/gi, terms.bondPlural],
    [/\bcouple'?s\b/gi, `${terms.bond}`],
    [/\bcouple\b/gi, terms.bond],
    [/\bromantic relationship\b/gi, terms.bond],
    [/\brelationships\b/gi, terms.bondPlural],
    [/\brelationship\b/gi, terms.bond],
    [/\bintimacy\b/gi, terms.closeness],
  ];

  return replacements.reduce(
    (next, [pattern, replacement]) =>
      next.replace(pattern, (match) => matchCase(match, replacement)),
    String(text),
  );
}

export function getForeignParticipantNames(relationships = [], activeParticipants = []) {
  const activeSet = new Set((activeParticipants || []).map((name) => String(name || "").trim()).filter(Boolean));
  const hidden = new Set();

  relationships.forEach((relationship) => {
    [
      ...(Array.isArray(relationship?.participant_names) ? relationship.participant_names : []),
      ...(Array.isArray(relationship?.participants) ? relationship.participants : []),
    ]
      .map((name) => String(name || "").trim())
      .filter(Boolean)
      .forEach((name) => {
        if (!activeSet.has(name)) hidden.add(name);
      });
  });

  ["Tony", "Drew", "Desi"].forEach((seededName) => {
    if (!activeSet.has(seededName)) hidden.add(seededName);
  });

  return [...hidden];
}

export function containsForeignParticipantNames(text, foreignNames = []) {
  if (!text) return false;
  return foreignNames.some((name) => {
    const pattern = new RegExp(`\\b${String(name).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    return pattern.test(String(text));
  });
}

export function presentRelationshipText(text, participants = ["Tony", "Drew"], activeRelationshipOrType) {
  return rewriteRelationshipCopy(replaceParticipantNames(text, participants), activeRelationshipOrType);
}

export function buildParticipantData(participants, profiles = [], firstResponses = [], secondResponses = []) {
  const [primaryPerson, secondaryPerson] = participants;
  const primaryProfile = profiles.find((profile) => profile.person_name === primaryPerson) || null;
  const secondaryProfile = profiles.find((profile) => profile.person_name === secondaryPerson) || null;

  return {
    primaryPerson,
    secondaryPerson,
    primaryProfile,
    secondaryProfile,
    primaryResponses: firstResponses,
    secondaryResponses: secondResponses,
    legacySlots: {
      tony: primaryProfile,
      drew: secondaryProfile,
      tonyResponses: firstResponses,
      drewResponses: secondResponses,
    },
  };
}
