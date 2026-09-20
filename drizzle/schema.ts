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

export const agentRunEvents = mysqlTable("agent_run_events", {
  id: varchar("id", { length: 128 }).primaryKey(),
  runId: varchar("runId", { length: 128 }).notNull(),
  sequence: int("sequence").notNull(),
  type: varchar("type", { length: 64 }).notNull(),
  fromState: varchar("fromState", { length: 64 }),
  toState: varchar("toState", { length: 64 }),
  actor: varchar("actor", { length: 32 }).notNull(),
  reason: text("reason"),
  payload: json("payload"),
  createdAt: timestamp("createdAt").notNull(),
}, (table) => ({ runSequenceIdx: index("agent_run_events_run_sequence_idx").on(table.runId, table.sequence) }));

export const auditEvents = mysqlTable("audit_events", {
  id: varchar("id", { length: 128 }).primaryKey(),
  runId: varchar("runId", { length: 128 }),
  actorId: varchar("actorId", { length: 128 }).notNull(),
  action: varchar("action", { length: 128 }).notNull(),
  outcome: mysqlEnum("outcome", ["SUCCESS", "DENIED", "FAILED"]).notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").notNull(),
}, (table) => ({ runCreatedIdx: index("audit_events_run_created_idx").on(table.runId, table.createdAt), actorCreatedIdx: index("audit_events_actor_created_idx").on(table.actorId, table.createdAt) }));

export const humanInterventionRequests = mysqlTable("human_intervention_requests", {
  id: varchar("id", { length: 128 }).primaryKey(),
  runId: varchar("runId", { length: 128 }).notNull(),
  reason: text("reason").notNull(),
  requestedAction: text("requestedAction").notNull(),
  risk: mysqlEnum("risk", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]).notNull(),
  status: mysqlEnum("status", ["OPEN", "RESOLVED", "EXPIRED", "CANCELLED"]).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  resolution: text("resolution"),
  createdAt: timestamp("createdAt").notNull(),
  resolvedAt: timestamp("resolvedAt"),
}, (table) => ({ runStatusIdx: index("interventions_run_status_idx").on(table.runId, table.status) }));

export type AgentRunEventRow = typeof agentRunEvents.$inferSelect;
export type AuditEventRow = typeof auditEvents.$inferSelect;
export type HumanInterventionRequestRow = typeof humanInterventionRequests.$inferSelect;


