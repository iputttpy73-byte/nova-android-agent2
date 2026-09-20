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


export const expectedPostconditions = mysqlTable("expected_postconditions", {
  id: varchar("id", { length: 128 }).primaryKey(),
  runId: varchar("runId", { length: 128 }).notNull(),
  stepId: varchar("stepId", { length: 128 }).notNull(),
  description: text("description").notNull(),
  requiredSignals: json("requiredSignals").notNull(),
  strategy: mysqlEnum("strategy", ["STATE_MATCH", "CONTENT_MATCH", "APP_OPEN", "USER_CONFIRMATION"]).notNull(),
  minimumConfidence: varchar("minimumConfidence", { length: 32 }).notNull(),
  allowedSources: json("allowedSources").notNull(),
  createdAt: timestamp("createdAt").notNull(),
}, (table) => ({ runStepIdx: index("expected_postconditions_run_step_idx").on(table.runId, table.stepId) }));

export const verificationEvidence = mysqlTable("verification_evidence", {
  id: varchar("id", { length: 128 }).primaryKey(),
  runId: varchar("runId", { length: 128 }).notNull(),
  stepId: varchar("stepId", { length: 128 }).notNull(),
  source: mysqlEnum("source", ["ACCESSIBILITY", "APP_STATE", "OCR", "SCREENSHOT", "NOTIFICATION", "USER_CONFIRMATION", "SYSTEM"]).notNull(),
  reference: text("reference"),
  observedSignals: json("observedSignals").notNull(),
  contradictedSignals: json("contradictedSignals").notNull(),
  confidence: varchar("confidence", { length: 32 }).notNull(),
  redactionState: mysqlEnum("redactionState", ["REDACTED", "MINIMIZED", "RESTRICTED"]).notNull(),
  capturedAt: timestamp("capturedAt").notNull(),
  expiresAt: timestamp("expiresAt"),
}, (table) => ({ runStepCapturedIdx: index("verification_evidence_run_step_captured_idx").on(table.runId, table.stepId, table.capturedAt) }));

