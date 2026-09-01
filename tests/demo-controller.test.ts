import { describe, expect, it } from "vitest";
import { demoControllerReducer, initialDemoController } from "../client/demo-controller";

describe("guided demo controller", () => {
  it("plays, pauses, and resumes without resetting progress", () => {
    const playing = demoControllerReducer(initialDemoController, { type: "PLAY" });
    const progressed = demoControllerReducer(playing, { type: "TICK" });
    const paused = demoControllerReducer(progressed, { type: "PAUSE" });
    const resumed = demoControllerReducer(paused, { type: "PLAY" });
    expect(resumed).toMatchObject({ stage: 1, playing: true });
  });

  it("restarts at the request stage", () => {
    const progressed = { stage: 4, playing: true, inspected: 2 };
    expect(demoControllerReducer(progressed, { type: "RESTART" })).toEqual(initialDemoController);
  });

  it("steps forward and backward within valid bounds", () => {
    expect(demoControllerReducer(initialDemoController, { type: "PREVIOUS" }).stage).toBe(0);
    const forward = demoControllerReducer(initialDemoController, { type: "NEXT" });
    expect(forward.stage).toBe(1);
    expect(demoControllerReducer(forward, { type: "PREVIOUS" }).stage).toBe(0);
  });

  it("allows completed-stage inspection but rejects future stages", () => {
    const state = { stage: 4, playing: false, inspected: null };
    expect(demoControllerReducer(state, { type: "INSPECT", stage: 2 }).inspected).toBe(2);
    expect(demoControllerReducer(state, { type: "INSPECT", stage: 6 })).toEqual(state);
  });

  it("stops automatically at the final stage", () => {
    const state = { stage: 5, playing: true, inspected: null };
    expect(demoControllerReducer(state, { type: "TICK" })).toMatchObject({ stage: 6, playing: false });
  });
});