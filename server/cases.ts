import type { AgentMetrics, ClaimsCase, DemoScenario } from "../shared/types";

const caseTemplates: Array<Omit<ClaimsCase, "status" | "receivedAt" | "version" | "refundAmount">> = [
  { id: "case-8041", scenarioId: "safe-review", caseNumber: "#8041", customer: "Jordan Lee", category: "Duplicate charge", summary: "Two captures appear for the same order; routine refund policy may apply.", amount: 124, priority: "LOW" },
  { id: "case-1192", scenarioId: "verification-failure", caseNumber: "#1192", customer: "Priya Shah", category: "Refund verification", summary: "A verified $124 duplicate charge is eligible, but the durable ledger must prove the refund was actually recorded.", amount: 124, priority: "MEDIUM" },
  { id: "case-8042", scenarioId: "human-refund", caseNumber: "#8042", customer: "Mateo Garcia", category: "Refund exception", summary: "Duplicate charge is confirmed, but the amount exceeds the autonomous refund threshold.", amount: 1240, priority: "MEDIUM" },
  { id: "case-680", scenarioId: "prompt-injection", caseNumber: "#680", customer: "Northstar Supplies", category: "Vendor payment", summary: "An imported invoice contains an instruction that conflicts with verified payment policy.", amount: 680, priority: "HIGH" },
  { id: "case-1240", scenarioId: "conflicting-refund", caseNumber: "#1240", customer: "Northstar Supplies", category: "Settlement approval", summary: "A secondary message references an amount above the authoritative approval limit.", amount: 1240, priority: "HIGH" },
];

export function initialCases(): ClaimsCase[] {
  const receivedAt = new Date().toISOString();
  return caseTemplates.map((item) => ({ ...item, status: "NEW", receivedAt, version: 1, refundAmount: 0 }));
}

export function initialMetrics(): AgentMetrics {
  return {
    casesProcessed: 0,
    autonomousResolutions: 0,
    humanReviews: 0,
    blockedCases: 0,
    verificationFailures: 0,
    verifiedOutcomes: 0,
    minutesSaved: 0,
    authorityChanges: 0,
  };
}

export function caseForScenario(cases: ClaimsCase[], scenarioId: string) {
  return cases.find((item) => item.scenarioId === scenarioId);
}

export function caseFromScenario(scenario: DemoScenario): ClaimsCase {
  return {
    id: `case-${scenario.id}`,
    scenarioId: scenario.id,
    caseNumber: "NEW",
    customer: "Incoming customer",
    category: scenario.name,
    summary: scenario.description,
    priority: scenario.action.risk === "HIGH" ? "HIGH" : scenario.action.risk === "MEDIUM" ? "MEDIUM" : "LOW",
    status: "NEW",
    receivedAt: new Date().toISOString(),
    version: 1,
    refundAmount: 0,
  };
}