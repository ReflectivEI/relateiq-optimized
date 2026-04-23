export type PersonId = string;
export type RelationshipType = "romantic" | "friendship" | "family" | "other";

export type User = {
  id: string;
  email: string;
  password_hash: string;
  name: string;
};

export type PublicUser = Omit<User, "password_hash">;

export type Relationship = {
  id: string;
  name: string;
  type: RelationshipType;
  participants: string[];
  created_at: string;
  updated_at: string;
};

export type RelationshipMembership = {
  id: string;
  relationship_id: string;
  user_id: string;
  role?: "owner" | "participant";
};

export type RelationshipInviteStatus = "pending" | "accepted" | "expired";

export type RelationshipInvite = {
  id: string;
  relationship_id: string;
  invited_email: string;
  invited_name?: string;
  provisional_user_id?: string;
  invite_token: string;
  status: RelationshipInviteStatus;
  created_at: string;
  expires_at: string;
};

export type RelationshipOnboarding = {
  id: string;
  relationship_id: string;
  user_id: string;
  self_description: string;
  support_style: string;
  support_notes: string;
  communication_note: string;
  skipped: boolean;
  created_at: string;
  updated_at: string;
};

export type RelationshipSummary = Relationship & {
  member_count: number;
  participant_names: string[];
  needs_onboarding: boolean;
  needs_questionnaire: boolean;
  current_person_name: string;
  current_user_role: "owner" | "participant";
};

export type InviteLookupResult = {
  invite: RelationshipInvite;
  relationship: RelationshipSummary;
  inviter: PublicUser | null;
  already_member: boolean;
};

export type FtueChoice =
  | "something_happened_recently"
  | "understand_them_better"
  | "help_communicating";

export type FtueAction =
  | "viewed"
  | "completed"
  | "entered_text"
  | "explained"
  | "saved"
  | "try_another"
  | "continue_play_lab"
  | "returned";

export type FtueSession = {
  id: string;
  relationship_id: string;
  user_id: string;
  choice: FtueChoice;
  input_text: string;
  created_at: string;
  context_object: {
    module: "start_here";
    relationship_id: string;
    user_id: string;
    choice: FtueChoice;
    created_at: string;
    relationship_type: RelationshipType;
  };
  result: {
    underneath: string;
    each_person: string[];
    risk: string;
    next_step: string;
    example_phrase: string;
    note: string;
  };
};

export type FtueEvent = {
  id: string;
  relationship_id: string;
  user_id: string;
  action: FtueAction;
  session_id?: string;
  input_present: boolean;
  created_at: string;
  metadata?: Record<string, string | boolean | number>;
};

export type ProfileSummary = {
  relationship_id: string;
  person: PersonId;
  relationshipRole: string;
  communicationStyle: string;
  likelyNeedsUnderStress: string[];
  repairPreferences: string[];
  appreciationLanguage: string[];
  summary: string;
};

export type QuestionnaireSummary = {
  relationship_id: string;
  person: PersonId;
  totalQuestions: number;
  importedQuestions: number;
  sourceFile: string;
  importReady: boolean;
  notes: string[];
  uploadedAt?: string;
  fileName?: string;
};

export type TriggerEntry = {
  relationship_id: string;
  id: string;
  owner: PersonId | "Tony_Drew";
  title: string;
  description: string;
  commonReaction: string;
  whatHelps: string;
  whatWorsens: string;
  confidence: "low" | "medium" | "high";
  confirmed: boolean;
};

export type InsightCard = {
  relationship_id: string;
  id: string;
  title: string;
  body: string;
  scope: PersonId | "Tony_Drew";
  theme: "communication" | "repair" | "timing" | "questionnaire";
};

export type ToolCard = {
  relationship_id: string;
  id: string;
  name: string;
  purpose: string;
  route: string;
};

export type AppState = {
  relationship_id: string;
  relationship: Relationship;
  productName: string;
  migrationState: string;
  questionnaireImported: boolean;
  profiles: ProfileSummary[];
  questionnaires: QuestionnaireSummary[];
  triggers: TriggerEntry[];
  insights: InsightCard[];
  tools: ToolCard[];
};

export type UploadedQuestionnaire = {
  relationship_id?: string;
  person: PersonId;
  fileName: string;
  uploadedAt: string;
  responses: Array<Record<string, unknown>>;
  raw: Record<string, unknown> | Array<Record<string, unknown>>;
};

export const DEFAULT_RELATIONSHIP_ID = "relationship_tony_drew_romantic";
export const DEFAULT_USER_ID = "tony";

const CREATED_AT = "2026-04-22T00:00:00.000Z";
const INVITE_EXPIRY_MS = 1000 * 60 * 60 * 24 * 7;

