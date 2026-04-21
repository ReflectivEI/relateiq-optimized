/**
 * PATTERN RULES — Explicit, deterministic rule map.
 * ─────────────────────────────────────────────────────────────────────────────
 * NO AI. NO randomness. Same inputs → same outputs always.
 *
 * Each rule:
 *   condition: (answer: string) => boolean
 *   trait:     one of the 8 locked traits
 *   weight:    integer delta applied to score
 *   label:     machine-readable rule identifier (snake_case)
 *   question_id: the source question
 */

export const PATTERN_RULES = [

  // ── COMMUNICATION EXPRESSIVENESS ────────────────────────────────────────────
  {
    trait: "communication_expressiveness",
    question_id: "c7",
    condition: (a) => a?.includes("directly and clearly"),
    weight: +2,
    label: "direct_communication_style",
  },
  {
    trait: "communication_expressiveness",
    question_id: "c7",
    condition: (a) => a?.includes("Drop hints"),
    weight: -2,
    label: "indirect_hint_dropping",
  },
  {
    trait: "communication_expressiveness",
    question_id: "c7",
    condition: (a) => a?.includes("Wait for them to ask"),
    weight: -2,
    label: "passive_wait_to_be_asked",
  },
  {
    trait: "communication_expressiveness",
    question_id: "c4",
    condition: (a) => a?.includes("Bring it up immediately"),
    weight: +2,
    label: "immediate_issue_surfacing",
  },
  {
    trait: "communication_expressiveness",
    question_id: "c4",
    condition: (a) => a?.includes("hope they notice"),
    weight: -2,
    label: "passive_hope_noticed",
  },
  {
    trait: "communication_expressiveness",
    question_id: "b1",
    condition: (a) => a?.includes("Express"),
    weight: +2,
    label: "expresses_frustration_openly",
  },
  {
    trait: "communication_expressiveness",
    question_id: "b1",
    condition: (a) => a?.includes("Withdraw") || a?.includes("quiet"),
    weight: -2,
    label: "withdraws_instead_of_expressing",
  },
  {
    trait: "communication_expressiveness",
    question_id: "c9",
    condition: (a) => parseInt(a) >= 4,
    weight: +2,
    label: "high_self_rated_expressiveness",
  },
  {
    trait: "communication_expressiveness",
    question_id: "c9",
    condition: (a) => parseInt(a) <= 2,
    weight: -2,
    label: "low_self_rated_expressiveness",
  },

  // ── CONFLICT AVOIDANCE ──────────────────────────────────────────────────────
  {
    trait: "conflict_avoidance",
    question_id: "cf1",
    condition: (a) => a?.includes("Deflect or change subject"),
    weight: +3,
    label: "deflects_conflict_topic",
  },
  {
    trait: "conflict_avoidance",
    question_id: "cf1",
    condition: (a) => a?.includes("Shut down"),
    weight: +2,
    label: "shuts_down_in_conflict",
  },
  {
    trait: "conflict_avoidance",
    question_id: "cf1",
    condition: (a) => a?.includes("Take space before engaging"),
    weight: +1,
    label: "takes_space_before_conflict",
  },
  {
    trait: "conflict_avoidance",
    question_id: "cf1",
    condition: (a) => a?.includes("Address it immediately"),
    weight: -2,
    label: "addresses_conflict_immediately",
  },
  {
    trait: "conflict_avoidance",
    question_id: "cf6",
    condition: (a) => parseInt(a) <= 2,
    weight: +2,
    label: "low_confrontation_comfort",
  },
  {
    trait: "conflict_avoidance",
    question_id: "cf6",
    condition: (a) => parseInt(a) >= 4,
    weight: -2,
    label: "high_confrontation_comfort",
  },
  {
    trait: "conflict_avoidance",
    question_id: "b3",
    condition: (a) => /avoid|space|quiet/i.test(a || ""),
    weight: +2,
    label: "avoidance_language_used",
  },
  {
    trait: "conflict_avoidance",
    question_id: "b3",
    condition: (a) => /address|confront/i.test(a || ""),
    weight: -1,
    label: "confrontation_language_used",
  },
  {
    trait: "conflict_avoidance",
    question_id: "f1",
    condition: (a) => a?.includes("Avoided at all costs"),
    weight: +2,
    label: "family_modeled_avoidance",
  },
  {
    trait: "conflict_avoidance",
    question_id: "f1",
    condition: (a) => a?.includes("Discussed openly"),
    weight: -2,
    label: "family_modeled_open_conflict",
  },

  // ── EMOTIONAL SENSITIVITY ──────────────────────────────────────────────────
  {
    trait: "emotional_sensitivity",
    question_id: "e6",
    condition: (a) => parseInt(a) >= 4,
    weight: +2,
    label: "high_tone_sensitivity",
  },
  {
    trait: "emotional_sensitivity",
    question_id: "e6",
    condition: (a) => parseInt(a) <= 2,
    weight: -2,
    label: "low_tone_sensitivity",
  },
  {
    trait: "emotional_sensitivity",
    question_id: "e7",
    condition: (a) => a?.includes("absorb it"),
    weight: +2,
    label: "absorbs_partner_stress",
  },
  {
    trait: "emotional_sensitivity",
    question_id: "e7",
    condition: (a) => a?.includes("unaffected"),
    weight: -2,
    label: "unaffected_by_partner_stress",
  },
  {
    trait: "emotional_sensitivity",
    question_id: "e4",
    condition: (a) => a?.includes("Any raised voice"),
    weight: +2,
    label: "triggered_by_raised_voice",
  },
  {
    trait: "emotional_sensitivity",
    question_id: "e4",
    condition: (a) => a?.includes("Dismissive") || a?.includes("Cold"),
    weight: +2,
    label: "triggered_by_dismissiveness",
  },
  {
    trait: "emotional_sensitivity",
    question_id: "en3",
    condition: (a) => parseInt(a) >= 4,
    weight: +1,
    label: "energy_strongly_affects_communication",
  },

  // ── NEED FOR VALIDATION ────────────────────────────────────────────────────
  {
    trait: "need_for_validation",
    question_id: "nv4",
    condition: (a) => parseInt(a) >= 4,
    weight: +2,
    label: "high_validation_priority",
  },
  {
    trait: "need_for_validation",
    question_id: "nv4",
    condition: (a) => parseInt(a) <= 2,
    weight: -2,
    label: "low_validation_priority",
  },
  {
    trait: "need_for_validation",
    question_id: "e1",
    condition: (a) => a?.includes("Assumptions about my feelings"),
    weight: +1,
    label: "triggered_by_assumptions",
  },
  {
    trait: "need_for_validation",
    question_id: "e1",
    condition: (a) => a?.includes("Dismissive tone"),
    weight: +1,
    label: "triggered_by_dismissive_tone",
  },
  {
    trait: "need_for_validation",
    question_id: "e1",
    condition: (a) => a?.includes("Not being asked") || a?.includes("minimized"),
    weight: +1,
    label: "triggered_by_not_being_asked",
  },
  {
    trait: "need_for_validation",
    question_id: "d9",
    condition: (a) => a?.includes("not a priority") || a?.includes("not being heard"),
    weight: +2,
    label: "interprets_behavior_as_not_heard",
  },
  {
    trait: "need_for_validation",
    question_id: "cf2",
    condition: (a) => a?.includes("To be heard without being interrupted"),
    weight: +1,
    label: "needs_uninterrupted_hearing",
  },

  // ── WITHDRAWAL TENDENCY ────────────────────────────────────────────────────
  {
    trait: "withdrawal_tendency",
    question_id: "d4",
    condition: (a) => a?.includes("Withdraw"),
    weight: +3,
    label: "withdraws_when_hurt",
  },
  {
    trait: "withdrawal_tendency",
    question_id: "d4",
    condition: (a) => a?.includes("Share immediately"),
    weight: -2,
    label: "shares_hurt_immediately",
  },
  {
    trait: "withdrawal_tendency",
    question_id: "s6",
    condition: (a) => a?.includes("Go quiet"),
    weight: +2,
    label: "goes_quiet_on_bad_days",
  },
  {
    trait: "withdrawal_tendency",
    question_id: "s6",
    condition: (a) => a?.includes("Talk about"),
    weight: -2,
    label: "talks_through_bad_days",
  },
  {
    trait: "withdrawal_tendency",
    question_id: "b4",
    condition: (a) => /quiet|withdraw/i.test(a || ""),
    weight: +2,
    label: "quiet_or_withdrawal_under_criticism",
  },
  {
    trait: "withdrawal_tendency",
    question_id: "b4",
    condition: (a) => a?.includes("Explain my side"),
    weight: -1,
    label: "explains_side_under_criticism",
  },
  {
    trait: "withdrawal_tendency",
    question_id: "nv3",
    condition: (a) => /quiet|internal|wall/i.test(a || ""),
    weight: +2,
    label: "internal_wall_when_disconnected",
  },

  // ── OPENNESS TO FEEDBACK ───────────────────────────────────────────────────
  {
    trait: "openness_to_feedback",
    question_id: "b4",
    condition: (a) => a?.includes("Explain my side"),
    weight: +2,
    label: "engages_with_feedback",
  },
  {
    trait: "openness_to_feedback",
    question_id: "b4",
    condition: (a) => a?.includes("defensive"),
    weight: -2,
    label: "defensive_under_feedback",
  },
  {
    trait: "openness_to_feedback",
    question_id: "cf11",
    condition: (a) => a?.includes("Try to change the behavior"),
    weight: +2,
    label: "acts_to_change_after_feedback",
  },
  {
    trait: "openness_to_feedback",
    question_id: "cf11",
    condition: (a) => a?.includes("Apologize"),
    weight: +1,
    label: "apologizes_after_wrong",
  },
  {
    trait: "openness_to_feedback",
    question_id: "d8",
    condition: (a) => /open|receptive|listen/i.test(a || ""),
    weight: +2,
    label: "self_describes_as_open_to_feedback",
  },
  {
    trait: "openness_to_feedback",
    question_id: "d8",
    condition: (a) => /defensive|shut down|resist/i.test(a || ""),
    weight: -2,
    label: "self_describes_as_defensive",
  },
  {
    trait: "openness_to_feedback",
    question_id: "f1",
    condition: (a) => a?.includes("Discussed openly"),
    weight: +1,
    label: "family_modeled_open_discussion",
  },

  // ── EMOTIONAL REGULATION ──────────────────────────────────────────────────
  {
    trait: "emotional_regulation",
    question_id: "cf8",
    condition: (a) => parseInt(a) >= 4,
    weight: +2,
    label: "fast_cool_down_after_conflict",
  },
  {
    trait: "emotional_regulation",
    question_id: "cf8",
    condition: (a) => parseInt(a) <= 2,
    weight: -2,
    label: "slow_cool_down_after_conflict",
  },
  {
    trait: "emotional_regulation",
    question_id: "b8",
    condition: (a) => a?.includes("Ask for help"),
    weight: +2,
    label: "seeks_support_when_overwhelmed",
  },
  {
    trait: "emotional_regulation",
    question_id: "b8",
    condition: (a) => a?.includes("Quietly drop"),
    weight: -2,
    label: "silently_abandons_when_overwhelmed",
  },
  {
    trait: "emotional_regulation",
    question_id: "en3",
    condition: (a) => parseInt(a) <= 2,
    weight: -2,
    label: "low_energy_heavily_impacts_communication",
  },
  {
    trait: "emotional_regulation",
    question_id: "en3",
    condition: (a) => parseInt(a) >= 4,
    weight: +1,
    label: "energy_communication_well_managed",
  },
  {
    trait: "emotional_regulation",
    question_id: "cf1",
    condition: (a) => a?.includes("Shut down"),
    weight: -2,
    label: "shuts_down_in_conflict",
  },

  // ── RELATIONAL DEPENDENCY ─────────────────────────────────────────────────
  {
    trait: "relational_dependency",
    question_id: "nv8",
    condition: (a) => /priority|same page|together/i.test(a || ""),
    weight: +2,
    label: "high_closeness_expectation",
  },
  {
    trait: "relational_dependency",
    question_id: "nv3",
    condition: (a) => /need|depend|can't/i.test(a || ""),
    weight: +2,
    label: "language_of_need_or_dependence",
  },
  {
    trait: "relational_dependency",
    question_id: "d9",
    condition: (a) => a?.includes("They don't care"),
    weight: +2,
    label: "interprets_distance_as_rejection",
  },
  {
    trait: "relational_dependency",
    question_id: "nv4",
    condition: (a) => parseInt(a) >= 4,
    weight: +1,
    label: "high_need_for_validation_signals_dependency",
  },
  {
    trait: "relational_dependency",
    question_id: "s5",
    condition: (a) => /together|you|partner/i.test(a || ""),
    weight: +2,
    label: "recharges_through_partner_connection",
  },
  {
    trait: "relational_dependency",
    question_id: "s5",
    condition: (a) => /alone|myself|solo/i.test(a || ""),
    weight: -2,
    label: "recharges_independently",
  },
];