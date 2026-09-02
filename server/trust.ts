import type { AgentTrust, AutonomyLevel, TrustEvent, VerificationResult } from "../shared/types";

const labels: Record<AutonomyLevel, string> = {
  T1: "OBSERVE",
  T2: "RECOMMEND",
  T3: "ACT",
  T4: "DELEGATE",
};
export const autonomyRank = (level: AutonomyLevel) => Number(level.slice(1));
export const getAutonomyLabel = (level: AutonomyLevel) => `${level} — ${labels[level]}`;

export function initialTrust(): AgentTrust {
  return { score: 84, autonomy: "T2", autonomousLimit: 250, verifiedActions: 42, verificationFailures: 0, blockedUnsafeActions: 3, reliability: 100, lastChange: 84 };
}

export function updateTrust(
  trust: AgentTrust,
  verification: VerificationResult,
  reason: string,
  options: { recovery?: boolean; qualifiesForAuthority?: boolean } = {},
): { trust: AgentTrust; event: TrustEvent } {
  const from = trust.score;
  const isPass = verification.status === "PASS";
  const authorityFrom = trust.autonomousLimit;
  const authorityTo = isPass
    ? options.qualifiesForAuthority === false
      ? authorityFrom
      : Math.min(1_000, authorityFrom + 250)
    : Math.max(100, Math.floor(authorityFrom * 0.2));
  const earnedScore = options.recovery ? Math.max(from + 1, 85) : from + 1;
  const to = Math.max(0, Math.min(100, isPass ? earnedScore : from - 15));
  let autonomy = trust.autonomy;
  if (!isPass) autonomy = autonomyRank(autonomy) > 1 ? (`T${autonomyRank(autonomy) - 1}` as AutonomyLevel) : "T1";
  if (isPass && to >= 85 && autonomy === "T2") autonomy = "T3";
  const next: AgentTrust = {
    ...trust,
    score: to,
    autonomy,
    autonomousLimit: authorityTo,
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
      authorityFrom,
      authorityTo,
    },
  };
}