function nowIso() {
  return new Date().toISOString();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function randomId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export const RELATEIQ_USERS: User[] = [
  {
    id: "tony",
    email: "tony@relateiq.local",
    password_hash: "76abba09c26cfdefadd7c46de0ad992a4521f94270964afc59db2e9def71d37d",
    name: "Tony",
  },
  {
    id: "drew",
    email: "drew@relateiq.local",
    password_hash: "b09d0d91b793290b0047a42a5b8f5e3d47e30818112a3145a7a4ff889a520229",
    name: "Drew",
  },
];

export const RELATEIQ_RELATIONSHIPS: Relationship[] = [
  {
    id: DEFAULT_RELATIONSHIP_ID,
    name: "Tony & Drew",
    type: "romantic",
    participants: ["Tony", "Drew"],
    created_at: CREATED_AT,
    updated_at: CREATED_AT,
  },
  {
    id: "relationship_tony_drew_friendship",
    name: "Tony & Drew — Friendship Lens",
    type: "friendship",
    participants: ["Tony", "Drew"],
    created_at: CREATED_AT,
    updated_at: CREATED_AT,
  },
];

export const RELATEIQ_MEMBERSHIPS: RelationshipMembership[] = [
  {
    id: "membership_tony_romantic",
    relationship_id: DEFAULT_RELATIONSHIP_ID,
    user_id: "tony",
    role: "owner",
  },
  {
    id: "membership_drew_romantic",
    relationship_id: DEFAULT_RELATIONSHIP_ID,
    user_id: "drew",
    role: "participant",
  },
  {
    id: "membership_tony_friendship",
    relationship_id: "relationship_tony_drew_friendship",
    user_id: "tony",
    role: "owner",
  },
  {
    id: "membership_drew_friendship",
    relationship_id: "relationship_tony_drew_friendship",
    user_id: "drew",
    role: "participant",
  },
];

export const RELATEIQ_INVITES: RelationshipInvite[] = [];
export const RELATEIQ_ONBOARDING: RelationshipOnboarding[] = [];
export const RELATEIQ_FTUE_SESSIONS: FtueSession[] = [];
export const RELATEIQ_FTUE_EVENTS: FtueEvent[] = [];

const BASE_PROFILES: Omit<ProfileSummary, "relationship_id">[] = [
  {
    person: "Tony",
    relationshipRole: "Partner",
    communicationStyle: "Direct, fast-moving, clarity-seeking",
    likelyNeedsUnderStress: [
      "Clear signals instead of ambiguity",
      "A concrete next step",
      "Respect for urgency without escalation",
    ],
    repairPreferences: [
      "Name the issue plainly",
      "Own impact quickly",
      "Move toward a specific repair action",
    ],
    appreciationLanguage: ["Verbal affirmation", "Acts of service"],
    summary:
      "Tony appears to benefit from directness, calm structure, and visible follow-through after difficult moments.",
  },
  {
    person: "Drew",
    relationshipRole: "Partner",
    communicationStyle: "Reflective, emotionally textured, pace-sensitive",
    likelyNeedsUnderStress: [
      "A softer entry into hard topics",
      "Time to process before resolution pressure",
      "Signals of emotional safety",
    ],
    repairPreferences: [
      "Validation before problem-solving",
      "Gentle pacing",
      "Warm reassurance with room to respond",
    ],
    appreciationLanguage: ["Quality time", "Thoughtful words"],
    summary:
      "Drew appears to respond best when emotional context is acknowledged before logistics or solutions are introduced.",
  },
];

const BASE_QUESTIONNAIRES: Omit<QuestionnaireSummary, "relationship_id">[] = [
  {
    person: "Tony",
    totalQuestions: 94,
    importedQuestions: 0,
    sourceFile: "data/relateiq/tony.questionnaire.json",
    importReady: false,
    notes: [
      "Waiting for upload through the site or API.",
      "Once uploaded, this summary will update automatically from Cloudflare KV.",
    ],
  },
  {
    person: "Drew",
    totalQuestions: 94,
    importedQuestions: 0,
    sourceFile: "data/relateiq/drew.questionnaire.json",
    importReady: false,
    notes: [
      "Waiting for upload through the site or API.",
      "The frontend and worker expect a 94-question record.",
    ],
  },
];

const BASE_TRIGGERS: Omit<TriggerEntry, "relationship_id">[] = [
  {
    id: "timing-overload",
    owner: "Tony_Drew",
    title: "Bad timing compounds good intentions",
    description:
      "Difficult conversations land poorly when one person is rushed and the other wants depth.",
    commonReaction: "One person pushes for closure while the other pulls back.",
    whatHelps: "State capacity first and schedule the real conversation clearly.",
    whatWorsens: "Trying to force a complete resolution in the wrong moment.",
    confidence: "high",
    confirmed: true,
  },
  {
    id: "tone-vs-intent",
    owner: "Tony_Drew",
    title: "Intent is positive but tone feels sharp",
    description:
      "Problem-solving energy can sound dismissive even when the goal is repair.",
    commonReaction: "Defensiveness, shutdown, or debate over wording.",
    whatHelps: "Lead with acknowledgment before proposing any fix.",
    whatWorsens: "Jumping straight to logic or explaining why the tone was misunderstood.",
    confidence: "high",
    confirmed: true,
  },
  {
    id: "unfinished-loop",
    owner: "Drew",
    title: "Unfinished emotional loops linger",
    description:
      "When a conflict closes procedurally but not emotionally, it tends to resurface later.",
    commonReaction: "Distance, hesitation, or re-triggering around similar topics.",
    whatHelps: "Explicitly check whether the issue feels emotionally settled.",
    whatWorsens: "Assuming silence means resolution.",
    confidence: "medium",
    confirmed: true,
  },
];

const BASE_INSIGHTS: Omit<InsightCard, "relationship_id">[] = [
  {
    id: "insight-1",
    title: "RelateIQ now runs on a direct GitHub and Cloudflare architecture",
    body:
      "GitHub is the source of truth and Cloudflare is the runtime. The app uses its own worker endpoints and Cloudflare KV questionnaire storage.",
    scope: "Tony_Drew",
    theme: "questionnaire",
  },
  {
    id: "insight-2",
    title: "Repair improves when pacing is explicit",
    body:
      "The strongest shared pattern so far is pacing mismatch. Naming whether this is a quick reassurance, a processing pause, or a full repair talk prevents escalation.",
    scope: "Tony_Drew",
    theme: "repair",
  },
  {
    id: "insight-3",
    title: "Questionnaire import is the next personalization unlock",
    body:
      "As soon as the Tony and Drew 94-question JSON files are dropped into the expected path, the worker can summarize themes and make coaching more specific.",
    scope: "Tony_Drew",
    theme: "questionnaire",
  },
];

const BASE_TOOLS: Omit<ToolCard, "relationship_id">[] = [
  {
    id: "coach",
    name: "Conversation Coach",
    purpose: "Draft a response that fits both people more cleanly.",
    route: "/coach",
  },
  {
    id: "check-in",
    name: "Check-In",
    purpose: "Capture current emotional temperature and what needs attention.",
    route: "/check-in",
  },
  {
    id: "repair",
    name: "Repair Planner",
    purpose: "Generate a repair approach after conflict or disconnection.",
    route: "/repair",
  },
];

function buildEmptyProfile(relationshipId: string, person: string, relationshipType: RelationshipType): ProfileSummary {
  return {
    relationship_id: relationshipId,
    person,
    relationshipRole: relationshipType === "friendship" ? "Friend" : "Participant",
    communicationStyle: "Still learning from onboarding and future sessions",
    likelyNeedsUnderStress: [
      "Complete the quick onboarding to seed support preferences",
      "Use check-ins to capture live needs over time",
    ],
    repairPreferences: [
      "No repair preferences recorded yet",
      "Future sessions will make this more specific",
    ],
    appreciationLanguage: ["Not captured yet"],
    summary:
      `${person}'s relationship profile starts empty in this connection and will grow only from onboarding responses, future sessions, and relationship-specific memory.`,
  };
}

function buildEmptyQuestionnaire(relationshipId: string, person: string): QuestionnaireSummary {
  return {
    relationship_id: relationshipId,
    person,
    totalQuestions: 94,
    importedQuestions: 0,
    sourceFile: "",
    importReady: false,
    notes: [
      "No questionnaire file imported yet for this relationship participant.",
      "This relationship starts with clean, isolated data.",
    ],
  };
}

function cloneRelationshipState(
  relationship: Relationship,
  options?: {
    migrationState?: string;
    insights?: Omit<InsightCard, "relationship_id">[];
    triggers?: Omit<TriggerEntry, "relationship_id">[];
    profiles?: Omit<ProfileSummary, "relationship_id">[];
    questionnaires?: Omit<QuestionnaireSummary, "relationship_id">[];
  },
): AppState {
  return {
    relationship_id: relationship.id,
    relationship,
    productName: "RelateIQ",
    migrationState:
      options?.migrationState ||
      "Running on a GitHub-managed frontend with a Cloudflare backend",
    questionnaireImported: false,
    profiles: (options?.profiles || BASE_PROFILES).map((profile) => ({
      ...profile,
      relationship_id: relationship.id,
    })),
    questionnaires: (options?.questionnaires || BASE_QUESTIONNAIRES).map((questionnaire) => ({
      ...questionnaire,
      relationship_id: relationship.id,
    })),
    triggers: (options?.triggers || BASE_TRIGGERS).map((trigger) => ({
      ...trigger,
      relationship_id: relationship.id,
    })),
    insights: (options?.insights || BASE_INSIGHTS).map((insight) => ({
      ...insight,
      relationship_id: relationship.id,
    })),
    tools: BASE_TOOLS.map((tool) => ({
      ...tool,
      relationship_id: relationship.id,
    })),
  };
}

export const RELATEIQ_STATES: Record<string, AppState> = {
  [DEFAULT_RELATIONSHIP_ID]: cloneRelationshipState(RELATEIQ_RELATIONSHIPS[0]),
  relationship_tony_drew_friendship: cloneRelationshipState(RELATEIQ_RELATIONSHIPS[1], {
    migrationState:
      "Friendship-specific RelateIQ context with isolated memory, coaching, and insights.",
    insights: [
      {
        id: "friendship-insight-1",
        title: "Support improves when expectations are named explicitly",
        body:
          "In friendship mode, clarity about bandwidth and responsiveness matters more than assuming a romantic-style repair cadence.",
        scope: "Tony_Drew",
        theme: "communication",
      },
      {
        id: "friendship-insight-2",
        title: "Check-ins work better when they are lighter-weight",
        body:
          "This context benefits from lower-pressure check-ins focused on support, timing, and respect for current life load.",
        scope: "Tony_Drew",
        theme: "timing",
      },
    ],
    triggers: [
      {
        id: "friendship-overload",
        owner: "Tony_Drew",
        title: "Assumed availability creates friction",
        description:
          "Both people can misread delayed responses as relational distance when the real issue is bandwidth.",
        commonReaction: "Over-interpretation of response speed.",
        whatHelps: "Name availability and preferred follow-up time.",
        whatWorsens: "Expecting immediate emotional access.",
        confidence: "medium",
        confirmed: true,
      },
    ],
  }),
};

export const RELATEIQ_STATE = RELATEIQ_STATES[DEFAULT_RELATIONSHIP_ID];

function ensureStateParticipant(state: AppState, person: string) {
  if (!state.profiles.some((profile) => profile.person === person)) {
    state.profiles.push(buildEmptyProfile(state.relationship_id, person, state.relationship.type));
  }
  if (!state.questionnaires.some((questionnaire) => questionnaire.person === person)) {
    state.questionnaires.push(buildEmptyQuestionnaire(state.relationship_id, person));
  }
}

export function sanitizeUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

export function getUserByEmail(email: string) {
  return RELATEIQ_USERS.find((user) => user.email.toLowerCase() === email.toLowerCase()) || null;
}

export function getUserById(id: string) {
  return RELATEIQ_USERS.find((user) => user.id === id) || null;
}

export function getRelationship(id: string) {
  const relationship = RELATEIQ_RELATIONSHIPS.find((candidate) => candidate.id === id) || null;
  if (!relationship) return null;
  const parsedNames = relationship.name
    .trim()
    .replace(/\s+[·•|-]\s+(romantic|friendship|family|other)$/i, "")
    .replace(/\s+—\s+(friendship lens|romantic lens|family lens)$/i, "")
    .split(/\s*(?:&|and|\/|\+)\s*/i)
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 2);
  const current = (relationship.participants || []).map((value) => value.trim()).filter(Boolean);
  const currentIsLegacyPair =
    current.length === 2 &&
    current.some((name) => name.toLowerCase() === "tony") &&
    current.some((name) => name.toLowerCase() === "drew");
  const parsedIsDifferentPair =
    parsedNames.length === 2 &&
    parsedNames.join("|").toLowerCase() !== "tony|drew" &&
    parsedNames.join("|").toLowerCase() !== "drew|tony";
  if (parsedNames.length === 2 && (current.length !== 2 || (currentIsLegacyPair && parsedIsDifferentPair))) {
    relationship.participants = parsedNames;
    relationship.updated_at = nowIso();
  }
  return relationship;
}

