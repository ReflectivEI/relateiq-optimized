/**
 * RelationshipTypeRegistry: Centralized configuration for each relationship type
 * 
 * Determines:
 * - Which frameworks are active
 * - Prompt variants for each feature
 * - Output schema validation
 * - UI labels and context
 * - Questionnaire structure
 */

export type RelationshipType = "partner" | "friend" | "family" | "colleague";
export type Framework = "gottman" | "eft" | "cbft" | "nvc" | "ifs" | "validation";

export interface PromptConfig {
  id: string;
  relationshipType: RelationshipType;
  frameworks: Framework[];
  contextLabel: string; // "romantic relationship" vs "professional relationship"
}

export interface RelationshipTypeConfig {
  id: RelationshipType;
  displayName: string;
  description: string;

  // Frameworks active for this type
  frameworks: {
    primary: Framework[];
    secondary?: Framework[];
  };

  // Prompt configuration
  prompts: {
    coach: PromptConfig;
    mirror: PromptConfig;
    deepAnalysis: PromptConfig;
    repairSuggestion: PromptConfig;
    beforeYouReact: PromptConfig;
  };

  // Questionnaire structure
  questionnaire: {
    sections: string[];
    profileFields: string[];
    excludeFields: string[];
  };

  // Output schema validation
  schema: {
    profileFieldsRequired: string[];
    insightsFieldsRequired: string[];
    repairFieldsRequired: string[];
  };

  // UI Configuration
  labels: {
    relationshipContext: string; // "romantic relationship" vs "working relationship"
    partnerLabel: string; // "Your partner" vs "Your colleague"
    intimacyContext: string; // used in prompts
    conflictContext: string; // "arguments" vs "disagreements"
  };

  // Constraints and guidelines
  constraints: {
    canHaveIntimacy: boolean;
    canHaveLongTermPlans: boolean;
    shouldUsePolarityFramework: boolean; // pursuer/withdrawer vs other models
    emphasizeBoundaries: boolean; // especially for colleague/family
  };
}

class RelationshipTypeRegistry {
  private static instance: RelationshipTypeRegistry;
  private configs = new Map<RelationshipType, RelationshipTypeConfig>();

  private constructor() {
    this.initializeConfigs();
  }

  static getInstance(): RelationshipTypeRegistry {
    if (!RelationshipTypeRegistry.instance) {
      RelationshipTypeRegistry.instance = new RelationshipTypeRegistry();
    }
    return RelationshipTypeRegistry.instance;
  }

  /**
   * Get configuration for a relationship type
   */
  getConfig(relationshipType: RelationshipType): RelationshipTypeConfig {
    const config = this.configs.get(relationshipType);
    if (!config) {
      throw new Error(`Unknown relationship type: ${relationshipType}`);
    }
    return Object.freeze(config);
  }

  /**
   * Get all registered types
   */
  getAllTypes(): RelationshipType[] {
    return Array.from(this.configs.keys());
  }

