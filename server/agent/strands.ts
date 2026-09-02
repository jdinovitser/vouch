import { Agent, BedrockModel, tool } from "@strands-agents/sdk";
import { z } from "zod";
import type { ActionRequest, AgentRecommendation, AgentTrust, EvidenceItem, SessionState } from "../../shared/types";
import { assess_risk, check_authority, evaluate_action, get_evidence } from "../tools";

const recommendationSchema = z.object({
  proposedAction: z.string(),
  recommendation: z.enum(["APPROVE", "HOLD", "REJECT"]),
  summary: z.string(),
  reasoning: z.string(),
  evidenceRefs: z.array(z.string()),
  confidence: z.number().min(0).max(100),
  requestedAuthority: z.string(),
});

type RecommendationOutput = z.infer<typeof recommendationSchema>;
type LiveInvoker = (action: ActionRequest, evidence: EvidenceItem[]) => Promise<RecommendationOutput & {
  traceId: string;
  toolCalls: string[];
}>;

type AwsFailure = {
  name?: unknown;
  code?: unknown;
  message?: unknown;
  $metadata?: {
    httpStatusCode?: unknown;
    requestId?: unknown;
    extendedRequestId?: unknown;
    cfId?: unknown;
    attempts?: unknown;
    totalRetryDelay?: unknown;
  };
  $response?: {
    statusCode?: unknown;
  };
};

function logAwsFailure(error: unknown) {
  const failure = error as AwsFailure;
  const metadata = failure.$metadata;
  console.error("[VOUCH] Bedrock invocation failed", {
    name: typeof failure.name === "string" ? failure.name : undefined,
    code: typeof failure.code === "string" ? failure.code : undefined,
    httpStatus: typeof metadata?.httpStatusCode === "number"
      ? metadata.httpStatusCode
      : typeof failure.$response?.statusCode === "number"
        ? failure.$response.statusCode
        : undefined,
    message: error instanceof Error
      ? error.message
      : typeof failure.message === "string"
        ? failure.message
        : String(error),
    requestId: typeof metadata?.requestId === "string" ? metadata.requestId : undefined,
    extendedRequestId: typeof metadata?.extendedRequestId === "string" ? metadata.extendedRequestId : undefined,
    cfId: typeof metadata?.cfId === "string" ? metadata.cfId : undefined,
    attempts: typeof metadata?.attempts === "number" ? metadata.attempts : undefined,
    totalRetryDelay: typeof metadata?.totalRetryDelay === "number" ? metadata.totalRetryDelay : undefined,
  });
}

export function describeAwsFailure(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  if (/too many tokens|quota|throttl/i.test(message)) return "AWS invocation attempted; Bedrock quota is currently exhausted — deterministic fallback used";
  if (/access|authoriz|permission|credential/i.test(message)) return "AWS invocation attempted; Bedrock access was denied — deterministic fallback used";
  if (/timeout|timed out|abort/i.test(message)) return "AWS invocation timed out — deterministic fallback used";
  return "AWS agent unavailable — deterministic VOUCH evaluator used";
}

function deterministicRecommendation(action: ActionRequest, evidence: EvidenceItem[], recommendation: "APPROVE" | "HOLD" | "REJECT", confidence: number): AgentRecommendation {
  return {
    proposedAction: action.title,
    recommendation,
    summary: `Deterministic evaluator recommends ${recommendation.toLowerCase()} based on the supplied evidence.`,
    reasoning: "The local demo evaluator summarizes the same controlled evidence used by the independent VOUCH authority engine.",
    evidenceRefs: evidence.map((item) => item.id),
    confidence,
    requestedAuthority: action.risk === "LOW" ? "AUTONOMOUS" : "CONSEQUENTIAL",
    provider: "DEMO",
    model: "local-policy-evaluator",
    traceId: crypto.randomUUID(),
    toolCalls: ["inspect_action", "inspect_evidence"],
  };
}

