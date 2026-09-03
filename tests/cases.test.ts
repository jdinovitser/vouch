import { describe, expect, it } from "vitest";
import { caseForScenario, initialCases, initialMetrics } from "../server/cases";

describe("professional claims work queue", () => {
  it("starts with distinct server-held cases ready for professional processing", () => {
    const cases = initialCases();
    expect(cases).toHaveLength(5);
    expect(new Set(cases.map((item) => item.id)).size).toBe(cases.length);
    expect(cases.every((item) => item.status === "NEW")).toBe(true);
    expect(caseForScenario(cases, "safe-review")?.category).toBe("Help someone get their money back");
  });

  it("starts impact metrics at zero so the UI reports measured session outcomes", () => {
    expect(initialMetrics()).toEqual({
      casesProcessed: 0,
      autonomousResolutions: 0,
      humanReviews: 0,
      blockedCases: 0,
      verificationFailures: 0,
      verifiedOutcomes: 0,
      minutesSaved: 0,
      authorityChanges: 0,
      humanAuthorizedActions: 0,
    });
  });
});