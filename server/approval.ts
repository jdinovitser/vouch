import type { ActionRecord, ApprovalRecord, ClaimsCase } from "../shared/types";

export function approvalAllowsExecution(
  approval: ApprovalRecord | undefined,
  record: ActionRecord,
  workCase: ClaimsCase | undefined,
  evidenceVersion: string,
) {
  return Boolean(
    approval
    && workCase
    && approval.status === "APPROVED"
    && approval.sessionId
    && approval.actionId === record.action.id
    && approval.caseId === workCase.id
    && approval.evidenceVersion === evidenceVersion
    && approval.caseVersion === workCase.version
    && record.approvalId === approval.id
    && record.caseId === workCase.id
    && record.caseVersion === workCase.version,
  );
}