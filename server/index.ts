import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import { scenarios, getScenario } from "./scenarios";
import { initialTrust, updateTrust } from "./trust";
import { auditFor } from "./audit";
import { transition } from "./state-machine";
import { execute_action, verify_outcome } from "./tools";
import { runStrandsEvaluation } from "./agent/strands";
import { consumeResolution, createResolution, evidenceVersionFor, validResolutionFor } from "./resolutions";
import type { ActionRecord, SessionState, WorkflowState } from "../shared/types";

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin ?? "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const sessions = new Map<string, SessionState>();
const getSession = (req: express.Request, res: express.Response) => {
  let id = req.headers["x-vouch-session"]?.toString();
  if (!id || !sessions.has(id)) {
    id = crypto.randomUUID();
    sessions.set(id, {
      sessionId: id,
      trust: initialTrust(),
      activeScenarioId: "conflicting-refund",
      history: [],
      evidence: [],
      approvals: [],
      resolutions: [],
      audit: [],
      trustHistory: [],
      activity: ["Control center initialized", "Demo mode active · deterministic tools ready"],
      service: { mode: "DEMO", available: true, message: "DEMO — Deterministic VOUCH Evaluator" },
    });
  }
  res.setHeader("x-vouch-session", id);
  return sessions.get(id)!;
};

function addAudit(session: SessionState, record: ActionRecord, type: string, actor: "VOUCH" | "HUMAN", status: string, result: string) {
  session.audit.unshift(auditFor(session, record, type, actor, status, result));
}

app.get("/api/scenarios", (_req, res) => res.json(scenarios.map(({ id, name, shortName, description, accent }) => ({ id, name, shortName, description, accent }))));
app.get("/api/session", (req, res) => res.json({ session: getSession(req, res), scenarios }));

app.post("/api/scenarios/:scenarioId/run", async (req, res) => {
  const session = getSession(req, res);
  const scenario = getScenario(req.params.scenarioId);
  if (!scenario) return res.status(404).json({ error: "Scenario not found" });
  const resolution = validResolutionFor(session, scenario.action, scenario.evidence, req.body);
  const hasServerResolution = Boolean(resolution);
  let state: WorkflowState = "REQUESTED";
  const record: ActionRecord = {
    action: scenario.action,
    state,
    createdAt: new Date().toISOString(),
    evidenceVersion: evidenceVersionFor(scenario.evidence),
  };
  session.activeScenarioId = scenario.id;
  session.evidence = [];
  session.currentAction = record;
  session.activity = ["Request received", "Investigating evidence sources…", "Checking authoritative sources…"];
  state = transition(state, "INVESTIGATING");
  state = transition(state, "EVIDENCE_COLLECTED");
  session.evidence = scenario.evidence;
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
    addAudit(session, record, "AUTHORITY_BLOCKED", "VOUCH", "BLOCKED", record.decision.reason);
    session.currentAction = record;
    return res.json({ session, scenarios, message: scenario.hasInjection ? "UNTRUSTED INSTRUCTION DETECTED" : "CONFLICT DETECTED" });
  }
  state = transition(state, "AUTHORITY_EVALUATED");
  record.state = state;
  const agentResult = await runStrandsEvaluation(scenario.action, scenario.evidence, session.trust, hasServerResolution);
  record.decision = agentResult.decision;
  record.agentRecommendation = agentResult.recommendation;
  session.service = agentResult.service;
  if (agentResult.decision.authorization === "APPROVAL_REQUIRED") {
    record.state = "APPROVAL_REQUIRED";
    session.activity = ["Evidence gathered", "Policy checked", "Risk assessed: " + scenario.action.risk, "Recommendation: APPROVE", "Waiting for human authorization"];
    addAudit(session, record, "APPROVAL_REQUESTED", "VOUCH", "PENDING", record.decision.reason);
    session.currentAction = record;
    return res.json({ session, scenarios, message: "HUMAN DECISION REQUIRED" });
  }
  if (resolution) consumeResolution(resolution);
  return completeExecution(session, record, res);
});

