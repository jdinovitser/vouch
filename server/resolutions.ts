import { createHash } from "node:crypto";
import type { ActionRequest, EvidenceItem, ResolutionRecord, SessionState } from "../shared/types";

export function evidenceVersionFor(evidence: EvidenceItem[]) {
  const stableEvidence = evidence
    .map(({ id, authority, verification, confidence, content }) => ({ id, authority, verification, confidence, content }))
    .sort((a, b) => a.id.localeCompare(b.id));
  return createHash("sha256").update(JSON.stringify(stableEvidence)).digest("hex");
}

export function createResolution(session: SessionState, action: ActionRequest, evidence: EvidenceItem[]): ResolutionRecord {
  const evidenceVersion = evidenceVersionFor(evidence);
  const record: ResolutionRecord = {
    id: crypto.randomUUID(),
    sessionId: session.sessionId,
    actionId: action.id,
    scenarioId: action.scenarioId,
    evidenceVersion,
    evidenceRefs: evidence.map((item) => item.id),
    decision: "RESOLVED",
    resultingAuthorization: "EXECUTE",
    timestamp: new Date().toISOString(),
  };
  session.resolutions = session.resolutions.filter((item) =>
    item.actionId !== action.id || item.evidenceVersion !== evidenceVersion || Boolean(item.consumedAt)
  );
  session.resolutions.unshift(record);
  return record;
}

export function validResolutionFor(
  session: SessionState,
  action: ActionRequest,
  evidence: EvidenceItem[],
  _clientBody?: unknown,
) {
  const evidenceVersion = evidenceVersionFor(evidence);
  return session.resolutions.find((item) =>
    !item.consumedAt
    && item.sessionId === session.sessionId
    && item.actionId === action.id
    && item.scenarioId === action.scenarioId
    && item.evidenceVersion === evidenceVersion
  );
}

export function consumeResolution(record: ResolutionRecord) {
  record.consumedAt = new Date().toISOString();
}