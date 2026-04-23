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
    Tony: `${primaryPerson} (Individual)`,
    Drew: `${secondaryPerson} (Individual)`,
    "Tony→Drew": `${primaryPerson} → ${secondaryPerson}`,
    "Drew→Tony": `${secondaryPerson} → ${primaryPerson}`,
    "Tony+Drew": `${primaryPerson} & ${secondaryPerson}`,
  };
}

export function getDisplayPerspective(value, participants = ["Tony", "Drew"]) {
  const labels = getPerspectiveLabels(participants);
  return labels[value] || getDisplayLabel(value);
}

export function replaceParticipantNames(text, participants = ["Tony", "Drew"]) {
  if (!text) return text;
  const [primaryPerson = "Tony", secondaryPerson = "Drew"] = participants;
  return String(text)
    .replace(/\bTony\b/g, primaryPerson)
    .replace(/\bDrew\b/g, secondaryPerson)
    .replace(/\bTony & Drew\b/g, `${primaryPerson} & ${secondaryPerson}`);
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
