import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import { scenarios, getScenario } from "./scenarios";
import { initialTrust, updateTrust } from "./trust";
import { auditFor } from "./audit";
import { transition } from "./state-machine";
import { evaluate_action, execute_action, execute_case_action, verify_case_outcome, verify_outcome } from "./tools";
import { runStrandsEvaluation } from "./agent/strands";
import { consumeResolution, createResolution, evidenceVersionFor, validResolutionFor } from "./resolutions";
import { canRunRecovery, canRunRestoredAction } from "./recovery";
import { caseForScenario, initialCases, initialMetrics } from "./cases";
import { loadSession, replaceSession, saveSession } from "./session-store";
import { approvalAllowsExecution } from "./approval";
import type { ActionRecord, ApprovalRecord, SessionState, WorkflowState } from "../shared/types";

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin ?? "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Vouch-Session");
  res.setHeader("Access-Control-Expose-Headers", "X-Vouch-Session");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const createSession = (id: string): SessionState => ({
  sessionId: id,
  trust: initialTrust(),
  activeScenarioId: "safe-review",
  history: [],
  evidence: [],
  approvals: [],
  resolutions: [],
  audit: [],
  trustHistory: [],
  activity: ["Claims Resolution Agent initialized", "Current authority · T2 RECOMMEND", "Ready to earn broader autonomy"],
  service: { mode: "DEMO", available: true, message: "DEMO — Deterministic VOUCH Evaluator" },
  cases: initialCases(),
  metrics: initialMetrics(),
});

const normalizeSession = (session: SessionState): SessionState => ({
  ...session,
  approvals: (session.approvals ?? []).filter((item): item is ApprovalRecord => typeof item === "object" && item !== null),
  cases: (session.cases ?? initialCases()).map((item) => ({ ...item, version: item.version ?? 1, refundAmount: item.refundAmount ?? 0 })),
  metrics: { ...initialMetrics(), ...(session.metrics ?? {}) },
});

const getSession = async (req: express.Request, res: express.Response) => {
  let id = req.headers["x-vouch-session"]?.toString();
  let session = id ? await loadSession(id) : undefined;
  if (!id || !session) {
    id = crypto.randomUUID();
    session = await saveSession(createSession(id));
  }
  res.setHeader("x-vouch-session", id);
  return normalizeSession(session);
};

function addAudit(session: SessionState, record: ActionRecord, type: string, actor: "VOUCH" | "HUMAN", status: string, result: string) {
  session.audit.unshift(auditFor(session, record, type, actor, status, result));
}

app.get("/api/scenarios", (_req, res) => res.json(scenarios.map(({ id, name, shortName, description, accent }) => ({ id, name, shortName, description, accent }))));
app.get("/api/session", async (req, res) => res.json({ session: await getSession(req, res), scenarios }));
app.post("/api/session/reset", async (req, res) => {
  const current = await getSession(req, res);
  const reset = await replaceSession(createSession(current.sessionId));
  res.json({ session: reset, scenarios });
});

