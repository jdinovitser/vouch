import { describe, expect, it } from "vitest";
import { scenarios } from "../server/scenarios";
import { evaluateAction } from "../server/policy";
import { initialTrust, updateTrust } from "../server/trust";
import { transition } from "../server/state-machine";

describe("VOUCH authority engine", () => {
  it("permits low-risk reversible actions at T3", () => {
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

  it("authorizes the specific action after authoritative conflict resolution", () => {
    const scenario = scenarios.find((item) => item.id === "conflicting-refund")!;
    expect(evaluateAction(scenario.action, scenario.evidence, initialTrust(), true).authorization).toBe("EXECUTE");
  });

  it("increases trust slowly after verified outcomes", () => {
    const start = initialTrust();
    const result = updateTrust(start, { status: "PASS", expected: "Approved", actual: "Approved", message: "verified" }, "Successful verified action");
    expect(result.trust.score).toBe(start.score + 1);
  });

  it("demotes authority immediately after verification failure", () => {
    const result = updateTrust(initialTrust(), { status: "FAIL", expected: "Approved", actual: "Pending", message: "failed" }, "Verification failure");
    expect(result.trust.score).toBe(72);
    expect(result.trust.autonomy).toBe("T2");
  });

  it("changes a future permission after trust and autonomy fall", () => {
    const scenario = scenarios.find((item) => item.id === "verification-failure")!;
    expect(evaluateAction(scenario.action, scenario.evidence, initialTrust()).authorization).toBe("EXECUTE");
    const demoted = updateTrust(initialTrust(), { status: "FAIL", expected: "Approved", actual: "Pending", message: "failed" }, "Verification failure");
    expect(evaluateAction(scenario.action, scenario.evidence, demoted.trust).authorization).toBe("APPROVAL_REQUIRED");
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