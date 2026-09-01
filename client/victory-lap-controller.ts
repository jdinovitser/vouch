export function shouldScheduleVictoryLap({
  stage,
  stageCount,
  playing,
  loading,
  alreadyScheduled,
}: {
  stage: number;
  stageCount: number;
  playing: boolean;
  loading: boolean;
  alreadyScheduled: boolean;
}) {
  return stage === stageCount - 1 && !playing && !loading && !alreadyScheduled;
}