app.post("/api/scenarios/:scenarioId/run", async (req, res) => {
  const session = await getSession(req, res);
  const scenario = getScenario(req.params.scenarioId);
  if (!scenario) return res.status(404).json({ error: "Scenario not found" });
  if (scenario.recovery && !canRunRecovery(session)) {
    return res.status(409).json({ error: "Recovery is not yet eligible. Demonstrate the failed outcome and reduced-authority retry first." });
  }
  if (scenario.id === "recovered-account-update" && !canRunRestoredAction(session)) {
    return res.status(409).json({ error: "Restored action is unavailable until the monitored recovery sequence verifies." });
  }
  const priorAction = session.currentAction?.action.scenarioId === scenario.id ? session.currentAction.action : undefined;
  const resolution = priorAction ? validResolutionFor(session, priorAction, scenario.evidence, req.body) : undefined;
  const hasServerResolution = Boolean(resolution);
  const action = resolution ? priorAction! : { ...scenario.action, id: `${scenario.action.id}-${crypto.randomUUID().slice(0, 8)}` };
  let state: WorkflowState = "REQUESTED";
  const record: ActionRecord = {
    action,
    state,
    createdAt: new Date().toISOString(),
    evidenceVersion: evidenceVersionFor(scenario.evidence),
  };
  session.activeScenarioId = scenario.id;
  const workCase = caseForScenario(session.cases, scenario.id);
  if (workCase) {
    workCase.status = "INVESTIGATING";
    workCase.lastAction = "Evidence collection and policy review started";
    record.caseId = workCase.id;
    record.caseVersion = workCase.version;
  }
  session.evidence = [];
  session.currentAction = record;
  session.activity = ["Request received", "Investigating evidence sources…", "Checking authoritative sources…"];
  addAudit(session, record, "CASE_RECEIVED", "VOUCH", "RECEIVED", "Case entered the professional work queue");
  state = transition(state, "INVESTIGATING");
  state = transition(state, "EVIDENCE_COLLECTED");
  session.evidence = scenario.evidence;
  addAudit(session, record, "EVIDENCE_RETRIEVED", "VOUCH", "VERIFIED", `${scenario.evidence.length} evidence sources retrieved and versioned`);
  const conflict = (scenario.hasConflict && !hasServerResolution) || scenario.hasInjection;
  if (conflict) state = transition(state, "CONFLICT_DETECTED");
  state = transition(state, conflict ? "BLOCKED" : "RISK_ASSESSED");
  if (conflict) {
    const agentResult = await runStrandsEvaluation(scenario.action, scenario.evidence, session.trust, hasServerResolution);
    record.state = "BLOCKED";
    record.decision = agentResult.decision;
    record.agentRecommendation = agentResult.recommendation;
    session.service = agentResult.service;
    session.activity = scenario.hasInjection
      ? ["Evidence gathered", "Untrusted instruction detected", "Instruction treated as data, not authority", "Decision: BLOCKED"]
      : ["Evidence gathered", "Policy checked", "Conflict detected", "Decision: BLOCKED", "Waiting for authoritative resolution"];
    addAudit(session, record, "STRANDS_RECOMMENDATION", "VOUCH", record.agentRecommendation.recommendation, record.agentRecommendation.summary);
    addAudit(session, record, "AUTHORITY_BLOCKED", "VOUCH", "BLOCKED", record.decision.reason);
    if (workCase) {
      workCase.status = "BLOCKED";
      workCase.lastAction = scenario.hasInjection ? "Untrusted instruction blocked before execution" : "Authoritative conflict requires resolution";
    }
    session.metrics.casesProcessed += 1;
    session.metrics.blockedCases += 1;
    session.currentAction = record;
    await saveSession(session);
    return res.json({ session, scenarios, message: scenario.hasInjection ? "UNTRUSTED INSTRUCTION DETECTED" : "CONFLICT DETECTED" });
  }
  state = transition(state, "AUTHORITY_EVALUATED");
  record.state = state;
  const agentResult = await runStrandsEvaluation(scenario.action, scenario.evidence, session.trust, hasServerResolution);
  record.decision = agentResult.decision;
  record.agentRecommendation = agentResult.recommendation;
  session.service = agentResult.service;
  addAudit(session, record, "STRANDS_RECOMMENDATION", "VOUCH", record.agentRecommendation.recommendation, record.agentRecommendation.summary);
  addAudit(session, record, "AUTHORITY_DECISION", "VOUCH", record.decision.authorization, record.decision.reason);
  if (agentResult.decision.authorization === "APPROVAL_REQUIRED") {
    record.state = "APPROVAL_REQUIRED";
    session.activity = ["Evidence gathered", "Policy checked", "Risk assessed: " + scenario.action.risk, "Recommendation: APPROVE", "Waiting for human authorization"];
    addAudit(session, record, "APPROVAL_REQUESTED", "VOUCH", "PENDING", record.decision.reason);
    if (workCase) {
      workCase.status = "APPROVAL_REQUIRED";
      workCase.lastAction = "Prepared for focused human review";
      workCase.version += 1;
      record.caseVersion = workCase.version;
      const approval: ApprovalRecord = {
        id: crypto.randomUUID(),
        sessionId: session.sessionId,
        actionId: record.action.id,
        caseId: workCase.id,
        evidenceVersion: record.evidenceVersion,
        caseVersion: workCase.version,
        status: "PENDING",
        createdAt: new Date().toISOString(),
      };
      record.approvalId = approval.id;
      session.approvals.unshift(approval);
    }
    session.metrics.humanReviews += 1;
    session.currentAction = record;
    await saveSession(session);
    return res.json({ session, scenarios, message: "HUMAN DECISION REQUIRED" });
  }
  if (resolution) consumeResolution(resolution);
  return completeExecution(session, record, res, false, Boolean(resolution));
});

