import type { ActionDecision, ActionRequest, AgentTrust, EvidenceItem } from "../shared/types";
import { getAutonomyLabel, autonomyRank } from "./trust";

export function averageConfidence(evidence: EvidenceItem[]) {
  if (!evidence.length) return 0;
  return Math.round(evidence.reduce((sum, item) => sum + item.confidence, 0) / evidence.length);
}

export function evaluateAction(action: ActionRequest, evidence: EvidenceItem[], trust: AgentTrust, resolved = false): ActionDecision {
  const confidence = averageConfidence(evidence);
  const requestedAmount = action.expectedRefundAmount;
  const authorityStatus = requestedAmount === undefined
    ? "NOT_APPLICABLE"
    : requestedAmount > trust.autonomousLimit ? "EXCEEDS_LIMIT" : "WITHIN_LIMIT";
  const authorityContext = { requestedAmount, autonomousLimit: trust.autonomousLimit, authorityStatus } as const;
  const hasUntrustedInstruction = evidence.some((item) => item.authority === "UNTRUSTED" && item.verification === "FLAGGED");
  const hasConflict = evidence.some((item) => item.verification === "CONFLICTING");
  const hasAuthoritativeFailure = evidence.some((item) => item.authority === "AUTHORITATIVE" && item.verification !== "VERIFIED");
  const hasCapViolation = action.scenarioId === "conflicting-refund" && !resolved;
  const conflict = !resolved && (hasConflict || hasAuthoritativeFailure || hasCapViolation);

  if (hasUntrustedInstruction) {
    return {
      authorization: "BLOCKED",
      recommendation: "REJECT",
      confidence,
      policy: "FAIL",
      authority: `${getAutonomyLabel(trust.autonomy)} · untrusted instruction cannot override policy`,
      ...authorityContext,
      reason: "The instruction originated from an untrusted evidence source and cannot override authorization policy.",
    };
  }
  if (conflict) {
    return {
      authorization: "BLOCKED",
      recommendation: "HOLD",
      confidence,
      policy: "FAIL",
      authority: `${getAutonomyLabel(trust.autonomy)} · authoritative conflict`,
      ...authorityContext,
      reason: resolved
        ? "Evidence is still unresolved. VOUCH requires an authoritative approval record before this action can proceed."
        : "Authoritative policy supports $1,000, while a secondary communication references $1,240. No updated approval confirms the change.",
    };
  }

  if (resolved && action.scenarioId === "conflicting-refund") {
    return {
      authorization: "EXECUTE",
      recommendation: "APPROVE",
      confidence: 98,
      policy: "PASS",
      authority: `${getAutonomyLabel(trust.autonomy)} · human-authorized exception`,
      ...authorityContext,
      reason: "A verified director approval resolves the previous conflict and authorizes this specific transaction.",
    };
  }

  const exceedsEarnedLimit = requestedAmount !== undefined && requestedAmount > trust.autonomousLimit;
  const requiresPolicyApproval = action.scenarioId === "human-refund" && requestedAmount !== undefined && requestedAmount > 500;
  if (exceedsEarnedLimit || requiresPolicyApproval) {
    return {
      authorization: "APPROVAL_REQUIRED",
      recommendation: "APPROVE",
      confidence,
      policy: "PASS",
      authority: `${getAutonomyLabel(trust.autonomy)} · $${trust.autonomousLimit.toLocaleString()} autonomous limit`,
      ...authorityContext,
      reason: exceedsEarnedLimit
        ? `AUTHORITY NOT EARNED: Requested $${requestedAmount.toLocaleString()} exceeds current earned autonomous authority of $${trust.autonomousLimit.toLocaleString()}. Human authorization is required.`
        : "The evidence supports this refund, but policy requires human authorization for amounts above $500.",
    };
  }

  const autonomyAllows = action.risk === "LOW"
    ? autonomyRank(trust.autonomy) >= 2
    : action.risk === "MEDIUM" && autonomyRank(trust.autonomy) >= 3 && confidence >= 90;
  if (action.risk === "HIGH" || !autonomyAllows || action.reversibility === "IRREVERSIBLE") {
    return {
      authorization: "APPROVAL_REQUIRED",
      recommendation: "APPROVE",
      confidence,
      policy: "PASS",
      authority: `${getAutonomyLabel(trust.autonomy)} · authority threshold`,
      ...authorityContext,
      reason: action.risk === "HIGH"
        ? "High-risk and irreversible actions require explicit human authorization."
        : "The evidence supports this recommendation, but it exceeds the current autonomous authority threshold.",
    };
  }
  return {
    authorization: "EXECUTE",
    recommendation: "APPROVE",
    confidence,
    policy: "PASS",
    authority: `${getAutonomyLabel(trust.autonomy)} · $${trust.autonomousLimit.toLocaleString()} autonomous limit`,
    ...authorityContext,
    reason: "Evidence is aligned, the action is within policy, and current authority permits autonomous execution.",
  };
}