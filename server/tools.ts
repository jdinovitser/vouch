import type { ActionRequest, AgentTrust, EvidenceItem, ExecutionResult, VerificationResult } from "../shared/types";
import { evaluateAction } from "./policy";

export const get_evidence = (evidence: EvidenceItem[]) => ({ sources: evidence, sourceCount: evidence.length });
export const check_authority = (evidence: EvidenceItem[]) => ({
  authoritative: evidence.filter((item) => item.authority === "AUTHORITATIVE"),
  conflicts: evidence.filter((item) => item.verification === "CONFLICTING" || item.authority === "UNTRUSTED"),
});
export const assess_risk = (action: ActionRequest) => ({ level: action.risk, reversibility: action.reversibility });
export const check_policy = (evidence: EvidenceItem[]) => ({ pass: !evidence.some((item) => item.authority === "AUTHORITATIVE" && item.verification !== "VERIFIED") });
export const evaluate_action = (action: ActionRequest, evidence: EvidenceItem[], trust: AgentTrust, resolved = false) => evaluateAction(action, evidence, trust, resolved);
export const execute_action = (action: ActionRequest): ExecutionResult => ({ status: "EXECUTED", message: `${action.title} executed in the controlled demo environment.`, actualState: action.expectedOutcome });
export const verify_outcome = (expected: string, actual: string): VerificationResult => ({
  status: expected === actual ? "PASS" : "FAIL",
  expected,
  actual,
  message: expected === actual ? "The resulting state matches the expected outcome." : "The requested account state does not match the expected post-action state.",
});
export const update_trust = (status: "PASS" | "FAIL") => ({ delta: status === "PASS" ? 1 : -15 });
export const request_human_approval = (actionId: string) => ({ actionId, required: true });