async function completeExecution(session: SessionState, record: ActionRecord, res: express.Response, authorizedByHuman = false, hasServerResolution = false) {
  const scenario = getScenario(record.action.scenarioId);
  if (!scenario || record.evidenceVersion !== evidenceVersionFor(scenario.evidence)) {
    return res.status(409).json({ error: "Evidence changed; a fresh authorization decision is required" });
  }
  const workCase = caseForScenario(session.cases, record.action.scenarioId);
  if (workCase && record.caseVersion !== workCase.version) {
    return res.status(409).json({ error: "Case state changed; a fresh authorization decision is required" });
  }
  const freshDecision = evaluate_action(record.action, scenario.evidence, session.trust, hasServerResolution);
  const approval = record.approvalId ? session.approvals.find((item) => item.id === record.approvalId) : undefined;
  const validHumanApproval = authorizedByHuman && approvalAllowsExecution(approval, record, workCase, record.evidenceVersion);
  if (freshDecision.authorization !== "EXECUTE" && !(freshDecision.authorization === "APPROVAL_REQUIRED" && validHumanApproval)) {
    return res.status(409).json({ error: "Fresh server authorization does not permit execution" });
  }
  if (validHumanApproval && approval) {
    approval.status = "CONSUMED";
    approval.consumedAt = new Date().toISOString();
  }
  if (record.state !== "AUTHORIZED") record.state = transition(record.state, "AUTHORIZED");
  record.state = transition(record.state, "EXECUTING");
  record.execution = workCase ? execute_case_action(record.action, workCase, Boolean(scenario.failVerification)) : execute_action(record.action);
  addAudit(session, record, "PROTECTED_MUTATION", "VOUCH", "EXECUTED", record.execution.message);
  session.currentAction = record;
  await saveSession(session);
  const persisted = (await loadSession(session.sessionId))!;
  const persistedRecord = persisted.currentAction!;
  const persistedCase = caseForScenario(persisted.cases, persistedRecord.action.scenarioId);
  persistedRecord.state = transition(persistedRecord.state, "VERIFYING");
  persistedRecord.verification = persistedCase
    ? verify_case_outcome(persistedRecord.action, persistedCase)
    : verify_outcome(persistedRecord.action.expectedOutcome, persistedRecord.execution?.actualState ?? "Missing");
  persistedRecord.state = transition(persistedRecord.state, persistedRecord.verification.status === "PASS" ? "VERIFIED" : "VERIFICATION_FAILED");
  const recovery = Boolean(scenario.recovery && persistedRecord.verification.status === "PASS");
  const change = updateTrust(
    persisted.trust,
    persistedRecord.verification,
    recovery ? "Monitored recovery sequence verified · authority restored" : persistedRecord.verification.status === "PASS" ? "Successful verified action · authority earned" : "Verification failure · authority reduced",
    { recovery },
  );
  persisted.trust = change.trust;
  if (change.event.autonomyFrom !== change.event.autonomyTo) persisted.metrics.authorityChanges += 1;
  persisted.trustHistory.unshift(change.event);
  persistedRecord.trustImpact = change.event.to - change.event.from;
  persistedRecord.state = transition(persistedRecord.state, "TRUST_UPDATED");
  persisted.activity = persistedRecord.verification.status === "PASS"
    ? ["Authorization granted", "Executing action…", "Verifying outcome…", "Outcome verified", change.event.autonomyFrom !== change.event.autonomyTo ? `Authority changed · ${change.event.autonomyFrom} → ${change.event.autonomyTo}` : `Trust updated · ${change.event.from} → ${change.event.to}`]
    : ["Authorization granted", "Executing action…", "Verifying outcome…", "Verification failed", `Autonomy reduced · ${change.event.autonomyFrom} → ${change.event.autonomyTo}`];
  addAudit(persisted, persistedRecord, "VERIFICATION_COMPLETED", "VOUCH", persistedRecord.verification.status, persistedRecord.verification.message);
  addAudit(persisted, persistedRecord, "AUTHORITY_UPDATED", "VOUCH", persisted.trust.autonomy, `${change.event.autonomyFrom} → ${change.event.autonomyTo}`);
  persisted.metrics.casesProcessed += 1;
  if (persistedRecord.verification.status === "PASS") {
    persisted.metrics.verifiedOutcomes += 1;
    if (!authorizedByHuman) persisted.metrics.autonomousResolutions += 1;
    persisted.metrics.minutesSaved += authorizedByHuman ? 6 : 14;
    if (persistedCase) {
      persistedCase.status = "RESOLVED";
      persistedCase.resolution = persistedRecord.action.expectedOutcome;
      persistedCase.lastAction = authorizedByHuman ? "Human-authorized action executed and verified from durable state" : "Resolved autonomously and independently verified from durable state";
    }
  } else {
    persisted.metrics.verificationFailures += 1;
    persisted.metrics.humanReviews += 1;
    if (persistedCase) {
      persistedCase.status = "VERIFICATION_FAILED";
      persistedCase.lastAction = "Database verification found a mismatch; sent to professional review";
      persistedCase.version += 1;
    }
  }
  persisted.history.unshift(persistedRecord);
  persisted.currentAction = persistedRecord;
  await saveSession(persisted);
  return res.json({ session: persisted, scenarios, message: persistedRecord.verification.status === "PASS" ? "ACTION VERIFIED" : "VERIFICATION FAILED" });
}