  /**
   * Validate data against relationship type schema
   */
  validateAgainstSchema(
    relationshipType: RelationshipType,
    data: Record<string, any>,
    schemaType: "profile" | "insights" | "repair"
  ): { valid: boolean; errors: string[] } {
    const config = this.getConfig(relationshipType);
    const schema = config.schema;
    const errors: string[] = [];

    const requiredFields =
      schemaType === "profile"
        ? schema.profileFieldsRequired
        : schemaType === "insights"
          ? schema.insightsFieldsRequired
          : schema.repairFieldsRequired;

    requiredFields.forEach((field) => {
      if (!data[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Register a custom relationship type (for extensibility)
   */
  registerCustomType(config: RelationshipTypeConfig): void {
    if (this.configs.has(config.id)) {
      throw new Error(`Relationship type already registered: ${config.id}`);
    }
    this.configs.set(config.id, config);
  }

  // ==================== PRIVATE INITIALIZATION ====================

  private initializeConfigs(): void {
    // PARTNER
    this.configs.set("partner", {
      id: "partner",
      displayName: "Romantic Partner",
      description: "Spouse, significant other, dating relationship",
      frameworks: {
        primary: ["gottman", "eft"],
        secondary: ["cbft", "nvc"],
      },
      prompts: {
        coach: {
          id: "coach-partner",
          relationshipType: "partner",
          frameworks: ["gottman", "eft"],
          contextLabel: "romantic relationship",
        },
        mirror: {
          id: "mirror-partner",
          relationshipType: "partner",
          frameworks: ["eft"],
          contextLabel: "romantic relationship",
        },
        deepAnalysis: {
          id: "analysis-partner",
          relationshipType: "partner",
          frameworks: ["gottman", "eft", "nvc"],
          contextLabel: "romantic relationship",
        },
        repairSuggestion: {
          id: "repair-partner",
          relationshipType: "partner",
          frameworks: ["gottman"],
          contextLabel: "romantic relationship",
        },
        beforeYouReact: {
          id: "byr-partner",
          relationshipType: "partner",
          frameworks: ["cbft", "polyvagal"],
          contextLabel: "romantic relationship",
        },
      },
      questionnaire: {
        sections: ["basics", "communication", "intimacy", "conflict", "values"],
        profileFields: [
          "communication_style",
          "emotional_needs",
          "love_language",
          "conflict_triggers",
          "intimacy_preferences",
        ],
        excludeFields: [
          "professional_goals",
          "work_stress",
          "colleague_dynamics",
        ],
      },
      schema: {
        profileFieldsRequired: [
          "communication_style",
          "emotional_needs",
          "conflict_triggers",
        ],
        insightsFieldsRequired: ["compatibility_score", "strengths", "risks"],
        repairFieldsRequired: ["situation", "repair_options"],
      },
      labels: {
        relationshipContext: "romantic relationship",
        partnerLabel: "Your partner",
        intimacyContext: "physical and emotional intimacy",
        conflictContext: "arguments",
      },
      constraints: {
        canHaveIntimacy: true,
        canHaveLongTermPlans: true,
        shouldUsePolarityFramework: true,
        emphasizeBoundaries: false,
      },
    });

    // COLLEAGUE
    this.configs.set("colleague", {
      id: "colleague",
      displayName: "Colleague",
      description: "Coworker, work relationship, professional partnership",
      frameworks: {
        primary: ["cbft", "nvc"],
        secondary: ["ifs"],
      },
      prompts: {
        coach: {
          id: "coach-colleague",
          relationshipType: "colleague",
          frameworks: ["cbft", "nvc"],
          contextLabel: "professional relationship",
        },
        mirror: {
          id: "mirror-colleague",
          relationshipType: "colleague",
          frameworks: ["nvc"],
          contextLabel: "professional relationship",
        },
        deepAnalysis: {
          id: "analysis-colleague",
          relationshipType: "colleague",
          frameworks: ["cbft", "nvc"],
          contextLabel: "professional relationship",
        },
        repairSuggestion: {
          id: "repair-colleague",
          relationshipType: "colleague",
          frameworks: ["nvc"],
          contextLabel: "professional relationship",
        },
        beforeYouReact: {
          id: "byr-colleague",
          relationshipType: "colleague",
          frameworks: ["cbft"],
          contextLabel: "professional relationship",
        },
      },
      questionnaire: {
        sections: [
          "basics",
          "communication",
          "collaboration",
          "conflict",
          "professionalism",
        ],
        profileFields: [
          "communication_style",
          "work_style",
          "role_clarity",
          "conflict_style",
          "professional_boundaries",
        ],
        excludeFields: [
          "intimacy_preferences",
          "love_language",
          "personal_values",
          "family_dynamics",
        ],
      },
      schema: {
        profileFieldsRequired: [
          "communication_style",
          "work_style",
          "role_clarity",
        ],
        insightsFieldsRequired: [
          "collaboration_score",
          "strengths",
          "areas_to_improve",
        ],
        repairFieldsRequired: ["situation", "boundary_options"],
      },
      labels: {
        relationshipContext: "professional relationship",
        partnerLabel: "Your colleague",
        intimacyContext: "professional trust and collaboration",
        conflictContext: "disagreements",
      },
      constraints: {
        canHaveIntimacy: false,
        canHaveLongTermPlans: false,
        shouldUsePolarityFramework: false,
        emphasizeBoundaries: true,
      },
    });

    // FRIEND
    this.configs.set("friend", {
      id: "friend",
      displayName: "Friend",
      description: "Friendship, close friend relationship",
      frameworks: {
        primary: ["nvc", "ifs"],
        secondary: ["cbft"],
      },
      prompts: {
        coach: {
          id: "coach-friend",
          relationshipType: "friend",
          frameworks: ["nvc", "ifs"],
          contextLabel: "friendship",
        },
        mirror: {
          id: "mirror-friend",
          relationshipType: "friend",
          frameworks: ["nvc"],
          contextLabel: "friendship",
        },
        deepAnalysis: {
          id: "analysis-friend",
          relationshipType: "friend",
          frameworks: ["nvc", "ifs"],
          contextLabel: "friendship",
        },
        repairSuggestion: {
          id: "repair-friend",
          relationshipType: "friend",
          frameworks: ["nvc"],
          contextLabel: "friendship",
        },
        beforeYouReact: {
          id: "byr-friend",
          relationshipType: "friend",
          frameworks: ["cbft", "ifs"],
          contextLabel: "friendship",
        },
      },
      questionnaire: {
        sections: [
          "basics",
          "communication",
          "support",
          "conflict",
          "shared_values",
        ],
        profileFields: [
          "communication_style",
          "support_style",
          "conflict_triggers",
          "values",
          "emotional_availability",
        ],
        excludeFields: ["work_dynamics", "professional_goals", "family_roles"],
      },
      schema: {
        profileFieldsRequired: [
          "communication_style",
          "support_style",
          "conflict_triggers",
        ],
        insightsFieldsRequired: ["compatibility_score", "strengths", "risks"],
        repairFieldsRequired: ["situation", "support_options"],
      },
      labels: {
        relationshipContext: "friendship",
        partnerLabel: "Your friend",
        intimacyContext: "emotional closeness and trust",
        conflictContext: "disagreements",
      },
      constraints: {
        canHaveIntimacy: false,
        canHaveLongTermPlans: true,
        shouldUsePolarityFramework: false,
        emphasizeBoundaries: true,
      },
    });

    // FAMILY
    this.configs.set("family", {
      id: "family",
      displayName: "Family Member",
      description: "Parent, sibling, extended family relationship",
      frameworks: {
        primary: ["ifs", "nvc"],
        secondary: ["cbft"],
      },
      prompts: {
        coach: {
          id: "coach-family",
          relationshipType: "family",
          frameworks: ["ifs", "nvc"],
          contextLabel: "family relationship",
        },
        mirror: {
          id: "mirror-family",
          relationshipType: "family",
          frameworks: ["nvc"],
          contextLabel: "family relationship",
        },
        deepAnalysis: {
          id: "analysis-family",
          relationshipType: "family",
          frameworks: ["ifs", "nvc"],
          contextLabel: "family relationship",
        },
        repairSuggestion: {
          id: "repair-family",
          relationshipType: "family",
          frameworks: ["nvc"],
          contextLabel: "family relationship",
        },
        beforeYouReact: {
          id: "byr-family",
          relationshipType: "family",
          frameworks: ["ifs", "cbft"],
          contextLabel: "family relationship",
        },
      },
      questionnaire: {
        sections: [
          "basics",
          "history",
          "communication",
          "roles",
          "conflict",
          "boundaries",
        ],
        profileFields: [
          "communication_style",
          "family_role",
          "conflict_triggers",
          "attachment_pattern",
          "boundary_needs",
        ],
        excludeFields: ["romantic_relationship", "intimacy_preferences"],
      },
      schema: {
        profileFieldsRequired: [
          "communication_style",
          "family_role",
          "conflict_triggers",
        ],
        insightsFieldsRequired: [
          "relationship_quality",
          "patterns",
          "concerns",
        ],
        repairFieldsRequired: ["situation", "boundary_options"],
      },
      labels: {
        relationshipContext: "family relationship",
        partnerLabel: "Your family member",
        intimacyContext: "emotional connection and trust",
        conflictContext: "conflicts",
      },
      constraints: {
        canHaveIntimacy: false,
        canHaveLongTermPlans: true,
        shouldUsePolarityFramework: false,
        emphasizeBoundaries: true,
      },
    });
  }
}

export const relationshipTypeRegistry = RelationshipTypeRegistry.getInstance();