function completeExecution(session: SessionState, record: ActionRecord, res: express.Response) {
  if (record.state !== "AUTHORIZED") record.state = transition(record.state, "AUTHORIZED");
  record.state = transition(record.state, "EXECUTING");
  record.execution = execute_action(record.action);
  record.state = transition(record.state, "VERIFYING");
  const failed = record.action.scenarioId === "verification-failure";
  const actual = failed ? "Pending" : record.action.expectedOutcome;
  record.verification = verify_outcome(record.action.expectedOutcome, actual);
  record.state = transition(record.state, record.verification.status === "PASS" ? "VERIFIED" : "VERIFICATION_FAILED");
  const change = updateTrust(session.trust, record.verification, record.verification.status === "PASS" ? "Successful verified action" : "Verification failure · authority reduced");
  session.trust = change.trust;
  session.trustHistory.unshift(change.event);
  record.trustImpact = change.event.to - change.event.from;
  record.state = transition(record.state, "TRUST_UPDATED");
  session.activity = record.verification.status === "PASS"
    ? ["Authorization granted", "Executing action…", "Verifying outcome…", "Outcome verified", `Trust updated · ${change.event.from} → ${change.event.to}`]
    : ["Authorization granted", "Executing action…", "Verifying outcome…", "Verification failed", `Autonomy reduced · ${change.event.autonomyFrom} → ${change.event.autonomyTo}`];
  addAudit(session, record, "ACTION_COMPLETED", "VOUCH", record.verification.status, record.verification.message);
  session.history.unshift(record);
  session.currentAction = record;
  return res.json({ session, scenarios, message: record.verification.status === "PASS" ? "ACTION VERIFIED" : "VERIFICATION FAILED" });
}

app.post("/api/actions/:actionId/approve", (req, res) => {
  const session = getSession(req, res);
  const record = session.currentAction;
  if (!record || record.action.id !== req.params.actionId || record.state !== "APPROVAL_REQUIRED") return res.status(409).json({ error: "Approval is not currently available for this action" });
  session.approvals.push(record.action.id);
  record.state = transition(record.state, "AUTHORIZED");
  addAudit(session, record, "HUMAN_AUTHORIZATION", "HUMAN", "APPROVED", "Human approval recorded");
  return completeExecution(session, record, res);
});

app.post("/api/actions/:actionId/reject", (req, res) => {
  const session = getSession(req, res);
  const record = session.currentAction;
  if (!record || record.action.id !== req.params.actionId || record.state !== "APPROVAL_REQUIRED") return res.status(409).json({ error: "Rejection is not currently available for this action" });
  record.state = transition(record.state, "BLOCKED");
  record.execution = { status: "CANCELLED", message: "Action cancelled by human decision." };
  addAudit(session, record, "HUMAN_REJECTION", "HUMAN", "REJECTED", "Action cancelled and recorded");
  session.history.unshift(record);
  return res.json({ session, scenarios, message: "ACTION CANCELLED" });
});

app.post("/api/actions/:actionId/resolve", (req, res) => {
  const session = getSession(req, res);
  const record = session.currentAction;
  if (!record || record.action.id !== req.params.actionId || record.state !== "BLOCKED") {
    return res.status(409).json({ error: "No matching blocked action is awaiting resolution" });
  }
  const scenario = getScenario(record.action.scenarioId);
  if (!scenario?.hasConflict || record.evidenceVersion !== evidenceVersionFor(scenario.evidence)) {
    return res.status(409).json({ error: "The action evidence changed and must be evaluated again" });
  }
  const resolution = createResolution(session, record.action, scenario.evidence);
  session.activity = ["Human resolution received", "New authoritative approval attached", "Re-evaluating evidence…"];
  addAudit(session, record, "CONFLICT_RESOLVED", "HUMAN", "RESOLVED", `Server resolution ${resolution.id} bound to this action and evidence version`);
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