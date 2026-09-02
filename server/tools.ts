import type { ActionRequest, AgentTrust, ClaimsCase, EvidenceItem, ExecutionResult, VerificationResult } from "../shared/types";
import { evaluateAction } from "./policy";

export const get_evidence = (evidence: EvidenceItem[]) => ({ sources: evidence, sourceCount: evidence.length });
export const check_authority = (evidence: EvidenceItem[]) => ({
  authoritative: evidence.filter((item) => item.authority === "AUTHORITATIVE"),
  conflicts: evidence.filter((item) => item.verification === "CONFLICTING" || item.authority === "UNTRUSTED"),
});
export const assess_risk = (action: ActionRequest) => ({ level: action.risk, reversibility: action.reversibility });
export const check_policy = (evidence: EvidenceItem[]) => ({ pass: !evidence.some((item) => item.authority === "AUTHORITATIVE" && item.verification !== "VERIFIED") });
export const evaluate_action = (action: ActionRequest, evidence: EvidenceItem[], trust: AgentTrust, resolved = false) => evaluateAction(action, evidence, trust, resolved);
export const execute_action = (action: ActionRequest): ExecutionResult => ({ status: "EXECUTED", message: `${action.title} executed by the protected server mutation boundary.`, actualState: action.expectedOutcome });
export const execute_case_action = (action: ActionRequest, workCase: ClaimsCase, simulateFailure = false): ExecutionResult => {
  workCase.status = action.expectedCaseStatus ?? "RESOLVED";
  workCase.refundAmount = simulateFailure ? 0 : action.expectedRefundAmount ?? workCase.refundAmount;
  workCase.resolution = action.expectedOutcome;
  workCase.resolutionNote = simulateFailure
    ? "Resolution command returned successfully, but the claims ledger did not record the expected refund."
    : `${action.title} completed through the protected server boundary.`;
  workCase.lastAction = "Protected case mutation committed; awaiting independent verification";
  workCase.version += 1;
  return {
    status: "EXECUTED",
    message: `${action.title} committed to the durable claims record.`,
    actualState: `case.status=${workCase.status}; refund.amount=${workCase.refundAmount}`,
  };
};
export const verify_outcome = (expected: string, actual: string): VerificationResult => ({
  status: expected === actual ? "PASS" : "FAIL",
  expected,
  actual,
  message: expected === actual ? "The resulting state matches the expected outcome." : "The requested account state does not match the expected post-action state.",
});
export const verify_case_outcome = (action: ActionRequest, workCase: ClaimsCase): VerificationResult => {
  const expected = `case.status=${action.expectedCaseStatus ?? "RESOLVED"}; refund.amount=${action.expectedRefundAmount ?? workCase.refundAmount}`;
  const actual = `case.status=${workCase.status}; refund.amount=${workCase.refundAmount}`;
  return {
    status: expected === actual ? "PASS" : "FAIL",
    expected,
    actual,
    message: expected === actual
      ? "A fresh database query confirmed the resulting case and claims-ledger state."
      : "A fresh database query found that the resulting case or claims-ledger state does not match the authorized outcome.",
  };
};
export const update_trust = (status: "PASS" | "FAIL") => ({ delta: status === "PASS" ? 1 : -15 });
export const request_human_approval = (actionId: string) => ({ actionId, required: true });