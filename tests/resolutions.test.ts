import { describe, expect, it } from "vitest";
import type { SessionState } from "../shared/types";
import { evaluateAction } from "../server/policy";
import { consumeResolution, createResolution, validResolutionFor } from "../server/resolutions";
import { getScenario } from "../server/scenarios";
import { initialTrust } from "../server/trust";

function session(sessionId = "session-a"): SessionState {
  return {
    sessionId,
    trust: initialTrust(),
    activeScenarioId: "conflicting-refund",
    history: [],
    evidence: [],
    approvals: [],
    resolutions: [],
    audit: [],
    trustHistory: [],
    activity: [],
    service: { mode: "DEMO", available: true, message: "DEMO — Deterministic VOUCH Evaluator" },
  };
}

describe("server-bound conflict resolution", () => {
  const conflict = getScenario("conflicting-refund")!;

  it("ignores a client supplied resolved flag without a server record", () => {
    const state = session();
    expect(validResolutionFor(state, conflict.action, conflict.evidence, { resolved: true })).toBeUndefined();
    expect(evaluateAction(conflict.action, conflict.evidence, state.trust, false).authorization).toBe("BLOCKED");
  });

  it("allows the exact action after the server creates a resolution", () => {
    const state = session();
    createResolution(state, conflict.action, conflict.evidence);
    expect(validResolutionFor(state, conflict.action, conflict.evidence)).toBeDefined();
    expect(evaluateAction(conflict.action, conflict.evidence, state.trust, true).authorization).toBe("EXECUTE");
  });

  it("does not apply an Action A resolution to Action B", () => {
    const state = session();
    const safe = getScenario("safe-review")!;
    createResolution(state, conflict.action, conflict.evidence);
    expect(validResolutionFor(state, safe.action, safe.evidence)).toBeUndefined();
  });

  it("does not replay a consumed resolution", () => {
    const state = session();
    const resolution = createResolution(state, conflict.action, conflict.evidence);
    consumeResolution(resolution);
    expect(validResolutionFor(state, conflict.action, conflict.evidence)).toBeUndefined();
  });

  it("rejects a resolution after the evidence version changes", () => {
    const state = session();
    createResolution(state, conflict.action, conflict.evidence);
    const changedEvidence = conflict.evidence.map((item, index) => index === 0 ? { ...item, content: `${item.content} Updated.` } : item);
    expect(validResolutionFor(state, conflict.action, changedEvidence)).toBeUndefined();
  });

  it("keeps normal safe actions working without a resolution", () => {
    const state = session();
    const safe = getScenario("safe-review")!;
    expect(evaluateAction(safe.action, safe.evidence, state.trust).authorization).toBe("EXECUTE");
  });
});