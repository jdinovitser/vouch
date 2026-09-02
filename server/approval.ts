import type { ActionRecord, ApprovalRecord, ClaimsCase } from "../shared/types";

export function approvalAllowsExecution(
  approval: ApprovalRecord | undefined,
  sessionId: string,
  record: ActionRecord,
  workCase: ClaimsCase | undefined,
  evidenceVersion: string,
  now = Date.now(),
) {
  return Boolean(
    approval
    && workCase
    && approval.status === "APPROVED"
    && approval.sessionId === sessionId
    && Date.parse(approval.expiresAt) > now
    && approval.actionId === record.action.id
    && approval.caseId === workCase.id
    && approval.evidenceVersion === evidenceVersion
    && approval.caseVersion === workCase.version
    && record.approvalId === approval.id
    && record.caseId === workCase.id
    && record.caseVersion === workCase.version,
  );
}

export function approvalIsExpired(approval: ApprovalRecord | undefined, now = Date.now()) {
  return Boolean(approval && Date.parse(approval.expiresAt) <= now);
}