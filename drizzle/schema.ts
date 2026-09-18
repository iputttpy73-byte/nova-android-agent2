import { boolean, index, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const goals = mysqlTable("goals", {
  id: varchar("id", { length: 128 }).primaryKey(),
  ownerId: varchar("ownerId", { length: 128 }).notNull(),
  text: text("text").notNull(),
  priority: mysqlEnum("priority", ["LOW", "NORMAL", "HIGH"]).default("NORMAL").notNull(),
  constraints: json("constraints").notNull(),
  createdAt: timestamp("createdAt").notNull(),
}, (table) => ({ ownerIdx: index("goals_owner_idx").on(table.ownerId) }));

export const agentRuns = mysqlTable("agent_runs", {
  id: varchar("id", { length: 128 }).primaryKey(),
  ownerId: varchar("ownerId", { length: 128 }).notNull(),
  goalId: varchar("goalId", { length: 128 }).notNull(),
  state: mysqlEnum("state", ["DRAFT", "SUBMITTED", "INTENT_PARSING", "PLAN_PENDING", "READY", "EXECUTING", "VERIFYING", "RECOVERING", "HUMAN_INTERVENTION", "COMPLETED", "PARTIALLY_COMPLETED", "FAILED", "CANCELLED", "BLOCKED", "EXPIRED"]).default("DRAFT").notNull(),
  stateVersion: int("stateVersion").default(0).notNull(),
  terminalReason: text("terminalReason"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
}, (table) => ({ ownerStateIdx: index("agent_runs_owner_state_idx").on(table.ownerId, table.state) }));

export const intents = mysqlTable("intents", {
  id: varchar("id", { length: 128 }).primaryKey(),
  goalId: varchar("goalId", { length: 128 }).notNull(),
  desiredOutcome: text("desiredOutcome").notNull(),
  entities: json("entities").notNull(),
  constraints: json("constraints").notNull(),
  requiredCapabilities: json("requiredCapabilities").notNull(),
  ambiguities: json("ambiguities").notNull(),
  sensitivity: mysqlEnum("sensitivity", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]).notNull(),
  confidence: varchar("confidence", { length: 32 }).notNull(),
  source: mysqlEnum("source", ["USER_GOAL", "USER_CLARIFICATION"]).notNull(),
  createdAt: timestamp("createdAt").notNull(),
}, (table) => ({ goalIdx: index("intents_goal_idx").on(table.goalId) }));

export const plans = mysqlTable("plans", {
  id: varchar("id", { length: 128 }).primaryKey(),
  runId: varchar("runId", { length: 128 }).notNull(),
  version: int("version").notNull(),
  requiresApproval: boolean("requiresApproval").notNull(),
  createdAt: timestamp("createdAt").notNull(),
}, (table) => ({ runVersionIdx: index("plans_run_version_idx").on(table.runId, table.version) }));

export const planSteps = mysqlTable("plan_steps", {
  id: varchar("id", { length: 128 }).primaryKey(),
  planId: varchar("planId", { length: 128 }).notNull(),
  position: int("position").notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  precondition: text("precondition").notNull(),
  abstractAction: text("abstractAction").notNull(),
  expectedPostcondition: text("expectedPostcondition").notNull(),
  verificationStrategy: text("verificationStrategy").notNull(),
  risk: mysqlEnum("risk", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]).notNull(),
  retryBudget: int("retryBudget").notNull(),
});

export const observations = mysqlTable("observations", {
  id: varchar("id", { length: 128 }).primaryKey(),
  runId: varchar("runId", { length: 128 }).notNull(),
  stepId: varchar("stepId", { length: 128 }),
  source: mysqlEnum("source", ["ACCESSIBILITY_TREE", "OCR", "SCREENSHOT", "APP_METADATA", "COMBINED"]).notNull(),
  payloadReference: text("payloadReference"),
  payload: json("payload"),
  confidence: varchar("confidence", { length: 32 }).notNull(),
  redactionState: mysqlEnum("redactionState", ["REDACTED", "MINIMIZED", "RESTRICTED"]).notNull(),
  capturedAt: timestamp("capturedAt").notNull(),
}, (table) => ({ runCapturedIdx: index("observations_run_captured_idx").on(table.runId, table.capturedAt) }));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type GoalRow = typeof goals.$inferSelect;
export type InsertGoalRow = typeof goals.$inferInsert;
export type AgentRunRow = typeof agentRuns.$inferSelect;
export type InsertAgentRunRow = typeof agentRuns.$inferInsert;
export type IntentRow = typeof intents.$inferSelect;
export type InsertIntentRow = typeof intents.$inferInsert;
export type PlanRow = typeof plans.$inferSelect;
export type InsertPlanRow = typeof plans.$inferInsert;
export type PlanStepRow = typeof planSteps.$inferSelect;
export type InsertPlanStepRow = typeof planSteps.$inferInsert;
export type ObservationRow = typeof observations.$inferSelect;
export type InsertObservationRow = typeof observations.$inferInsert;
