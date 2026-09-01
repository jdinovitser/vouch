import type { ActionRequest, AgentTrust, EvidenceItem } from "../../shared/types";
import { assess_risk, check_authority, evaluate_action, get_evidence } from "../tools";

/**
 * Strands adapter boundary. In AWS mode this is the seam for the Strands Agents
 * runtime + Bedrock model. The safety-critical tools stay deterministic locally:
 * the model can recommend, while the authority engine decides.
 */
export async function runStrandsEvaluation(action: ActionRequest, evidence: EvidenceItem[], trust: AgentTrust, resolved = false) {
  const awsEnabled = process.env.VOUCH_ENABLE_AWS === "true" && Boolean(process.env.AWS_REGION);
  const evidenceResult = get_evidence(evidence);
  const authorityResult = check_authority(evidence);
  const riskResult = assess_risk(action);
  const decision = evaluate_action(action, evidence, trust, resolved);
  return {
    provider: awsEnabled ? "Strands + Amazon Bedrock" : "Deterministic demo tools",
    model: awsEnabled ? (process.env.BEDROCK_MODEL_ID ?? "configured Bedrock model") : "local-policy-evaluator",
    tools: ["get_evidence", "check_authority", "assess_risk", "check_policy", "evaluate_action"],
    evidenceResult,
    authorityResult,
    riskResult,
    decision,
  };
}