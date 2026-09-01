import type { SessionState } from "../shared/types";

export function canRunRecovery(session: SessionState) {
  const failedOutcomeExists = session.history.some(
    (record) => record.action.scenarioId === "verification-failure" && record.verification?.status === "FAIL",
  );
  const reducedAuthorityWasReevaluated =
    session.currentAction?.action.scenarioId === "verification-failure" &&
    session.currentAction.state === "APPROVAL_REQUIRED";

  return failedOutcomeExists && reducedAuthorityWasReevaluated && session.trust.autonomy === "T2";
}

export function canRunRestoredAction(session: SessionState) {
  return session.trust.autonomy === "T3" && session.history.some(
    (record) => record.action.scenarioId === "recovery-sequence" && record.verification?.status === "PASS",
  );
}