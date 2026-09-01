import type { ActionRecord, AuditEvent, SessionState } from "../shared/types";

export function auditFor(session: SessionState, record: ActionRecord, type: string, actor: "VOUCH" | "HUMAN", status: string, result: string): AuditEvent {
  return {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    type,
    actionId: record.action.id,
    actor,
    status,
    evidenceRefs: session.evidence.map((item) => item.id),
    risk: record.action.risk,
    authority: record.decision?.authority ?? "pending",
    result,
    sessionId: session.sessionId,
    agentRecommendation: record.agentRecommendation,
    authorization: record.decision?.authorization,
    verification: record.verification,
    trustChange: record.trustImpact === undefined ? undefined : {
      from: session.trust.score - record.trustImpact,
      to: session.trust.score,
      autonomyFrom: session.trustHistory[0]?.autonomyFrom ?? session.trust.autonomy,
      autonomyTo: session.trust.autonomy,
    },
  };
}