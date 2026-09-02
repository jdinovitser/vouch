import { describe, expect, it } from "vitest";
import { approvalAllowsExecution } from "../server/approval";
import { initialCases } from "../server/cases";
import type { ActionRecord, ApprovalRecord } from "../shared/types";

const workCase = initialCases()[2];
const record: ActionRecord = {
  action: {
    id: "action-one",
    scenarioId: workCase.scenarioId,
    title: "Issue refund",
    detail: "Bound case",
    risk: "MEDIUM",
    reversibility: "PARTIALLY_REVERSIBLE",
    expectedOutcome: "Refund recorded",
  },
  state: "APPROVAL_REQUIRED",
  createdAt: new Date().toISOString(),
  evidenceVersion: "evidence-v1",
  caseId: workCase.id,
  caseVersion: workCase.version,
  approvalId: "approval-one",
};
const approval: ApprovalRecord = {
  id: "approval-one",
  sessionId: "session-one",
  actionId: record.action.id,
  caseId: workCase.id,
  evidenceVersion: record.evidenceVersion,
  caseVersion: workCase.version,
  status: "APPROVED",
  createdAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 60_000).toISOString(),
};

describe("human approval boundary", () => {
  it("accepts only the exact approved action, case, evidence, and case version", () => {
    expect(approvalAllowsExecution(approval, "session-one", record, workCase, "evidence-v1")).toBe(true);
  });

  it("rejects replayed approvals", () => {
    expect(approvalAllowsExecution({ ...approval, status: "CONSUMED" }, "session-one", record, workCase, "evidence-v1")).toBe(false);
  });

  it("rejects stale evidence and changed case state", () => {
    expect(approvalAllowsExecution(approval, "session-one", record, workCase, "evidence-v2")).toBe(false);
    expect(approvalAllowsExecution(approval, "session-one", record, { ...workCase, version: workCase.version + 1 }, "evidence-v1")).toBe(false);
  });

  it("rejects an approval copied to another action", () => {
    expect(approvalAllowsExecution(approval, "session-one", { ...record, action: { ...record.action, id: "action-two" } }, workCase, "evidence-v1")).toBe(false);
  });

  it("rejects approvals from another session or case", () => {
    expect(approvalAllowsExecution(approval, "session-two", record, workCase, "evidence-v1")).toBe(false);
    expect(approvalAllowsExecution({ ...approval, caseId: "case-other" }, "session-one", record, workCase, "evidence-v1")).toBe(false);
  });

  it("rejects expired approvals", () => {
    expect(approvalAllowsExecution({ ...approval, expiresAt: new Date(Date.now() - 1).toISOString() }, "session-one", record, workCase, "evidence-v1")).toBe(false);
  });
});