export function awsAgentConfigured() {
  return process.env.VOUCH_ENABLE_AWS === "true"
    && Boolean(process.env.AWS_REGION)
    && Boolean(process.env.BEDROCK_MODEL_ID);
}

export async function invokeStrandsBedrock(action: ActionRequest, evidence: EvidenceItem[]) {
  const inspectedTools: string[] = [];
  const inspectAction = tool({
    name: "inspect_action",
    description: "Inspect the proposed action, risk, reversibility, and expected outcome. This tool does not authorize execution.",
    inputSchema: z.object({}),
    callback: () => {
      inspectedTools.push("inspect_action");
      return action;
    },
  });
  const inspectEvidence = tool({
    name: "inspect_evidence",
    description: "Inspect evidence by ID, including authority and verification state. This tool does not authorize execution.",
    inputSchema: z.object({ evidenceIds: z.array(z.string()) }),
    callback: ({ evidenceIds }) => {
      inspectedTools.push("inspect_evidence");
      return evidence.filter((item) => evidenceIds.includes(item.id));
    },
  });
  const modelId = process.env.BEDROCK_MODEL_ID!;
  const model = new BedrockModel({
    region: process.env.AWS_REGION!,
    modelId,
    maxTokens: 900,
    temperature: 0,
  });
  const agent = new Agent({
    name: "vouch-recommendation-agent",
    model,
    tools: [inspectAction, inspectEvidence],
    structuredOutputSchema: recommendationSchema,
    systemPrompt: [
      "You are the recommendation agent inside VOUCH.",
      "Determine what action you recommend and explain the evidence.",
      "Use the available inspection tools before recommending.",
      "You cannot authorize, execute, approve, or block an action.",
      "The independent deterministic VOUCH authority engine makes that decision after your recommendation.",
    ].join(" "),
  });
  const result = await agent.invoke(
    `Review this request and produce a structured recommendation. Action ID: ${action.id}. Available evidence IDs: ${evidence.map((item) => item.id).join(", ")}.`,
    { cancelSignal: AbortSignal.timeout(20_000), limits: { turns: 4, outputTokens: 1200 } },
  );
  const recommendation = recommendationSchema.parse(result.structuredOutput);
  return {
    ...recommendation,
    traceId: crypto.randomUUID(),
    toolCalls: [...new Set(inspectedTools)],
  };
}

export async function runStrandsEvaluation(
  action: ActionRequest,
  evidence: EvidenceItem[],
  trust: AgentTrust,
  hasServerResolution = false,
  liveInvoker: LiveInvoker = invokeStrandsBedrock,
) {
  const evidenceResult = get_evidence(evidence);
  const authorityResult = check_authority(evidence);
  const riskResult = assess_risk(action);
  const decision = evaluate_action(action, evidence, trust, hasServerResolution);
  let recommendation = deterministicRecommendation(action, evidence, decision.recommendation, decision.confidence);
  let service: SessionState["service"] = {
    mode: "DEMO",
    available: true,
    message: "DEMO — Deterministic VOUCH Evaluator",
  };

  if (awsAgentConfigured()) {
    try {
      const live = await liveInvoker(action, evidence);
      recommendation = {
        ...live,
        provider: "AWS_LIVE",
        model: process.env.BEDROCK_MODEL_ID!,
      };
      service = {
        mode: "AWS_LIVE",
        available: true,
        message: "AWS LIVE — Strands + Amazon Bedrock",
        lastInvocationAt: new Date().toISOString(),
      };
    } catch (error) {
      logAwsFailure(error);
      service = {
        mode: "DEMO",
        available: false,
        message: describeAwsFailure(error),
      };
    }
  }

  return {
    provider: recommendation.provider === "AWS_LIVE" ? "Strands + Amazon Bedrock" : "Deterministic demo tools",
    model: recommendation.model,
    tools: recommendation.toolCalls,
    evidenceResult,
    authorityResult,
    riskResult,
    recommendation,
    decision,
    service,
  };
}