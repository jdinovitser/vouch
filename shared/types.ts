export type AutonomyLevel = "T1" | "T2" | "T3" | "T4";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type AuthorityLevel = "AUTHORITATIVE" | "TRUSTED" | "SUPPORTING" | "UNTRUSTED";
export type VerificationState = "VERIFIED" | "UNVERIFIED" | "CONFLICTING" | "FLAGGED";
export type Reversibility = "REVERSIBLE" | "PARTIALLY_REVERSIBLE" | "IRREVERSIBLE";
export type WorkflowState =
  | "REQUESTED" | "INVESTIGATING" | "EVIDENCE_COLLECTED" | "CONFLICT_DETECTED"
  | "RISK_ASSESSED" | "AUTHORITY_EVALUATED" | "APPROVAL_REQUIRED" | "BLOCKED"
  | "AUTHORIZED" | "EXECUTING" | "VERIFYING" | "VERIFIED" | "VERIFICATION_FAILED"
  | "TRUST_UPDATED";
export type AuthorizationDecision = "EXECUTE" | "APPROVAL_REQUIRED" | "BLOCKED";
export type ActionResult = "PENDING" | "EXECUTED" | "CANCELLED" | "FAILED";

export interface AgentTrust {
  score: number;
  autonomy: AutonomyLevel;
  verifiedActions: number;
  verificationFailures: number;
  blockedUnsafeActions: number;
  reliability: number;
  lastChange: number;
}

export interface EvidenceItem {
  id: string;
  source: string;
  sourceType: string;
  authority: AuthorityLevel;
  timestamp: string;
  content: string;
  verification: VerificationState;
  relevance: number;
  confidence: number;
  finding: string;
}

export interface ActionRequest {
  id: string;
  title: string;
  detail: string;
  scenarioId: string;
  risk: RiskLevel;
  reversibility: Reversibility;
  expectedOutcome: string;
}

export interface ActionDecision {
  authorization: AuthorizationDecision;
  reason: string;
  recommendation: "APPROVE" | "HOLD" | "REJECT";
  confidence: number;
  policy: "PASS" | "FAIL";
  authority: string;
}

export interface ExecutionResult {
  status: ActionResult;
  message: string;
  actualState?: string;
}

export interface VerificationResult {
  status: "PASS" | "FAIL";
  expected: string;
  actual: string;
  message: string;
}

export interface TrustEvent {
  id: string;
  timestamp: string;
  from: number;
  to: number;
  reason: string;
  autonomyFrom: AutonomyLevel;
  autonomyTo: AutonomyLevel;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  type: string;
  actionId: string;
  actor: "VOUCH" | "HUMAN";
  status: string;
  evidenceRefs: string[];
  risk: RiskLevel;
  authority: string;
  result: string;
}

export interface DemoScenario {
  id: string;
  name: string;
  shortName: string;
  description: string;
  accent: "green" | "red" | "amber" | "purple";
  action: ActionRequest;
  evidence: EvidenceItem[];
  initialState: WorkflowState;
  failVerification?: boolean;
  hasConflict?: boolean;
  hasInjection?: boolean;
}

export interface ActionRecord {
  action: ActionRequest;
  state: WorkflowState;
  decision?: ActionDecision;
  execution?: ExecutionResult;
  verification?: VerificationResult;
  trustImpact?: number;
  createdAt: string;
}

export interface SessionState {
  trust: AgentTrust;
  activeScenarioId: string;
  currentAction?: ActionRecord;
  history: ActionRecord[];
  evidence: EvidenceItem[];
  approvals: string[];
  audit: AuditEvent[];
  trustHistory: TrustEvent[];
  activity: string[];
  service: { mode: "DEMO" | "AWS"; available: boolean; message: string };
}

export interface ScenarioResponse {
  session: SessionState;
  message: string;
}