export const verificationRecords = mysqlTable("verification_records", {
  id: varchar("id", { length: 128 }).primaryKey(),
  runId: varchar("runId", { length: 128 }).notNull(),
  stepId: varchar("stepId", { length: 128 }).notNull(),
  expectedPostconditionId: varchar("expectedPostconditionId", { length: 128 }).notNull(),
  status: mysqlEnum("status", ["PASSED", "FAILED", "UNCERTAIN", "UNAVAILABLE"]).notNull(),
  evidenceIds: json("evidenceIds").notNull(),
  resultId: varchar("resultId", { length: 128 }),
  policyVersion: varchar("policyVersion", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").notNull(),
  completedAt: timestamp("completedAt"),
}, (table) => ({ runStepCreatedIdx: index("verification_records_run_step_created_idx").on(table.runId, table.stepId, table.createdAt) }));

export const verificationResults = mysqlTable("verification_results", {
  id: varchar("id", { length: 128 }).primaryKey(),
  recordId: varchar("recordId", { length: 128 }).notNull(),
  status: mysqlEnum("status", ["PASSED", "FAILED", "UNCERTAIN", "UNAVAILABLE"]).notNull(),
  confidence: varchar("confidence", { length: 32 }).notNull(),
  matchedSignals: json("matchedSignals").notNull(),
  missingSignals: json("missingSignals").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("createdAt").notNull(),
}, (table) => ({ recordCreatedIdx: index("verification_results_record_created_idx").on(table.recordId, table.createdAt) }));

export const verificationAuditEvents = mysqlTable("verification_audit_events", {
  id: varchar("id", { length: 128 }).primaryKey(),
  ownerId: varchar("ownerId", { length: 128 }).notNull(),
  runId: varchar("runId", { length: 128 }).notNull(),
  stepId: varchar("stepId", { length: 128 }).notNull(),
  recordId: varchar("recordId", { length: 128 }),
  action: mysqlEnum("action", ["VERIFICATION_REQUESTED", "EVIDENCE_ACCEPTED", "EVIDENCE_REJECTED", "RESULT_RECORDED"]).notNull(),
  outcome: mysqlEnum("outcome", ["SUCCESS", "DENIED", "FAILED"]).notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").notNull(),
}, (table) => ({ ownerRunCreatedIdx: index("verification_audit_owner_run_created_idx").on(table.ownerId, table.runId, table.createdAt) }));

export type ExpectedPostconditionRow = typeof expectedPostconditions.$inferSelect;
export type VerificationEvidenceRow = typeof verificationEvidence.$inferSelect;
export type VerificationRecordRow = typeof verificationRecords.$inferSelect;
export type VerificationResultRow = typeof verificationResults.$inferSelect;
export type VerificationAuditEventRow = typeof verificationAuditEvents.$inferSelect;


export const recoveryPolicies = mysqlTable("recovery_policies", {
  id: varchar("id", { length: 128 }).primaryKey(),
  version: varchar("version", { length: 64 }).notNull(),
  allowedStrategies: json("allowedStrategies").notNull(),
  classificationStrategies: json("classificationStrategies").notNull(),
  defaultStrategy: mysqlEnum("defaultStrategy", ["RETRY", "REOBSERVE", "REPLAN", "WAIT", "HUMAN_INTERVENTION", "ABORT"]).notNull(),
  maxAttempts: int("maxAttempts").notNull(),
  requiresHumanFor: json("requiresHumanFor").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});

export const recoveryStrategies = mysqlTable("recovery_strategies", {
  id: varchar("id", { length: 128 }).primaryKey(),
  classification: mysqlEnum("classification", ["TRANSIENT_FAILURE", "VERIFICATION_FAILURE", "TIMEOUT", "INTERRUPTED", "UNKNOWN_FAILURE", "UNSUPPORTED_OPERATION"]).notNull(),
  strategy: mysqlEnum("strategy", ["RETRY", "REOBSERVE", "REPLAN", "WAIT", "HUMAN_INTERVENTION", "ABORT"]).notNull(),
  rationale: text("rationale").notNull(),
  delayMs: int("delayMs"),
  createdAt: timestamp("createdAt").notNull(),
}, (table) => ({ classificationIdx: index("recovery_strategies_classification_idx").on(table.classification) }));

export const recoveryAttempts = mysqlTable("recovery_attempts", {
  id: varchar("id", { length: 128 }).primaryKey(),
  runId: varchar("runId", { length: 128 }).notNull(),
  stepId: varchar("stepId", { length: 128 }).notNull(),
  classification: mysqlEnum("classification", ["TRANSIENT_FAILURE", "VERIFICATION_FAILURE", "TIMEOUT", "INTERRUPTED", "UNKNOWN_FAILURE", "UNSUPPORTED_OPERATION"]).notNull(),
  strategy: mysqlEnum("strategy", ["RETRY", "REOBSERVE", "REPLAN", "WAIT", "HUMAN_INTERVENTION", "ABORT"]).notNull(),
  attemptNumber: int("attemptNumber").notNull(),
  budgetBefore: json("budgetBefore").notNull(),
  status: mysqlEnum("status", ["PENDING", "STARTED", "COMPLETED", "FAILED", "CANCELLED"]).notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("createdAt").notNull(),
  completedAt: timestamp("completedAt"),
}, (table) => ({ runStepAttemptIdx: index("recovery_attempts_run_step_attempt_idx").on(table.runId, table.stepId, table.attemptNumber) }));

export const recoveryAuditEvents = mysqlTable("recovery_audit_events", {
  id: varchar("id", { length: 128 }).primaryKey(),
  ownerId: varchar("ownerId", { length: 128 }).notNull(),
  runId: varchar("runId", { length: 128 }).notNull(),
  stepId: varchar("stepId", { length: 128 }).notNull(),
  attemptId: varchar("attemptId", { length: 128 }),
  action: mysqlEnum("action", ["RECOVERY_REQUESTED", "STRATEGY_SELECTED", "RETRY_BUDGET_CONSUMED", "RECOVERY_COMPLETED", "RECOVERY_ABORTED"]).notNull(),
  outcome: mysqlEnum("outcome", ["SUCCESS", "DENIED", "FAILED"]).notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").notNull(),
}, (table) => ({ ownerRunCreatedIdx: index("recovery_audit_owner_run_created_idx").on(table.ownerId, table.runId, table.createdAt) }));

export type RecoveryPolicyRow = typeof recoveryPolicies.$inferSelect;
export type RecoveryStrategyRow = typeof recoveryStrategies.$inferSelect;
export type RecoveryAttemptRow = typeof recoveryAttempts.$inferSelect;
export type RecoveryAuditEventRow = typeof recoveryAuditEvents.$inferSelect;


export const interventionPolicies = mysqlTable("intervention_policies", {
  id: varchar("id", { length: 128 }).primaryKey(),
  version: varchar("version", { length: 64 }).notNull(),
  allowedTypes: json("allowedTypes").notNull(),
  approvalRequiredFor: json("approvalRequiredFor").notNull(),
  allowedOutcomes: json("allowedOutcomes").notNull(),
  defaultExpiryMs: int("defaultExpiryMs").notNull(),
  createdAt: timestamp("createdAt").notNull(),
});

export const interventionRequests = mysqlTable("intervention_requests", {
  id: varchar("id", { length: 128 }).primaryKey(),
  ownerId: varchar("ownerId", { length: 128 }).notNull(),
  runId: varchar("runId", { length: 128 }).notNull(),
  type: mysqlEnum("type", ["APPROVAL_REQUIRED", "USER_CONFIRMATION", "CLARIFICATION_REQUIRED", "AUTHENTICATION_REQUIRED", "SECURITY_DECISION", "DEVICE_ACTION_REQUIRED", "RECOVERY_ASSISTANCE"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  reason: text("reason").notNull(),
  requestedAction: text("requestedAction").notNull(),
  risk: mysqlEnum("risk", ["LOW", "MEDIUM", "HIGH", "CRITICAL"]).notNull(),
  status: mysqlEnum("status", ["OPEN", "RESPONDED", "RESOLVED", "EXPIRED", "CANCELLED"]).notNull(),
  policyId: varchar("policyId", { length: 128 }).notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull(),
  resolvedAt: timestamp("resolvedAt"),
}, (table) => ({ ownerRunStatusIdx: index("intervention_requests_owner_run_status_idx").on(table.ownerId, table.runId, table.status) }));

export const interventionResponses = mysqlTable("intervention_responses", {
  id: varchar("id", { length: 128 }).primaryKey(),
  requestId: varchar("requestId", { length: 128 }).notNull(),
  responderId: varchar("responderId", { length: 128 }).notNull(),
  outcome: mysqlEnum("outcome", ["APPROVED", "REJECTED", "CANCELLED", "EXPIRED", "RESOLVED"]).notNull(),
  message: text("message"),
  submittedAt: timestamp("submittedAt").notNull(),
}, (table) => ({ requestSubmittedIdx: index("intervention_responses_request_submitted_idx").on(table.requestId, table.submittedAt) }));

export const interventionResolutions = mysqlTable("intervention_resolutions", {
  id: varchar("id", { length: 128 }).primaryKey(),
  requestId: varchar("requestId", { length: 128 }).notNull(),
  responseId: varchar("responseId", { length: 128 }).notNull(),
  outcome: mysqlEnum("outcome", ["APPROVED", "REJECTED", "CANCELLED", "EXPIRED", "RESOLVED"]).notNull(),
  resultingRunState: varchar("resultingRunState", { length: 64 }).notNull(),
  resolutionNote: text("resolutionNote").notNull(),
  resolvedBy: varchar("resolvedBy", { length: 128 }).notNull(),
  resolvedAt: timestamp("resolvedAt").notNull(),
}, (table) => ({ requestResolvedIdx: index("intervention_resolutions_request_resolved_idx").on(table.requestId, table.resolvedAt) }));

export const interventionAuditEvents = mysqlTable("intervention_audit_events", {
  id: varchar("id", { length: 128 }).primaryKey(),
  ownerId: varchar("ownerId", { length: 128 }).notNull(),
  runId: varchar("runId", { length: 128 }).notNull(),
  requestId: varchar("requestId", { length: 128 }),
  responseId: varchar("responseId", { length: 128 }),
  action: mysqlEnum("action", ["REQUESTED", "RESPONDED", "RESOLVED", "EXPIRED", "CANCELLED", "STATE_TRANSITION"]).notNull(),
  outcome: mysqlEnum("outcome", ["SUCCESS", "DENIED", "FAILED"]).notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").notNull(),
}, (table) => ({ ownerRunCreatedIdx: index("intervention_audit_owner_run_created_idx").on(table.ownerId, table.runId, table.createdAt) }));

export type InterventionPolicyRow = typeof interventionPolicies.$inferSelect;
export type InterventionRequestRow = typeof interventionRequests.$inferSelect;
export type InterventionResponseRow = typeof interventionResponses.$inferSelect;
export type InterventionResolutionRow = typeof interventionResolutions.$inferSelect;
export type InterventionAuditEventRow = typeof interventionAuditEvents.$inferSelect;


export const observationRecords = mysqlTable("observation_records", {
  id: varchar("id", { length: 128 }).primaryKey(),
  ownerId: varchar("ownerId", { length: 128 }).notNull(),
  runId: varchar("runId", { length: 128 }).notNull(),
  stepId: varchar("stepId", { length: 128 }),
  source: mysqlEnum("source", ["ACCESSIBILITY_TREE", "UI_HIERARCHY", "OCR", "SCREENSHOT", "APPLICATION_METADATA"]).notNull(),
  status: mysqlEnum("status", ["AVAILABLE", "UNAVAILABLE"]).notNull(),
  payloadReference: text("payloadReference"),
  payload: json("payload"),
  signals: json("signals").notNull(),
  confidence: json("confidence").notNull(),
  redactionState: mysqlEnum("redactionState", ["REDACTED", "MINIMIZED", "RESTRICTED"]).notNull(),
  capturedAt: timestamp("capturedAt").notNull(),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").notNull(),
}, (table) => ({ ownerRunCapturedIdx: index("observation_records_owner_run_captured_idx").on(table.ownerId, table.runId, table.capturedAt), sourceIdx: index("observation_records_source_idx").on(table.source) }));

export const observationAuditEvents = mysqlTable("observation_audit_events", {
  id: varchar("id", { length: 128 }).primaryKey(),
  ownerId: varchar("ownerId", { length: 128 }).notNull(),
  runId: varchar("runId", { length: 128 }).notNull(),
  recordId: varchar("recordId", { length: 128 }),
  action: mysqlEnum("action", ["RECORD_REQUESTED", "RECORD_ACCEPTED", "RECORD_REJECTED", "RECORD_RETRIEVED", "RECORD_DELETED"]).notNull(),
  outcome: mysqlEnum("outcome", ["SUCCESS", "DENIED", "FAILED"]).notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").notNull(),
}, (table) => ({ ownerRunCreatedIdx: index("observation_audit_owner_run_created_idx").on(table.ownerId, table.runId, table.createdAt) }));

export type ObservationRecordRow = typeof observationRecords.$inferSelect;
export type ObservationAuditEventRow = typeof observationAuditEvents.$inferSelect;
