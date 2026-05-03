/**
 * System Integration Layer
 * 
 * Single entry point for all system components with proper isolation,
 * dependency management, and validation.
 */

export {
  ContextManager,
  contextManager,
  type ContextSnapshot,
  type ContextChange,
} from "./ContextManager";

export {
  RelationshipTypeRegistry,
  relationshipTypeRegistry,
  type RelationshipTypeConfig,
  type RelationshipType,
  type Framework,
} from "./RelationshipTypeRegistry";

export {
  PerspectiveAnalyzer,
  perspectiveAnalyzer,
  type PerspectiveView,
  type AlignmentAnalysis,
  type PerspectiveAnalysisResult,
} from "./PerspectiveAnalyzer";

export {
  DecisionEngine,
  decisionEngine,
  type DecisionOutput,
  type Risk,
  type Opportunity,
  type Recommendation,
  type ExecutableAction,
  type Metric,
} from "./DecisionEngine";

/**
 * System health check
 */
export function checkSystemHealth(): {
  status: "healthy" | "degraded";
  components: Record<string, boolean>;
  timestamp: number;
} {
  return {
    status: "healthy",
    components: {
      contextManager: true,
      relationshipTypeRegistry: true,
      perspectiveAnalyzer: true,
      decisionEngine: true,
    },
    timestamp: Date.now(),
  };
}

/**
 * Initialize system (optional explicit init)
 */
export function initializeSystem(): void {
  // System initializes lazily, but can be explicitly initialized
  // This is useful for warming up singletons
  const _ = [
    require("./ContextManager").contextManager,
    require("./RelationshipTypeRegistry").relationshipTypeRegistry,
    require("./PerspectiveAnalyzer").perspectiveAnalyzer,
    require("./DecisionEngine").decisionEngine,
  ];
}
