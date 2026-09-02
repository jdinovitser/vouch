import { describe, expect, it } from "vitest";
import { scenarios } from "../server/scenarios";
import { evaluateAction } from "../server/policy";
import { initialTrust, updateTrust } from "../server/trust";
import { transition } from "../server/state-machine";
import { canRunRecovery, canRunRestoredAction } from "../server/recovery";
import type { SessionState } from "../shared/types";

describe("VOUCH authority engine", () => {
  it("permits low-risk reversible actions at T2", () => {
    const scenario = scenarios.find((item) => item.id === "safe-review")!;
    expect(evaluateAction(scenario.action, scenario.evidence, initialTrust()).authorization).toBe("EXECUTE");
  });

  it("blocks conflicting authoritative evidence", () => {
    const scenario = scenarios.find((item) => item.id === "conflicting-refund")!;
    expect(evaluateAction(scenario.action, scenario.evidence, initialTrust()).authorization).toBe("BLOCKED");
  });

  it("does not treat an untrusted instruction as authority", () => {
    const scenario = scenarios.find((item) => item.id === "prompt-injection")!;
    const result = evaluateAction(scenario.action, scenario.evidence, initialTrust());
    expect(result.authorization).toBe("BLOCKED");
    expect(result.reason).toContain("untrusted evidence source");
  });

  it("requires human approval for policy-threshold actions", () => {
    const scenario = scenarios.find((item) => item.id === "human-refund")!;
    expect(evaluateAction(scenario.action, scenario.evidence, initialTrust()).authorization).toBe("APPROVAL_REQUIRED");
  });

  it("does not turn high trust into autonomous high-risk authority", () => {
    const scenario = scenarios.find((item) => item.id === "safe-review")!;
    const highTrust = { ...initialTrust(), score: 100, autonomy: "T4" as const };
    const highRiskAction = { ...scenario.action, id: "high-risk-action", risk: "HIGH" as const };
    expect(evaluateAction(highRiskAction, scenario.evidence, highTrust).authorization).toBe("APPROVAL_REQUIRED");
  });

  it("lets current safety policy override previously earned standing", () => {
    const scenario = scenarios.find((item) => item.id === "prompt-injection")!;
    const highTrust = { ...initialTrust(), score: 100, autonomy: "T4" as const };
    expect(evaluateAction(scenario.action, scenario.evidence, highTrust).authorization).toBe("BLOCKED");
  });

  it("does not treat past standing as approval for a fresh policy-bound request", () => {
    const scenario = scenarios.find((item) => item.id === "human-refund")!;
    const highTrust = { ...initialTrust(), score: 100, autonomy: "T4" as const };
    expect(evaluateAction(scenario.action, scenario.evidence, highTrust).authorization).toBe("APPROVAL_REQUIRED");
  });

  it("authorizes the specific action after authoritative conflict resolution", () => {
    const scenario = scenarios.find((item) => item.id === "conflicting-refund")!;
    expect(evaluateAction(scenario.action, scenario.evidence, initialTrust(), true).authorization).toBe("EXECUTE");
  });

  it("increases trust slowly after verified outcomes", () => {
    const start = initialTrust();
    const result = updateTrust(start, { status: "PASS", expected: "Approved", actual: "Approved", message: "verified" }, "Successful verified action");
    expect(result.trust.score).toBe(start.score + 1);
    expect(result.trust.autonomy).toBe("T3");
    expect(result.trust.autonomousLimit).toBe(500);
    expect(result.event).toMatchObject({ authorityFrom: 250, authorityTo: 500 });
  });

  it("demotes authority immediately after verification failure", () => {
    const result = updateTrust(initialTrust(), { status: "FAIL", expected: "Approved", actual: "Pending", message: "failed" }, "Verification failure");
    expect(result.trust.score).toBe(69);
    expect(result.trust.autonomy).toBe("T1");
    expect(result.trust.autonomousLimit).toBe(100);
  });

  it("changes a future permission after trust and autonomy fall", () => {
    const scenario = scenarios.find((item) => item.id === "verification-failure")!;
    const earned = updateTrust(initialTrust(), { status: "PASS", expected: "Approved", actual: "Approved", message: "verified" }, "Authority earned");
    expect(evaluateAction(scenario.action, scenario.evidence, earned.trust).authorization).toBe("EXECUTE");
    const demoted = updateTrust(earned.trust, { status: "FAIL", expected: "Approved", actual: "Pending", message: "failed" }, "Verification failure");
    expect(evaluateAction(scenario.action, scenario.evidence, demoted.trust).authorization).toBe("APPROVAL_REQUIRED");
    expect(evaluateAction(scenario.action, scenario.evidence, demoted.trust)).toMatchObject({
      authorityStatus: "EXCEEDS_LIMIT",
      requestedAmount: 124,
      autonomousLimit: 100,
    });
  });

  it("uses persisted earned dollar authority in the next higher-value decision", () => {
    const routine = scenarios.find((item) => item.id === "safe-review")!;
    const exception = scenarios.find((item) => item.id === "human-refund")!;
    const earned = updateTrust(
      initialTrust(),
      { status: "PASS", expected: "Resolved", actual: "Resolved", message: "verified" },
      "Successful verified action · authority earned",
    );
    expect(evaluateAction(routine.action, routine.evidence, earned.trust).authorization).toBe("EXECUTE");
    expect(evaluateAction(exception.action, exception.evidence, earned.trust)).toMatchObject({
      authorization: "APPROVAL_REQUIRED",
      authorityStatus: "EXCEEDS_LIMIT",
      requestedAmount: 1240,
      autonomousLimit: 500,
    });
  });

  it("does not increase autonomous authority for human-authorized work", () => {
    const result = updateTrust(
      { ...initialTrust(), autonomousLimit: 500 },
      { status: "PASS", expected: "Resolved", actual: "Resolved", message: "verified" },
      "Human-authorized action verified",
      { qualifiesForAuthority: false },
    );
    expect(result.trust.autonomousLimit).toBe(500);
  });

  it("restores ACT authority after a verified recovery sequence", () => {
    const earned = updateTrust(initialTrust(), { status: "PASS", expected: "Approved", actual: "Approved", message: "verified" }, "Authority earned");
    const demoted = updateTrust(earned.trust, { status: "FAIL", expected: "Approved", actual: "Pending", message: "failed" }, "Verification failure");
    const recovered = updateTrust(demoted.trust, { status: "PASS", expected: "3 of 3", actual: "3 of 3", message: "verified" }, "Recovery verified", { recovery: true });
    expect(recovered.trust.score).toBe(85);
    expect(recovered.trust.autonomy).toBe("T3");
  });

  it("demotes one authority level even when the remaining score is high", () => {
    const result = updateTrust(
      { ...initialTrust(), score: 100, autonomy: "T3" },
      { status: "FAIL", expected: "Approved", actual: "Pending", message: "failed" },
      "Verification failure",
    );
    expect(result.trust.score).toBe(85);
    expect(result.trust.autonomy).toBe("T2");
  });

  it("rejects recovery until failure and reduced-authority reevaluation are server-held", () => {
    const session = {
      trust: initialTrust(),
      history: [],
      currentAction: undefined,
    } as unknown as SessionState;
    expect(canRunRecovery(session)).toBe(false);
    session.trust = { ...session.trust, autonomy: "T2", verificationFailures: 1 };
    session.history = [{
      action: { id: "failed", title: "Update account", detail: "", scenarioId: "verification-failure", risk: "MEDIUM", reversibility: "PARTIALLY_REVERSIBLE", expectedOutcome: "Approved" },
      state: "TRUST_UPDATED",
      createdAt: new Date().toISOString(),
      evidenceVersion: "failed-evidence",
      verification: { status: "FAIL", expected: "Approved", actual: "Pending", message: "failed" },
    }];
    expect(canRunRecovery(session)).toBe(false);
    session.currentAction = {
      action: { ...session.history[0].action },
      state: "APPROVAL_REQUIRED",
      createdAt: new Date().toISOString(),
      evidenceVersion: "retry-evidence",
    };
    expect(canRunRecovery(session)).toBe(true);
    expect(canRunRestoredAction(session)).toBe(false);
  });
});

describe("workflow state machine", () => {
  it("rejects an invalid transition from blocked to executing", () => {
    expect(() => transition("BLOCKED", "EXECUTING")).toThrow("Invalid workflow transition");
  });

  it("requires approval before execution", () => {
    expect(() => transition("APPROVAL_REQUIRED", "EXECUTING")).toThrow("Invalid workflow transition");
    expect(transition("APPROVAL_REQUIRED", "AUTHORIZED")).toBe("AUTHORIZED");
  });
});