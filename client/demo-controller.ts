export const DEMO_STAGE_COUNT = 7;

export interface DemoControllerState {
  stage: number;
  playing: boolean;
  inspected: number | null;
}

export type DemoControllerAction =
  | { type: "PLAY" }
  | { type: "PAUSE" }
  | { type: "RESTART" }
  | { type: "NEXT" }
  | { type: "PREVIOUS" }
  | { type: "TICK" }
  | { type: "INSPECT"; stage: number };

export const initialDemoController: DemoControllerState = { stage: 0, playing: false, inspected: null };

export function demoControllerReducer(state: DemoControllerState, action: DemoControllerAction): DemoControllerState {
  switch (action.type) {
    case "PLAY":
      return { stage: state.stage === DEMO_STAGE_COUNT - 1 ? 0 : state.stage, playing: true, inspected: null };
    case "PAUSE":
      return { ...state, playing: false };
    case "RESTART":
      return initialDemoController;
    case "NEXT":
      return { stage: Math.min(DEMO_STAGE_COUNT - 1, state.stage + 1), playing: false, inspected: null };
    case "PREVIOUS":
      return { stage: Math.max(0, state.stage - 1), playing: false, inspected: null };
    case "TICK": {
      const next = Math.min(DEMO_STAGE_COUNT - 1, state.stage + 1);
      return { stage: next, playing: next < DEMO_STAGE_COUNT - 1, inspected: null };
    }
    case "INSPECT":
      if (action.stage > state.stage || action.stage < 0) return state;
      return { ...state, inspected: action.stage };
    default:
      return state;
  }
}