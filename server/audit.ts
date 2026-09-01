import type { ActionRecord, AuditEvent } from "../shared/types";

export function auditFor(record: ActionRecord, type: string, actor: "VOUCH" | "HUMAN", status: string, result: string): AuditEvent {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    type,
    actionId: record.action.id,
    actor,
    status,
    evidenceRefs: [],
    risk: record.action.risk,
    authority: record.decision?.authority ?? "pending",
    result,
  };
}