export function getRelationshipMembershipsForUser(userId: string) {
  return RELATEIQ_MEMBERSHIPS.filter((membership) => membership.user_id === userId);
}

export function getRelationshipMembers(relationshipId: string) {
  return RELATEIQ_MEMBERSHIPS.filter((membership) => membership.relationship_id === relationshipId)
    .map((membership) => getUserById(membership.user_id))
    .filter(Boolean)
    .map((user) => sanitizeUser(user!));
}

export function getLatestOnboardingForUser(relationshipId: string, userId: string) {
  return RELATEIQ_ONBOARDING.filter(
    (entry) => entry.relationship_id === relationshipId && entry.user_id === userId,
  )
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0] || null;
}

function getMembershipForUser(relationshipId: string, userId: string) {
  return (
    RELATEIQ_MEMBERSHIPS.find(
      (membership) => membership.relationship_id === relationshipId && membership.user_id === userId,
    ) || null
  );
}

function inferRelationshipRole(relationship: Relationship, userId: string) {
  const membership = getMembershipForUser(relationship.id, userId);
  if (membership?.role === "owner") return "owner";

  const memberships = RELATEIQ_MEMBERSHIPS.filter((entry) => entry.relationship_id === relationship.id);
  const hasOwner = memberships.some((entry) => entry.role === "owner");
  const currentUser = getUserById(userId);
  const firstParticipant = relationship.participants?.[0]?.trim().toLowerCase();
  const currentName = currentUser?.name?.trim().toLowerCase();

  if (!hasOwner && currentUser && firstParticipant && firstParticipant === currentName) {
    return "owner";
  }

  if (
    currentUser?.id === "tony" &&
    (relationship.id === DEFAULT_RELATIONSHIP_ID || relationship.id === "relationship_tony_drew_friendship")
  ) {
    return "owner";
  }

  return membership?.role || "participant";
}