export const memoryUserProfiles = mysqlTable("memory_user_profiles", {
  id: varchar("id", { length: 128 }).primaryKey(),
  ownerId: varchar("ownerId", { length: 128 }).notNull().unique(),
  displayName: varchar("displayName", { length: 255 }),
  locale: varchar("locale", { length: 32 }),
  timezone: varchar("timezone", { length: 64 }),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const memoryPreferences = mysqlTable("memory_preferences", {
  id: varchar("id", { length: 128 }).primaryKey(),
  ownerId: varchar("ownerId", { length: 128 }).notNull().unique(),
  values: json("values").notNull(),
  consentStatus: mysqlEnum("consentStatus", ["REQUESTED", "GRANTED", "DENIED", "REVOKED", "EXPIRED"]).notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const memorySessionContexts = mysqlTable("memory_session_contexts", {
  id: varchar("id", { length: 128 }).primaryKey(),
  ownerId: varchar("ownerId", { length: 128 }).notNull(),
  sessionId: varchar("sessionId", { length: 128 }).notNull(),
  entryIds: json("entryIds").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull(),
}, (table) => ({ ownerSessionIdx: index("memory_session_owner_session_idx").on(table.ownerId, table.sessionId) }));

export const memoryWorkingContexts = mysqlTable("memory_working_contexts", {
  id: varchar("id", { length: 128 }).primaryKey(),
  ownerId: varchar("ownerId", { length: 128 }).notNull(),
  runId: varchar("runId", { length: 128 }),
  entryIds: json("entryIds").notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
}, (table) => ({ ownerRunIdx: index("memory_working_owner_run_idx").on(table.ownerId, table.runId) }));

export const memoryLongTermContexts = mysqlTable("memory_long_term_contexts", {
  id: varchar("id", { length: 128 }).primaryKey(),
  ownerId: varchar("ownerId", { length: 128 }).notNull().unique(),
  entryIds: json("entryIds").notNull(),
  consentStatus: mysqlEnum("consentStatus", ["REQUESTED", "GRANTED", "DENIED", "REVOKED", "EXPIRED"]).notNull(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const memoryEntries = mysqlTable("memory_entries", {
  id: varchar("id", { length: 128 }).primaryKey(),
  ownerId: varchar("ownerId", { length: 128 }).notNull(),
  scope: mysqlEnum("scope", ["SESSION", "WORKING", "LONG_TERM"]).notNull(),
  kind: mysqlEnum("kind", ["FACT", "PREFERENCE", "CONTEXT", "SUMMARY", "INSTRUCTION"]).notNull(),
  memoryKey: varchar("memoryKey", { length: 256 }).notNull(),
  value: text("value").notNull(),
  source: mysqlEnum("source", ["USER_EXPLICIT", "USER_PROFILE", "SYSTEM_EXPLICIT", "AI_PROPOSAL"]).notNull(),
  sensitivity: mysqlEnum("sensitivity", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]).notNull(),
  confidence: varchar("confidence", { length: 32 }).notNull(),
  consentStatus: mysqlEnum("consentStatus", ["REQUESTED", "GRANTED", "DENIED", "REVOKED", "EXPIRED"]).notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").notNull(),
  deletedAt: timestamp("deletedAt"),
}, (table) => ({ ownerScopeIdx: index("memory_entries_owner_scope_idx").on(table.ownerId, table.scope), ownerKeyIdx: index("memory_entries_owner_key_idx").on(table.ownerId, table.memoryKey) }));

export const memoryConsents = mysqlTable("memory_consents", {
  id: varchar("id", { length: 128 }).primaryKey(),
  ownerId: varchar("ownerId", { length: 128 }).notNull(),
  scope: mysqlEnum("scope", ["SESSION", "WORKING", "LONG_TERM"]).notNull(),
  purpose: text("purpose").notNull(),
  status: mysqlEnum("status", ["REQUESTED", "GRANTED", "DENIED", "REVOKED", "EXPIRED"]).notNull(),
  requestedAt: timestamp("requestedAt").notNull(),
  resolvedAt: timestamp("resolvedAt"),
  expiresAt: timestamp("expiresAt"),
}, (table) => ({ ownerStatusIdx: index("memory_consents_owner_status_idx").on(table.ownerId, table.status) }));

export const memoryAuditEvents = mysqlTable("memory_audit_events", {
  id: varchar("id", { length: 128 }).primaryKey(),
  ownerId: varchar("ownerId", { length: 128 }).notNull(),
  entryId: varchar("entryId", { length: 128 }),
  action: mysqlEnum("action", ["WRITE_REQUESTED", "WRITE_ACCEPTED", "WRITE_DENIED", "READ_ALLOWED", "READ_DENIED", "DELETED", "CONSENT_GRANTED", "CONSENT_REVOKED"]).notNull(),
  actor: mysqlEnum("actor", ["USER", "SYSTEM", "AI"]).notNull(),
  outcome: mysqlEnum("outcome", ["SUCCESS", "DENIED", "FAILED"]).notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").notNull(),
}, (table) => ({ ownerCreatedIdx: index("memory_audit_owner_created_idx").on(table.ownerId, table.createdAt) }));

export type MemoryUserProfileRow = typeof memoryUserProfiles.$inferSelect;
export type MemoryPreferencesRow = typeof memoryPreferences.$inferSelect;
export type MemorySessionContextRow = typeof memorySessionContexts.$inferSelect;
export type MemoryWorkingContextRow = typeof memoryWorkingContexts.$inferSelect;
export type MemoryLongTermContextRow = typeof memoryLongTermContexts.$inferSelect;
export type MemoryEntryRow = typeof memoryEntries.$inferSelect;
export type MemoryConsentRow = typeof memoryConsents.$inferSelect;
export type MemoryAuditEventRow = typeof memoryAuditEvents.$inferSelect;
