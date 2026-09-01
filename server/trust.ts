import type { AgentTrust, AutonomyLevel, TrustEvent, VerificationResult } from "../shared/types";

const labels: Record<AutonomyLevel, string> = {
  T1: "SUPERVISED",
  T2: "ASSISTED",
  T3: "AUTONOMOUS",
  T4: "EXPANDED",
};
export const autonomyRank = (level: AutonomyLevel) => Number(level.slice(1));
export const getAutonomyLabel = (level: AutonomyLevel) => `${level} — ${labels[level]}`;

export function initialTrust(): AgentTrust {
  return { score: 87, autonomy: "T3", verifiedActions: 42, verificationFailures: 1, blockedUnsafeActions: 3, reliability: 96, lastChange: 87 };
}

export function updateTrust(trust: AgentTrust, verification: VerificationResult, reason: string): { trust: AgentTrust; event: TrustEvent } {
  const from = trust.score;
  const isPass = verification.status === "PASS";
  const to = Math.max(0, Math.min(100, from + (isPass ? 1 : -15)));
  let autonomy = trust.autonomy;
  if (!isPass && to < 80) autonomy = autonomyRank(autonomy) > 1 ? (`T${autonomyRank(autonomy) - 1}` as AutonomyLevel) : "T1";
  if (isPass && to >= 85 && autonomy === "T2" && trust.verificationFailures === 0) autonomy = "T3";
  const next: AgentTrust = {
    ...trust,
    score: to,
    autonomy,
    verifiedActions: trust.verifiedActions + (isPass ? 1 : 0),
    verificationFailures: trust.verificationFailures + (isPass ? 0 : 1),
    reliability: Math.round((trust.verifiedActions + (isPass ? 1 : 0)) / (trust.verifiedActions + trust.verificationFailures + (isPass ? 1 : 0) + (isPass ? 0 : 1)) * 100),
    lastChange: to,
  };
  return {
    trust: next,
    event: {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      from,
      to,
      reason,
      autonomyFrom: trust.autonomy,
      autonomyTo: autonomy,
    },
  };
}