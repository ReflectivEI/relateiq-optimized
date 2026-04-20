import { z } from "zod";

// Chat Messages
export const messageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "assistant"]),
  content: z.string(),
  timestamp: z.number(),
  feedback: z.object({
    eqScore: z.number().optional(),
    suggestions: z.array(z.string()).optional(),
    frameworks: z.array(z.string()).optional(),
  }).optional(),
});

export type Message = z.infer<typeof messageSchema>;
export type InsertMessage = Omit<Message, "id">;

// Coaching Modules
export const coachingModuleSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.enum(["discovery", "stakeholder", "clinical", "objection", "closing", "eq"]),
  icon: z.string(),
  frameworks: z.array(z.string()),
  exercises: z.array(z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    type: z.enum(["roleplay", "quiz", "practice"]),
  })),
  progress: z.number().default(0),
});

export type CoachingModule = z.infer<typeof coachingModuleSchema>;

// EQ Frameworks
export const eqFrameworkSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  principles: z.array(z.string()),
  techniques: z.array(z.object({
    name: z.string(),
    description: z.string(),
    example: z.string(),
  })),
  color: z.string(),
});

export type EQFramework = z.infer<typeof eqFrameworkSchema>;

// Role-Play Scenarios
export const scenarioSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.enum(["oncology", "cardiology", "neurology", "immunology", "rare-disease", "general", "hiv", "vaccines", "covid", "hepatology", "pulmonology", "endocrinology"]),
  stakeholder: z.string(),
  objective: z.string(),
  context: z.string(),
  challenges: z.array(z.string()),
  keyMessages: z.array(z.string()),
  impact: z.array(z.string()).optional(),
  suggestedPhrasing: z.array(z.string()).optional(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
});

export type Scenario = z.infer<typeof scenarioSchema>;

// SQL Query
export const sqlQuerySchema = z.object({
  id: z.string(),
  naturalLanguage: z.string(),
  sqlQuery: z.string(),
  explanation: z.string(),
  timestamp: z.number(),
});

export type SQLQuery = z.infer<typeof sqlQuerySchema>;
export type InsertSQLQuery = Omit<SQLQuery, "id">;

// Knowledge Base Articles
export const knowledgeArticleSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.enum(["fda", "clinical-trials", "compliance", "hcp-engagement", "market-access", "pricing"]),
  content: z.string(),
  summary: z.string(),
  tags: z.array(z.string()),
});

export type KnowledgeArticle = z.infer<typeof knowledgeArticleSchema>;

// Heuristic Language Templates
export const heuristicTemplateSchema = z.object({
  id: z.string(),
  category: z.enum(["objection", "value-proposition", "closing", "discovery", "rapport"]),
  name: z.string(),
  template: z.string(),
  example: z.string(),
  useCase: z.string(),
  eqPrinciples: z.array(z.string()),
});

export type HeuristicTemplate = z.infer<typeof heuristicTemplateSchema>;

// Chat Session
export const chatSessionSchema = z.object({
  id: z.string(),
  messages: z.array(messageSchema),
  context: z.enum(["general", "roleplay", "sql", "coaching"]).default("general"),
  scenarioId: z.string().optional(),
  moduleId: z.string().optional(),
});

export type ChatSession = z.infer<typeof chatSessionSchema>;

// Conversation Analysis
export const conversationAnalysisSchema = z.object({
  id: z.string(),
  sessionId: z.string(),
  overallScore: z.number(),
  eqMetrics: z.object({
    empathy: z.number(),
    activeListening: z.number(),
    rapport: z.number(),
    communicationAdaptation: z.number(),
  }),
  strengths: z.array(z.string()),
  improvements: z.array(z.string()),
  recommendations: z.array(z.string()),
});

export type ConversationAnalysis = z.infer<typeof conversationAnalysisSchema>;

// Keep existing user schema for compatibility
export const users = {
  id: "",
  username: "",
  password: "",
};

export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = { id: string; username: string; password: string };
