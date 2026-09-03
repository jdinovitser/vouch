import type { AgentMetrics, ClaimsCase, DemoScenario } from "../shared/types";

const caseTemplates: Array<Omit<ClaimsCase, "status" | "receivedAt" | "version" | "refundAmount">> = [
  { id: "case-8041", scenarioId: "safe-review", caseNumber: "#8041", customer: "Jordan Lee", category: "Help someone get their money back", summary: "A community member was charged twice. The team needs to resolve the duplicate and get their money back.", amount: 124, priority: "LOW" },
  { id: "case-1192", scenarioId: "verification-failure", caseNumber: "#1192", customer: "Priya Shah", category: "Make sure help actually reached someone", summary: "A $124 refund is eligible. Before the team considers the case resolved, VOUCH verifies that the refund was actually recorded.", amount: 124, priority: "MEDIUM" },
  { id: "case-8042", scenarioId: "human-refund", caseNumber: "#8042", customer: "Mateo Garcia", category: "A larger refund needs a person", summary: "The duplicate charge is confirmed, but this $1,240 refund is beyond the AI teammate's earned responsibility.", amount: 1240, priority: "MEDIUM" },
  { id: "case-680", scenarioId: "prompt-injection", caseNumber: "#680", customer: "Northstar Supplies", category: "Protect resources meant to help people", summary: "A vendor invoice contains an instruction that conflicts with the team's verified payment policy. VOUCH catches it before money moves.", amount: 680, priority: "HIGH" },
  { id: "case-1240", scenarioId: "conflicting-refund", caseNumber: "#1240", customer: "Northstar Supplies", category: "Stop an unsafe payment", summary: "A secondary message requests an amount above the team's authorized limit. VOUCH blocks it.", amount: 1240, priority: "HIGH" },
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
    humanAuthorizedActions: 0,
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