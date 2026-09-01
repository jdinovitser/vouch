import { describe, expect, it } from "vitest";
import { shouldScheduleVictoryLap } from "../client/victory-lap-controller";

const completion = { stage: 6, stageCount: 7, playing: false, loading: false };

describe("victory lap trigger", () => {
  it("schedules only when a demo reaches its completed resting state", () => {
    expect(shouldScheduleVictoryLap({ ...completion, alreadyScheduled: false })).toBe(true);
    expect(shouldScheduleVictoryLap({ ...completion, stage: 5, alreadyScheduled: false })).toBe(false);
    expect(shouldScheduleVictoryLap({ ...completion, playing: true, alreadyScheduled: false })).toBe(false);
    expect(shouldScheduleVictoryLap({ ...completion, loading: true, alreadyScheduled: false })).toBe(false);
  });

  it("does not schedule twice during one completed run", () => {
    expect(shouldScheduleVictoryLap({ ...completion, alreadyScheduled: true })).toBe(false);
  });

  it("can schedule again after restart resets the run gate", () => {
    const gateAfterRestart = false;
    expect(shouldScheduleVictoryLap({ ...completion, alreadyScheduled: gateAfterRestart })).toBe(true);
  });
});