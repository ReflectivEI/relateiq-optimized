/**
 * errorBoundary.js — Structured Error Handling + Fallback System
 * No silent failures. All errors show structured fallback UI.
 */

export const ERROR_TYPES = {
  CONTEXT_INCOMPLETE: "context_incomplete",
  INVALID_INPUT: "invalid_input",
  AI_FAILED: "ai_failed",
  PATTERN_ERROR: "pattern_error",
  PREDICTION_ERROR: "prediction_error",
  DATA_MISSING: "data_missing",
  UNKNOWN: "unknown",
};

export class StructuredError extends Error {
  constructor(type, message, nextStep, context = {}) {
    super(message);
    this.type = type;
    this.nextStep = nextStep;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }

  toJSON() {
    return {
      error: this.type,
      message: this.message,
      next_step: this.nextStep,
      context: this.context,
      timestamp: this.timestamp,
    };
  }
}

/**
 * Handle error and return structured fallback
 */
export function handleError(error, type = ERROR_TYPES.UNKNOWN) {
  console.error("[ErrorBoundary]", error);

  const fallbacks = {
    [ERROR_TYPES.CONTEXT_INCOMPLETE]: {
      type: ERROR_TYPES.CONTEXT_INCOMPLETE,
      message: "We need more information to generate accurate guidance.",
      next_step: "Provide more detail about the situation or select a guided option.",
      action: "try_again",
      icon: "📋",
    },
    [ERROR_TYPES.INVALID_INPUT]: {
      type: ERROR_TYPES.INVALID_INPUT,
      message: "Some information is missing or invalid.",
      next_step: "Check that you've filled in all required fields.",
      action: "validate_input",
      icon: "✓",
    },
    [ERROR_TYPES.AI_FAILED]: {
      type: ERROR_TYPES.AI_FAILED,
      message: "The AI coach is temporarily unavailable.",
      next_step: "Try again in a few moments, or use Smart Tools for structured guidance.",
      action: "retry",
      icon: "🔄",
    },
    [ERROR_TYPES.PATTERN_ERROR]: {
      type: ERROR_TYPES.PATTERN_ERROR,
      message: "Pattern analysis encountered an issue.",
      next_step: "Complete more questionnaire responses or check-ins for better analysis.",
      action: "provide_more_data",
      icon: "📊",
    },
    [ERROR_TYPES.PREDICTION_ERROR]: {
      type: ERROR_TYPES.PREDICTION_ERROR,
      message: "Outcome prediction is not available right now.",
      next_step: "This requires recent check-in data. Try a check-in first.",
      action: "checkin_first",
      icon: "📝",
    },
    [ERROR_TYPES.DATA_MISSING]: {
      type: ERROR_TYPES.DATA_MISSING,
      message: "Not enough data to generate insights.",
      next_step: "Complete profiles and questionnaire for both partners.",
      action: "build_profiles",
      icon: "👤",
    },
    [ERROR_TYPES.UNKNOWN]: {
      type: ERROR_TYPES.UNKNOWN,
      message: "An unexpected error occurred.",
      next_step: "Please try again or contact support.",
      action: "retry",
      icon: "⚠️",
    },
  };

  return fallbacks[type] || fallbacks[ERROR_TYPES.UNKNOWN];
}

/**
 * Validate input and throw structured error
 */
export function validateInput(input) {
  if (!input) {
    throw new StructuredError(
      ERROR_TYPES.INVALID_INPUT,
      "No input provided.",
      "Provide the situation details."
    );
  }

  if (input.speaker && typeof input.speaker !== "string") {
    throw new StructuredError(
      ERROR_TYPES.INVALID_INPUT,
      "Invalid speaker selected.",
      "Select a valid person from this connection."
    );
  }

  if (input.speakingTo && typeof input.speakingTo !== "string") {
    throw new StructuredError(
      ERROR_TYPES.INVALID_INPUT,
      "Invalid listener selected.",
      "Select a valid person from this connection."
    );
  }

  if (input.speaker && input.speakingTo && input.speaker === input.speakingTo) {
    throw new StructuredError(
      ERROR_TYPES.INVALID_INPUT,
      "The speaker and listener cannot be the same person.",
      "Choose the other person in this connection."
    );
  }

  if (input.situation && input.situation.trim().length < 10) {
    throw new StructuredError(
      ERROR_TYPES.INVALID_INPUT,
      "Situation description is too short.",
      "Provide more context (at least 10 characters)."
    );
  }

  return true;
}

/**
 * Validate context completeness
 */
export function validateContext(context) {
  if (!context) {
    throw new StructuredError(
      ERROR_TYPES.CONTEXT_INCOMPLETE,
      "Context not built.",
      "Rebuild context and try again."
    );
  }

  const required = ["section", "perspective"];
  const missing = required.filter((k) => !context[k]);

  if (missing.length > 0) {
    throw new StructuredError(
      ERROR_TYPES.CONTEXT_INCOMPLETE,
      `Missing context fields: ${missing.join(", ")}`,
      "Ensure all required data is loaded.",
      { missingFields: missing }
    );
  }

  return true;
}

export default { ERROR_TYPES, StructuredError, handleError, validateInput, validateContext };
