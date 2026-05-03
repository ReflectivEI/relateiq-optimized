function parseRelationshipNameParticipants(name) {
  const raw = String(name || "").trim();
  if (!raw) return [];

  const pairSegment = raw
    .replace(/\s+[·|-]\s+.*$/u, "")
    .replace(/\s+—\s+.*$/u, "")
    .trim();

  const separators = [" & ", " + ", " and ", " AND "];
  for (const separator of separators) {
    if (!pairSegment.includes(separator)) continue;
    const parts = pairSegment
      .split(separator)
      .map((value) => String(value || "").trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      return [...new Set(parts)].slice(0, 2);
    }
  }

  return [];
}

function collectRelationshipNames(activeRelationship) {
  return [
    ...(Array.isArray(activeRelationship?.participant_names) ? activeRelationship.participant_names : []),
    ...(Array.isArray(activeRelationship?.participants) ? activeRelationship.participants : []),
    ...parseRelationshipNameParticipants(activeRelationship?.name),
  ].filter(Boolean);
}

export function getRelationshipParticipants(activeRelationship, userName) {
  const seeded = collectRelationshipNames(activeRelationship);

  const unique = [...new Set(seeded.map((name) => String(name).trim()).filter(Boolean))];
  if (unique.length >= 2) return unique.slice(0, 2);

  if (unique.length === 1) {
    const fallbackOther =
      userName && unique[0] === userName ? "Other Person" : userName || "Other Person";
    return [unique[0], fallbackOther];
  }

  if (userName) return [userName, "Other Person"];
  return ["Person A", "Other Person"];
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

export function getPerspectiveLabels(participants = ["Person A", "Other Person"]) {
  const [primaryPerson = "Person A", secondaryPerson = "Other Person"] = participants;
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

export function getActivePerspectiveKeys(participants = ["Person A", "Other Person"]) {
  const [primaryPerson = "Person A", secondaryPerson = "Other Person"] = participants;
  return [
    primaryPerson,
    secondaryPerson,
    `${primaryPerson}→${secondaryPerson}`,
    `${secondaryPerson}→${primaryPerson}`,
    `${primaryPerson}+${secondaryPerson}`,
  ];
}

export function isPerspectiveInActivePair(value, participants = ["Person A", "Other Person"]) {
  if (!value) return true;
  const [primaryPerson = "Person A", secondaryPerson = "Other Person"] = participants;
  const activePairKeys = new Set(getActivePerspectiveKeys(participants));
  if (activePairKeys.has(value)) return true;

  const isBaselinePair = primaryPerson === "Tony" && secondaryPerson === "Drew";
  if (!isBaselinePair) return false;

  const baselineKeys = new Set(["Tony", "Drew", "Tony→Drew", "Drew→Tony", "Tony+Drew"]);
  return baselineKeys.has(value);
}

export function getDisplayPerspective(value, participants = ["Person A", "Other Person"]) {
  const labels = getPerspectiveLabels(participants);
  return labels[value] || getDisplayLabel(value);
}

export function normalizeRelationshipType(activeRelationshipOrType) {
  const raw =
    typeof activeRelationshipOrType === "string"
      ? activeRelationshipOrType
      : activeRelationshipOrType?.type || "romantic";
  const normalized = String(raw || "romantic")
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  const aliases = {
    partner: "romantic",
    partners: "romantic",
    committed: "committed_relationship",
    committed_relationship: "committed_relationship",
    commitment: "committed_relationship",
    married: "marriage",
    marriage: "marriage",
    friendship: "friendship",
    friends: "friendship",
    family: "family",
    colleague: "colleague",
    colleagues: "colleague",
    coworker: "colleague",
    coworkers: "colleague",
    co_worker: "colleague",
    co_workers: "colleague",
    other: "other",
    romantic: "romantic",
  };

  const mapped = aliases[normalized] || normalized;
  if (["romantic", "committed_relationship", "marriage", "friendship", "family", "colleague", "other"].includes(mapped)) {
    return mapped;
  }
  return "other";
}

export function getRelationshipTerms(activeRelationshipOrType) {
  const type = normalizeRelationshipType(activeRelationshipOrType);
  const byType = {
    romantic: {
      type,
      typeLabel: "Partners",
      bond: "relationship",
      bondPlural: "relationships",
      counterpart: "partner",
      counterpartPlural: "partners",
      closeness: "intimacy",
      connectionSummary: "relationship intelligence",
      guidanceFocus: "strengthen emotional attunement, repair speed, and secure bonding habits",
      sourceReferences: [
        { title: "The Gottman Institute", url: "https://www.gottman.com" },
        { title: "APA: Relationships", url: "https://www.apa.org/topics/relationships" },
      ],
    },
    committed_relationship: {
      type,
      typeLabel: "Committed Relationship",
      bond: "committed relationship",
      bondPlural: "committed relationships",
      counterpart: "partner",
      counterpartPlural: "partners",
      closeness: "emotional closeness",
      connectionSummary: "commitment intelligence",
      guidanceFocus: "protect trust, shared goals, and healthy conflict recovery in long-term partnership",
      sourceReferences: [
        { title: "The Gottman Institute", url: "https://www.gottman.com" },
        { title: "APA: Relationships", url: "https://www.apa.org/topics/relationships" },
      ],
    },
    marriage: {
      type,
      typeLabel: "Marriage",
      bond: "marriage",
      bondPlural: "marriages",
      counterpart: "spouse",
      counterpartPlural: "spouses",
      closeness: "marital closeness",
      connectionSummary: "marriage intelligence",
      guidanceFocus: "maintain shared meaning, emotional safety, and resilient repair under long-term stress",
      sourceReferences: [
        { title: "The Gottman Institute", url: "https://www.gottman.com" },
        { title: "APA: Relationships", url: "https://www.apa.org/topics/relationships" },
      ],
    },
    friendship: {
      type,
      typeLabel: "Friendship",
      bond: "friendship",
      bondPlural: "friendships",
      counterpart: "friend",
      counterpartPlural: "friends",
      closeness: "closeness",
      connectionSummary: "shared understanding",
      guidanceFocus: "increase reciprocity, responsiveness, and clear expectations to prevent drift and resentment",
      sourceReferences: [
        { title: "APA: Science Of Friendship", url: "https://www.apa.org/monitor/2023/06/cover-story-science-of-friendship" },
        { title: "Mayo Clinic: Friendships", url: "https://www.mayoclinic.org/healthy-lifestyle/adult-health/in-depth/friendships/art-20044860" },
      ],
    },
    family: {
      type,
      typeLabel: "Family",
      bond: "family connection",
      bondPlural: "family connections",
      counterpart: "family member",
      counterpartPlural: "family members",
      closeness: "trust and closeness",
      connectionSummary: "clearer support",
      guidanceFocus: "balance boundaries and closeness while reducing escalation loops in recurring family stress",
      sourceReferences: [
        { title: "APA: Families", url: "https://www.apa.org/topics/families" },
        { title: "AAMFT: Family Therapy", url: "https://www.aamft.org" },
      ],
    },
    colleague: {
      type,
      typeLabel: "Colleague",
      bond: "working relationship",
      bondPlural: "working relationships",
      counterpart: "colleague",
      counterpartPlural: "colleagues",
      closeness: "professional trust",
      connectionSummary: "collaboration intelligence",
      guidanceFocus: "improve role clarity, psychological safety, and feedback quality to protect collaboration under pressure",
      sourceReferences: [
        { title: "CDC NIOSH: Stress At Work", url: "https://www.cdc.gov/niosh/topics/stress" },
        { title: "APA: Healthy Workplaces", url: "https://www.apa.org/topics/healthy-workplaces" },
      ],
    },
    other: {
      type,
      typeLabel: "Other",
      bond: "connection",
      bondPlural: "connections",
      counterpart: "other person",
      counterpartPlural: "other people",
      closeness: "trust and connection",
      connectionSummary: "clearer understanding",
      guidanceFocus: "build explicit expectations, communication norms, and psychological safety for this unique connection",
      sourceReferences: [
        { title: "CDC: Social Connectedness", url: "https://www.cdc.gov/violenceprevention/about/social-connectedness.html" },
        { title: "APA: Relationships", url: "https://www.apa.org/topics/relationships" },
      ],
    },
  };

  return byType[type] || byType.other;
}

export function getRelationshipCoachLabel(activeRelationshipOrType) {
  const terms = getRelationshipTerms(activeRelationshipOrType);
  switch (terms.type) {
    case "committed_relationship":
      return "Committed Relationship Coach";
    case "marriage":
      return "Marriage Coach";
    case "friendship":
      return "Friendship Coach";
    case "family":
      return "Family Coach";
    case "colleague":
      return "Collaboration Coach";
    case "other":
      return "Connection Coach";
    case "romantic":
    default:
      return "Relationship Coach";
  }
}

export function replaceParticipantNames(text, participants = ["Tony", "Drew"]) {
  if (!text) return text;
  const [primaryPerson = "Person A", secondaryPerson = "Other Person"] = participants;
  const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const apply = (input, pattern, replacement) =>
    input.replace(pattern, (match) => matchCase(match, replacement));

  let next = String(text);
  next = apply(next, /\bTony\s*&\s*Drew\b/gi, `${primaryPerson} & ${secondaryPerson}`);
  next = apply(next, /\bTony→Drew\b/gi, `${primaryPerson}→${secondaryPerson}`);
  next = apply(next, /\bDrew→Tony\b/gi, `${secondaryPerson}→${primaryPerson}`);
  next = apply(next, /\bTony\+Drew\b/gi, `${primaryPerson}+${secondaryPerson}`);
  next = apply(next, /\bTony\b/gi, primaryPerson);
  next = apply(next, /\bDrew\b/gi, secondaryPerson);

  const duplicateCommaPattern = new RegExp(
    `\\b(${escapeRegex(primaryPerson)}|${escapeRegex(secondaryPerson)})\\b\\s*,\\s*\\1\\b`,
    "gi",
  );
  next = next.replace(duplicateCommaPattern, "$1");

  const duplicateArrowPattern = new RegExp(
    `\\b(${escapeRegex(primaryPerson)}|${escapeRegex(secondaryPerson)})\\b\\s*→\\s*\\1\\b`,
    "gi",
  );
  next = next.replace(duplicateArrowPattern, "$1");

  return next;
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
    [/\bhusbands\b/gi, terms.counterpartPlural],
    [/\bhusband\b/gi, terms.counterpart],
    [/\bwives\b/gi, terms.counterpartPlural],
    [/\bwife\b/gi, terms.counterpart],
    [/\bboyfriends\b/gi, terms.counterpartPlural],
    [/\bboyfriend\b/gi, terms.counterpart],
    [/\bgirlfriends\b/gi, terms.counterpartPlural],
    [/\bgirlfriend\b/gi, terms.counterpart],
    [/\bspouses\b/gi, terms.counterpartPlural],
    [/\bspouse\b/gi, terms.counterpart],
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
    collectRelationshipNames(relationship)
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

export function containsRelationshipTypeLeakage(text, activeRelationshipOrType) {
  if (!text) return false;
  const type = normalizeRelationshipType(activeRelationshipOrType);
  const normalizedText = String(text);
  const romanticPatterns = [
    /\bhusband(?:s)?\b/i,
    /\bwife|wives\b/i,
    /\bboyfriend(?:s)?\b/i,
    /\bgirlfriend(?:s)?\b/i,
    /\bspouse(?:s)?\b/i,
    /\bfianc(?:e|é|és|ées)\b/i,
    /\bdating\b/i,
    /\bromantic\b/i,
    /\bsexual\b/i,
    /\bsex\b/i,
    /\bcouple(?:s)?\b/i,
  ];
  const friendshipPatterns = [/\bfriend(?:s|ship)?\b/i, /\bbestie\b/i, /\bhang out\b/i];
  const familyPatterns = [/\bmother\b/i, /\bfather\b/i, /\bparent(?:s)?\b/i, /\bsibling(?:s)?\b/i, /\bfamily\b/i];
  const colleaguePatterns = [/\bcolleague(?:s)?\b/i, /\bcoworker(?:s)?\b/i, /\bworkplace\b/i, /\bmanager\b/i, /\bprofessional\b/i];

  if (["romantic", "committed_relationship", "marriage"].includes(type)) {
    return false;
  }

  if (type === "friendship") {
    return romanticPatterns.some((pattern) => pattern.test(normalizedText)) || colleaguePatterns.some((pattern) => pattern.test(normalizedText));
  }

  if (type === "family") {
    return romanticPatterns.some((pattern) => pattern.test(normalizedText)) || colleaguePatterns.some((pattern) => pattern.test(normalizedText));
  }

  if (type === "colleague") {
    return romanticPatterns.some((pattern) => pattern.test(normalizedText)) || familyPatterns.some((pattern) => pattern.test(normalizedText));
  }

  if (type === "other") {
    return romanticPatterns.some((pattern) => pattern.test(normalizedText));
  }

  return false;
}

export function isTextVisibleForRelationshipContext(text, foreignNames = [], activeRelationshipOrType) {
  if (!text) return true;
  return (
    !containsForeignParticipantNames(text, foreignNames) &&
    !containsRelationshipTypeLeakage(text, activeRelationshipOrType)
  );
}

export function buildActiveConnectionContext({
  pairId,
  activeConnectionId,
  activeRelationship,
  actorUser,
  targetUser,
  allowedPeople = [],
  forbiddenPeople = [],
  availableDataSources = [],
} = {}) {
  const terms = getRelationshipTerms(activeRelationship);
  return {
    pairId: String(pairId || activeConnectionId || activeRelationship?.id || ""),
    activeConnectionId: String(activeConnectionId || activeRelationship?.id || ""),
    relationshipStatus: terms.type,
    relationshipStatusLabel: terms.typeLabel,
    actorUser: actorUser || "",
    targetUser: targetUser || "",
    allowedPeople: [...new Set((allowedPeople || []).filter(Boolean))],
    forbiddenPeople: [...new Set((forbiddenPeople || []).filter(Boolean))],
    availableDataSources: [...new Set((availableDataSources || []).filter(Boolean))],
    connectionLabel: activeRelationship?.name || "",
  };
}

export function buildActiveConnectionContextBlock(context = {}) {
  return `ACTIVE CONNECTION CONTEXT:
pairId: ${context.pairId || ""}
connectionLabel: ${context.connectionLabel || ""}
relationshipStatus: ${context.relationshipStatusLabel || context.relationshipStatus || "Other"}
actorUser: ${context.actorUser || ""}
targetUser: ${context.targetUser || ""}
allowedPeople: ${(context.allowedPeople || []).join(", ")}
forbiddenPeople: ${(context.forbiddenPeople || []).join(", ")}
availableDataSources: ${(context.availableDataSources || []).join(", ")}

STRICT RULES:
- Only use data from this pairId.
- Only refer to people listed in allowedPeople.
- Never refer to forbiddenPeople.
- Match tone, questions, analysis, and guidance to relationshipStatus.
- If content appears to come from another pairing, discard it.
- If data is missing, say the system does not yet have enough information for this connection.`;
}

export function validateOutputScope(output, context = {}) {
  const text = String(output || "");
  const violations = [];

  if (!text.trim()) {
    violations.push("empty_output");
  }

  if (containsForeignParticipantNames(text, context.forbiddenPeople || [])) {
    violations.push("forbidden_people_mentioned");
  }

  if (containsRelationshipTypeLeakage(text, context.relationshipStatus || "other")) {
    violations.push("relationship_status_language_mismatch");
  }

  const allowedPeople = context.allowedPeople || [];
  if (allowedPeople.length) {
    const capitalizedTokens = text.match(/\b[A-Z][a-z]{2,}\b/g) || [];
    const unknownPeople = [...new Set(capitalizedTokens)].filter(
      (name) => !allowedPeople.includes(name) && !(context.forbiddenPeople || []).includes(name),
    );
    if (unknownPeople.length > 0) {
      violations.push("unknown_people_referenced");
    }
  }

  return {
    ok: violations.length === 0,
    violations,
  };
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
