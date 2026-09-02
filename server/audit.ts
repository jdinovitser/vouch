import type { ActionRecord, AuditEvent, SessionState } from "../shared/types";

export function auditFor(session: SessionState, record: ActionRecord, type: string, actor: "VOUCH" | "HUMAN", status: string, result: string): AuditEvent {
  const latestTrustEvent = session.trustHistory[0];
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
    caseId: record.caseId,
    model: record.agentRecommendation?.model,
    traceId: record.agentRecommendation?.traceId,
    expectedState: record.verification?.expected,
    observedState: record.verification?.actual,
    agentRecommendation: record.agentRecommendation,
    authorization: record.decision?.authorization,
    verification: record.verification,
    trustChange: record.trustImpact === undefined ? undefined : {
      from: session.trust.score - record.trustImpact,
      to: session.trust.score,
      autonomyFrom: latestTrustEvent?.autonomyFrom ?? session.trust.autonomy,
      autonomyTo: session.trust.autonomy,
      authorityFrom: latestTrustEvent?.authorityFrom ?? session.trust.autonomousLimit,
      authorityTo: latestTrustEvent?.authorityTo ?? session.trust.autonomousLimit,
    },
  };
}