app.post("/api/actions/:actionId/approve", async (req, res) => {
  const session = await getSession(req, res);
  const record = session.currentAction;
  if (!record || record.action.id !== req.params.actionId || record.state !== "APPROVAL_REQUIRED") return res.status(409).json({ error: "Approval is not currently available for this action" });
  const approval = session.approvals.find((item) => item.id === record.approvalId && item.status === "PENDING");
  const scenario = getScenario(record.action.scenarioId);
  const workCase = caseForScenario(session.cases, record.action.scenarioId);
  if (!approval || !scenario || !workCase || approval.actionId !== record.action.id || approval.caseId !== workCase.id
      || approval.evidenceVersion !== evidenceVersionFor(scenario.evidence) || approval.caseVersion !== workCase.version) {
    return res.status(409).json({ error: "Approval is stale or is not bound to this case, action, and evidence version" });
  }
  if (evaluate_action(record.action, scenario.evidence, session.trust).authorization !== "APPROVAL_REQUIRED") {
    return res.status(409).json({ error: "Fresh server authorization no longer requires this approval" });
  }
  approval.status = "APPROVED";
  approval.decidedAt = new Date().toISOString();
  record.state = transition(record.state, "AUTHORIZED");
  addAudit(session, record, "HUMAN_AUTHORIZATION", "HUMAN", "APPROVED", "Human approval recorded");
  return completeExecution(session, record, res, true);
});

app.post("/api/actions/:actionId/reject", async (req, res) => {
  const session = await getSession(req, res);
  const record = session.currentAction;
  if (!record || record.action.id !== req.params.actionId || record.state !== "APPROVAL_REQUIRED") return res.status(409).json({ error: "Rejection is not currently available for this action" });
  record.state = transition(record.state, "BLOCKED");
  record.execution = { status: "CANCELLED", message: "Action cancelled by human decision." };
  const approval = session.approvals.find((item) => item.id === record.approvalId && item.status === "PENDING");
  if (!approval) return res.status(409).json({ error: "Approval has already been decided or is no longer valid" });
  approval.status = "REJECTED";
  approval.decidedAt = new Date().toISOString();
  addAudit(session, record, "HUMAN_REJECTION", "HUMAN", "REJECTED", "Action cancelled and recorded");
  const workCase = caseForScenario(session.cases, record.action.scenarioId);
  if (workCase) {
    workCase.status = "BLOCKED";
    workCase.lastAction = "Professional rejected the proposed resolution";
  }
  session.metrics.casesProcessed += 1;
  session.history.unshift(record);
  await saveSession(session);
  return res.json({ session, scenarios, message: "ACTION CANCELLED" });
});

app.post("/api/actions/:actionId/resolve", async (req, res) => {
  const session = await getSession(req, res);
  const record = session.currentAction;
  if (!record || record.action.id !== req.params.actionId || record.state !== "BLOCKED") {
    return res.status(409).json({ error: "No matching blocked action is awaiting resolution" });
  }
  const scenario = getScenario(record.action.scenarioId);
  if (!scenario?.hasConflict || record.evidenceVersion !== evidenceVersionFor(scenario.evidence)) {
    return res.status(409).json({ error: "The action evidence changed and must be evaluated again" });
  }
  const resolution = createResolution(session, record.action, scenario.evidence);
  const workCase = caseForScenario(session.cases, record.action.scenarioId);
  if (workCase) {
    workCase.status = "INVESTIGATING";
    workCase.lastAction = "Authoritative human resolution attached; re-evaluation required";
    workCase.version += 1;
    record.caseVersion = workCase.version;
  }
  session.activity = ["Human resolution received", "New authoritative approval attached", "Re-evaluating evidence…"];
  addAudit(session, record, "CONFLICT_RESOLVED", "HUMAN", "RESOLVED", `Server resolution ${resolution.id} bound to this action and evidence version`);
  await saveSession(session);
  return res.json({ session, scenarios, message: "Authoritative approval recorded for this exact action and evidence. Re-evaluate to continue." });
});

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientPath = path.resolve(__dirname, "../dist");
if (process.env.NODE_ENV === "production") {
  app.use(express.static(clientPath));
  app.use((_req, res) => res.sendFile(path.join(clientPath, "index.html")));
} else {
  const vite = await createViteServer({
    server: { middlewareMode: true, allowedHosts: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
}

const port = Number(process.env.PORT || 5000);
app.listen(port, "0.0.0.0", () => console.log(`VOUCH control center listening on ${port}`));