function inferCurrentPersonName(relationship: Relationship, userId: string, participantNames: string[]) {
  const currentUser = getUserById(userId);
  if (!currentUser) return participantNames[0] || "Tony";
  const exact = participantNames.find(
    (participant) => participant.trim().toLowerCase() === currentUser.name.trim().toLowerCase(),
  );
  return exact || participantNames[0] || currentUser.name || "Tony";
}

function countQuestionnaireResponsesForPerson(relationshipId: string, personName: string) {
  const state = RELATEIQ_STATES[relationshipId];
  const normalized = personName.trim().toLowerCase();
  const summary = state?.questionnaires?.find((entry) => entry.person.trim().toLowerCase() === normalized);
  return summary?.importedQuestions || 0;
}

function buildRelationshipSummary(relationship: Relationship, userId: string): RelationshipSummary {
  const members = getRelationshipMembers(relationship.id);
  const participantNames =
    relationship.participants?.length >= 2
      ? relationship.participants
      : Array.from(new Set([...(relationship.participants || []), ...members.map((member) => member.name)]));
  const currentPersonName = inferCurrentPersonName(relationship, userId, participantNames);
  const currentUser = getUserById(userId);
  const memberCount =
    members.length ||
    (currentUser && participantNames.some((participant) => participant.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
      ? 1
      : 0);
  return {
    ...relationship,
    member_count: memberCount,
    participant_names: participantNames,
    needs_onboarding: !getLatestOnboardingForUser(relationship.id, userId),
    needs_questionnaire: countQuestionnaireResponsesForPerson(relationship.id, currentPersonName) < 94,
    current_person_name: currentPersonName,
    current_user_role: inferRelationshipRole(relationship, userId),
  };
}

export function getRelationshipsForUser(userId: string): RelationshipSummary[] {
  const allowed = new Set(
    RELATEIQ_MEMBERSHIPS.filter((membership) => membership.user_id === userId).map(
      (membership) => membership.relationship_id,
    ),
  );
  return RELATEIQ_RELATIONSHIPS
    .filter((relationship) => allowed.has(relationship.id))
    .map((relationship) => getRelationship(relationship.id))
    .filter(Boolean)
    .map((relationship) => buildRelationshipSummary(relationship!, userId));
}

export function getRelationshipState(relationshipId: string): AppState | null {
  return RELATEIQ_STATES[relationshipId] || null;
}

export async function createUserAccount(input: {
  email: string;
  password: string;
  name: string;
}) {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  if (!email || !name || !input.password) {
    return { ok: false as const, error: "missing_required_fields" };
  }
  if (getUserByEmail(email)) {
    return { ok: false as const, error: "email_already_exists" };
  }

  const password_hash = await sha256Hex(input.password);
  const user: User = {
    id: randomId("user"),
    email,
    password_hash,
    name,
  };
  RELATEIQ_USERS.push(user);
  return { ok: true as const, user };
}

export function createRelationshipForUser(input: {
  creatorUserId: string;
  name: string;
  type: RelationshipType;
}) {
  const creator = getUserById(input.creatorUserId);
  if (!creator) return { ok: false as const, error: "creator_not_found" };

  const trimmedName = input.name.trim();
  if (!trimmedName) return { ok: false as const, error: "relationship_name_required" };

  const timestamp = nowIso();
  const relationship: Relationship = {
    id: `relationship_${slugify(trimmedName)}_${crypto.randomUUID().slice(0, 8)}`,
    name: trimmedName,
    type: input.type,
    participants: trimmedName
      .split(/\s*(?:&|and|\/|\+)\s*/i)
      .map((value) => value.trim())
      .filter(Boolean)
      .slice(0, 2),
    created_at: timestamp,
    updated_at: timestamp,
  };

  if (relationship.participants.length < 2) {
    relationship.participants = [creator.name, "Other Person"];
  }

  RELATEIQ_RELATIONSHIPS.push(relationship);
  RELATEIQ_MEMBERSHIPS.push({
    id: randomId("membership"),
    relationship_id: relationship.id,
    user_id: creator.id,
    role: "owner",
  });

  RELATEIQ_STATES[relationship.id] = {
    relationship_id: relationship.id,
    relationship,
    productName: "RelateIQ",
    migrationState: "Fresh relationship created with isolated intelligence and empty memory.",
    questionnaireImported: false,
    profiles: relationship.participants.map((participant) =>
      buildEmptyProfile(relationship.id, participant, input.type),
    ),
    questionnaires: relationship.participants.map((participant) =>
      buildEmptyQuestionnaire(relationship.id, participant),
    ),
    triggers: [],
    insights: [],
    tools: BASE_TOOLS.map((tool) => ({ ...tool, relationship_id: relationship.id })),
  };

  return {
    ok: true as const,
    relationship,
    summary: buildRelationshipSummary(relationship, creator.id),
  };
}

function getInviteStatus(invite: RelationshipInvite): RelationshipInviteStatus {
  if (invite.status === "accepted") return "accepted";
  if (new Date(invite.expires_at).getTime() < Date.now()) return "expired";
  return invite.status;
}

export function findInviteByToken(token: string) {
  const invite = RELATEIQ_INVITES.find((entry) => entry.invite_token === token);
  if (!invite) return null;
  invite.status = getInviteStatus(invite);
  return invite;
}

export async function createRelationshipInvite(input: {
  relationshipId: string;
  invitedEmail: string;
  invitedName?: string;
  provisionalPassword?: string;
}) {
  const relationship = getRelationship(input.relationshipId);
  if (!relationship) return { ok: false as const, error: "relationship_not_found" };

  const invited_email = input.invitedEmail.trim().toLowerCase();
  if (!invited_email) return { ok: false as const, error: "invite_email_required" };

  const inferredName =
    input.invitedName?.trim() ||
    invited_email.split("@")[0]
      ?.replace(/[._-]+/g, " ")
      ?.replace(/\b\w/g, (match) => match.toUpperCase())
      ?.trim();
  if (inferredName && relationship.participants.length < 2 && !relationship.participants.includes(inferredName)) {
    relationship.participants.push(inferredName);
    relationship.updated_at = nowIso();
  }

  let provisionalUser: User | null = null;
  if (input.provisionalPassword?.trim()) {
    const existing = getUserByEmail(invited_email);
    if (existing) {
      provisionalUser = existing;
    } else {
      const password_hash = await sha256Hex(input.provisionalPassword.trim());
      provisionalUser = {
        id: randomId("user"),
        email: invited_email,
        password_hash,
        name: inferredName || "Invited User",
      };
      RELATEIQ_USERS.push(provisionalUser);
    }
  }

  const existingPending = RELATEIQ_INVITES.find(
    (invite) =>
      invite.relationship_id === input.relationshipId &&
      invite.invited_email === invited_email &&
      getInviteStatus(invite) === "pending",
  );

  if (existingPending) {
    return {
      ok: true as const,
      invite: existingPending,
      reused: true,
    };
  }

  const created_at = nowIso();
  const invite: RelationshipInvite = {
    id: randomId("invite"),
    relationship_id: relationship.id,
    invited_email,
    invited_name: inferredName,
    provisional_user_id: provisionalUser?.id,
    invite_token: crypto.randomUUID().replace(/-/g, ""),
    status: "pending",
    created_at,
    expires_at: new Date(Date.now() + INVITE_EXPIRY_MS).toISOString(),
  };
  RELATEIQ_INVITES.push(invite);
  return {
    ok: true as const,
    invite,
    reused: false,
    provisionalUser: provisionalUser ? sanitizeUser(provisionalUser) : null,
  };
}

export function getInviteLookup(token: string, currentUserId?: string): InviteLookupResult | null {
  const invite = findInviteByToken(token);
  if (!invite) return null;
  const relationship = getRelationship(invite.relationship_id);
  if (!relationship) return null;
  const currentUser = currentUserId ? getUserById(currentUserId) : null;
  const already_member = !!currentUser &&
    RELATEIQ_MEMBERSHIPS.some(
      (membership) =>
        membership.relationship_id === relationship.id && membership.user_id === currentUser.id,
    );
  const inviterMembership = RELATEIQ_MEMBERSHIPS.find(
    (membership) => membership.relationship_id === relationship.id,
  );
  const inviter = inviterMembership ? getUserById(inviterMembership.user_id) : null;
  return {
    invite,
    relationship: buildRelationshipSummary(relationship, currentUser?.id || DEFAULT_USER_ID),
    inviter: inviter ? sanitizeUser(inviter) : null,
    already_member,
  };
}

export function acceptRelationshipInvite(input: { token: string; userId: string }) {
  const invite = findInviteByToken(input.token);
  if (!invite) return { ok: false as const, error: "invite_not_found" };
  if (invite.status === "expired") return { ok: false as const, error: "invite_expired" };

  const user = getUserById(input.userId);
  const relationship = getRelationship(invite.relationship_id);
  if (!user || !relationship) return { ok: false as const, error: "relationship_not_found" };

  const existingMembership = RELATEIQ_MEMBERSHIPS.find(
    (membership) =>
      membership.relationship_id === relationship.id && membership.user_id === user.id,
  );
  const alreadyMember = Boolean(existingMembership);

  if (!existingMembership) {
    RELATEIQ_MEMBERSHIPS.push({
      id: randomId("membership"),
      relationship_id: relationship.id,
      user_id: user.id,
      role: "participant",
    });
    if (relationship.participants.length < 2 && !relationship.participants.includes(user.name)) {
      relationship.participants.push(user.name);
      relationship.updated_at = nowIso();
    }

    const state = RELATEIQ_STATES[relationship.id];
    if (state) {
      ensureStateParticipant(state, user.name);
    }
  }

  invite.status = "accepted";

  return {
    ok: true as const,
    relationship,
    summary: buildRelationshipSummary(relationship, user.id),
    alreadyMember,
  };
}

export function submitRelationshipOnboarding(input: {
  relationshipId: string;
  userId: string;
  selfDescription: string;
  supportStyle: string;
  supportNotes: string;
  communicationNote: string;
  skipped?: boolean;
}) {
  const relationship = getRelationship(input.relationshipId);
  const user = getUserById(input.userId);
  if (!relationship || !user) {
    return { ok: false as const, error: "relationship_not_found" };
  }

  const entry: RelationshipOnboarding = {
    id: randomId("onboarding"),
    relationship_id: relationship.id,
    user_id: user.id,
    self_description: input.selfDescription.trim(),
    support_style: input.supportStyle.trim(),
    support_notes: input.supportNotes.trim(),
    communication_note: input.communicationNote.trim(),
    skipped: Boolean(input.skipped),
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  RELATEIQ_ONBOARDING.push(entry);

  const state = RELATEIQ_STATES[relationship.id];
  if (state) {
    ensureStateParticipant(state, user.name);
    state.profiles = state.profiles.map((profile) =>
      profile.person === user.name
        ? {
            ...profile,
            communicationStyle:
              entry.self_description || profile.communicationStyle,
            likelyNeedsUnderStress: entry.support_style
              ? [entry.support_style, ...(entry.support_notes ? [entry.support_notes] : [])]
              : profile.likelyNeedsUnderStress,
            summary:
              entry.communication_note || entry.self_description
                ? [entry.self_description, entry.communication_note]
                    .filter(Boolean)
                    .join(" ")
                : profile.summary,
          }
        : profile,
    );
  }

  return { ok: true as const, onboarding: entry };
}

export function getFtueState(relationshipId: string, userId: string) {
  const sessions = RELATEIQ_FTUE_SESSIONS.filter(
    (session) => session.relationship_id === relationshipId && session.user_id === userId,
  ).sort((a, b) => b.created_at.localeCompare(a.created_at));

  return {
    has_activation: sessions.length > 0,
    completed_count: sessions.length,
    latest_session: sessions[0] || null,
    next_step:
      sessions.length === 0
        ? "start_here"
        : sessions.length === 1
          ? "play_lab"
          : "questionnaire_and_insights",
  } as const;
}

export function buildFtueResponse(input: {
  relationshipId: string;
  userId: string;
  choice: FtueChoice;
  inputText: string;
}) {
  const relationship = getRelationship(input.relationshipId) || RELATEIQ_RELATIONSHIPS[0];
  const created_at = nowIso();

  const choiceCopy: Record<FtueChoice, FtueSession["result"]> = {
    something_happened_recently: {
      underneath:
        "There is probably a mix of practical tension and emotional meaning under the event. One person likely wants clarity quickly while the other wants emotional safety first.",
      each_person: [
        "One person may be tracking impact and tone more than logistics.",
        "The other may be trying to solve the situation but getting misread as dismissive or pressured.",
      ],
      risk: "The main risk is misreading urgency as criticism or silence as disconnection.",
      next_step:
        "Name what happened in one calm sentence, then ask what felt hardest before trying to fix it.",
      example_phrase:
        "I think the moment mattered more than the details. What part of it felt worst from your side?",
      note: "This helps the app learn how you both communicate.",
    },
    understand_them_better: {
      underneath:
        "There may be a support mismatch: what feels helpful to one person may feel pressuring or incomplete to the other.",
      each_person: [
        "One person may be seeking understanding or reflection first.",
        "The other may be offering speed, solutions, or reassurance too early.",
      ],
      risk: "The risk is repeated good intentions landing in the wrong order.",
      next_step:
        "Ask directly what kind of support would help most right now: listening, reassurance, space, or problem-solving.",
      example_phrase:
        "I want to understand you better here. What would help you feel most supported from me right now?",
      note: "This helps the app learn how you both communicate.",
    },
    help_communicating: {
      underneath:
        "The message likely needs softer pacing and clearer emotional context before the actual point lands well.",
      each_person: [
        "One person may need the message to feel safe before it feels useful.",
        "The other may be trying to be honest quickly without intending harshness.",
      ],
      risk: "The risk is that the tone or timing overwhelms the meaning you actually want to convey.",
      next_step:
        "Lead with shared intent, then say the core message simply, and keep the ask specific.",
      example_phrase:
        "I want to say this in a way that helps us feel closer, not more tense. Here’s what I’m trying to express...",
      note: "This helps the app learn how you both communicate.",
    },
  };

  const result = choiceCopy[input.choice];

  const session: FtueSession = {
    id: randomId("ftue"),
    relationship_id: relationship.id,
    user_id: input.userId,
    choice: input.choice,
    input_text: input.inputText.trim(),
    created_at,
    context_object: {
      module: "start_here",
      relationship_id: relationship.id,
      user_id: input.userId,
      choice: input.choice,
      created_at,
      relationship_type: relationship.type,
    },
    result,
  };
  RELATEIQ_FTUE_SESSIONS.push(session);
  return session;
}

export function buildFtueExplain(session: FtueSession) {
  return {
    session_id: session.id,
    summary:
      "This first response is designed to create value quickly without requiring a full questionnaire.",
    why_this_direction: [
      "It prioritizes likely emotional dynamics beneath the surface event.",
      "It offers one realistic next move instead of a heavy process.",
      "It starts building relationship-specific learning from your actual usage.",
    ],
    what_it_is_not:
      "This is not a final diagnosis of the relationship. It is an early, useful interpretation to help you take the next better step.",
  };
}

export function logFtueEvent(input: {
  relationshipId: string;
  userId: string;
  action: FtueAction;
  sessionId?: string;
  inputPresent: boolean;
  metadata?: Record<string, string | boolean | number>;
}) {
  RELATEIQ_FTUE_EVENTS.push({
    id: randomId("ftueevent"),
    relationship_id: input.relationshipId,
    user_id: input.userId,
    action: input.action,
    session_id: input.sessionId,
    input_present: input.inputPresent,
    created_at: nowIso(),
    metadata: input.metadata,
  });
}

function getPartnerInRelationship(relationshipId: string, speaker: PersonId): PersonId {
  const state = getRelationshipState(relationshipId) || RELATEIQ_STATE;
  const participants = state.profiles.map((profile) => profile.person);
  return participants.find((person) => person !== speaker) || participants[0] || speaker;
}

type CoachRequest = {
  relationshipId?: string;
  speaker: PersonId;
  topic: string;
  goal: string;
};

type RepairRequest = {
  relationshipId?: string;
  speaker: PersonId;
  issue: string;
  desiredOutcome: string;
};

type CheckInRequest = {
  relationshipId?: string;
  speaker: PersonId;
  mood: string;
  notes: string;
};

export function buildCoachResponse(input: CoachRequest) {
  const relationshipId = input.relationshipId || DEFAULT_RELATIONSHIP_ID;
  const state = getRelationshipState(relationshipId) || RELATEIQ_STATE;
  const speaker = state.profiles.find((profile) => profile.person === input.speaker) || state.profiles[0];
  const partner = state.profiles.find(
    (profile) => profile.person === getPartnerInRelationship(relationshipId, input.speaker),
  ) || state.profiles[1] || state.profiles[0];

  return {
    response:
      `${input.speaker}, open by naming the topic in one calm sentence, then show you understand ${partner.person}'s likely need for ${partner.likelyNeedsUnderStress[0].toLowerCase()}. ` +
      `After that, make one concrete ask tied to your goal: ${input.goal || "clarity and reconnection"}.`,
    suggestedOpeners: [
      `I want to talk about ${input.topic || "this"} in a way that feels clear and safe for both of us.`,
      `Before we solve anything, I want to make sure you feel understood about what happened.`,
      `My goal here is ${input.goal || "to reconnect, not to win the point"}.`,
    ],
    avoid: [
      "Leading with defense or explanation",
      "Turning tone feedback into a debate",
      "Trying to solve the whole issue in one pass if capacity is low",
    ],
    lens: {
      speakerStyle: speaker.communicationStyle,
      partnerStyle: partner.communicationStyle,
    },
  };
}

export function buildRepairResponse(input: RepairRequest) {
  const relationshipId = input.relationshipId || DEFAULT_RELATIONSHIP_ID;
  const state = getRelationshipState(relationshipId) || RELATEIQ_STATE;
  const partner =
    state.profiles.find((profile) => profile.person === getPartnerInRelationship(relationshipId, input.speaker)) ||
    state.profiles[0];

  return {
    summary:
      `Best next move: validate the impact of ${input.issue || "the conflict"}, then ask for a paced reset that supports ${partner.person}'s need for ${partner.likelyNeedsUnderStress[1]?.toLowerCase() || "emotional safety"}.`,
    scripts: [
      `I don't want to rush past what happened. I can see this affected us, and I want to repair it well.`,
      `I have thoughts on the practical side, but first I want to understand what felt hardest for you.`,
      `Would it feel better to talk for ten minutes now or set a real time later today so we can do this properly?`,
    ],
    avoid: [
      "Pressure for immediate resolution",
      "Minimizing the emotional residue",
      "Explaining intent before acknowledging impact",
    ],
    desiredOutcome: input.desiredOutcome || "reconnection with clearer pacing",
  };
}

export function buildCheckInResponse(input: CheckInRequest) {
  const relationshipId = input.relationshipId || DEFAULT_RELATIONSHIP_ID;
  const partner = getPartnerInRelationship(relationshipId, input.speaker);
  return {
    summary:
      `${input.speaker} is reporting ${input.mood || "mixed"} energy. The next best move is a low-pressure check-in with ${partner} that names capacity and what kind of support is needed.`,
    nextStep:
      `Try: "I'm at a ${input.mood || "mixed"} place right now and don't want to guess wrong. Do you need closeness, space, or a quick practical sync first?"`,
    notesEcho: input.notes || "No additional notes provided.",
  };
}
