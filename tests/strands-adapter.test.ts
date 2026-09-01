import { afterEach, describe, expect, it, vi } from "vitest";
import { runStrandsEvaluation } from "../server/agent/strands";
import { getScenario } from "../server/scenarios";
import { initialTrust } from "../server/trust";

const original = {
  enabled: process.env.VOUCH_ENABLE_AWS,
  region: process.env.AWS_REGION,
  model: process.env.BEDROCK_MODEL_ID,
};

afterEach(() => {
  process.env.VOUCH_ENABLE_AWS = original.enabled;
  process.env.AWS_REGION = original.region;
  process.env.BEDROCK_MODEL_ID = original.model;
});

describe("Strands + Bedrock adapter", () => {
  const scenario = getScenario("safe-review")!;

  it("uses deterministic demo mode when AWS is not configured", async () => {
    delete process.env.VOUCH_ENABLE_AWS;
    const liveInvoker = vi.fn();
    const result = await runStrandsEvaluation(scenario.action, scenario.evidence, initialTrust(), false, liveInvoker);
    expect(liveInvoker).not.toHaveBeenCalled();
    expect(result.service).toMatchObject({ mode: "DEMO", available: true });
    expect(result.recommendation.provider).toBe("DEMO");
  });

  it("reports AWS LIVE only after a successful Strands invocation", async () => {
    process.env.VOUCH_ENABLE_AWS = "true";
    process.env.AWS_REGION = "us-east-1";
    process.env.BEDROCK_MODEL_ID = "test-bedrock-model";
    const result = await runStrandsEvaluation(scenario.action, scenario.evidence, initialTrust(), false, async () => ({
      proposedAction: scenario.action.title,
      recommendation: "APPROVE",
      summary: "Live recommendation",
      reasoning: "Evidence aligned",
      evidenceRefs: scenario.evidence.map((item) => item.id),
      confidence: 97,
      requestedAuthority: "AUTONOMOUS",
      traceId: "trace-live",
      toolCalls: ["inspect_action", "inspect_evidence"],
    }));
    expect(result.service.mode).toBe("AWS_LIVE");
    expect(result.recommendation.provider).toBe("AWS_LIVE");
  });

  it("does not masquerade as AWS LIVE after a failed invocation", async () => {
    process.env.VOUCH_ENABLE_AWS = "true";
    process.env.AWS_REGION = "us-east-1";
    process.env.BEDROCK_MODEL_ID = "test-bedrock-model";
    const result = await runStrandsEvaluation(scenario.action, scenario.evidence, initialTrust(), false, async () => {
      throw new Error("simulated Bedrock failure");
    });
    expect(result.service).toMatchObject({ mode: "DEMO", available: false });
    expect(result.recommendation.provider).toBe("DEMO");
  });
});