import type { WorkflowState } from "../shared/types";

const transitions: Record<WorkflowState, WorkflowState[]> = {
  REQUESTED: ["INVESTIGATING"],
  INVESTIGATING: ["EVIDENCE_COLLECTED"],
  EVIDENCE_COLLECTED: ["CONFLICT_DETECTED", "RISK_ASSESSED"],
  CONFLICT_DETECTED: ["BLOCKED", "RISK_ASSESSED"],
  RISK_ASSESSED: ["AUTHORITY_EVALUATED"],
  AUTHORITY_EVALUATED: ["APPROVAL_REQUIRED", "AUTHORIZED", "BLOCKED"],
  APPROVAL_REQUIRED: ["AUTHORIZED", "BLOCKED"],
  BLOCKED: ["INVESTIGATING"],
  AUTHORIZED: ["EXECUTING"],
  EXECUTING: ["VERIFYING"],
  VERIFYING: ["VERIFIED", "VERIFICATION_FAILED"],
  VERIFIED: ["TRUST_UPDATED"],
  VERIFICATION_FAILED: ["TRUST_UPDATED"],
  TRUST_UPDATED: [],
};

export function canTransition(from: WorkflowState, to: WorkflowState) {
  return transitions[from].includes(to);
}

export function transition(from: WorkflowState, to: WorkflowState) {
  if (!canTransition(from, to)) throw new Error(`Invalid workflow transition: ${from} → ${to}`);
  return to;
}