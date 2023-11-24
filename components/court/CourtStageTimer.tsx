import { isInfinity } from "@zeitgeistpm/utility/dist/infinity";
import * as Time from "@zeitgeistpm/utility/dist/time";
import Skeleton from "components/ui/Skeleton";
import { useChainTime } from "lib/state/chaintime";
import { CourtStage } from "lib/state/court/get-stage";
import moment from "moment";
import { useMemo } from "react";

export const CourtStageTimer = ({ stage }: { stage?: CourtStage }) => {
  const time = useChainTime();

  const timeLeft = useMemo(() => {
    if (!time || !stage) return undefined;
    const left = Time.toMs(time, { start: 0, end: stage.remainingBlocks });
    return moment.duration(left, "millisecond");
  }, [time, stage]);

  if (!stage || !time) {
    return <Skeleton height={22} className="w-full rounded-md" />;
  }

  const percentage = isInfinity(stage.remainingBlocks)
    ? 100
    : ((stage.totalTime - stage.remainingBlocks) / stage.totalTime) * 100;

  return (
    <>
      <div className="inline-block w-full">
        <div className="mb-1 flex items-center">
          <div className="mr-4 font-semibold text-black">
            {courtStageCopy[stage.type].title}
          </div>
          <div className="text-sm text-sky-600">
            {courtStageCopy[stage.type].description}
          </div>
          {stage.type !== "closed" && stage.type !== "reassigned" && (
            <div className="ml-auto text-right text-black">
              {timeLeft?.humanize()} left
            </div>
          )}
        </div>
        <div className="w-full">
          <div className="text-right text-xs text-sky-600">
            {percentage.toFixed(0)}%
          </div>
          <div className="h-1.5 w-full rounded-lg bg-gray-100">
            <div
              className={`h-full rounded-lg transition-all ${courtStageCopy[stage.type].color
                }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export const courtStageCopy: Record<
  CourtStage["type"],
  { title: string; description: string; color: string }
> = {
  "pre-vote": {
    title: "Pre Vote",
    description: "The case is waiting for the vote period to start.",
    color: "bg-yellow-400",
  },
  vote: {
    title: "Voting",
    description: "Jurors must cast their vote by this phase.",
    color: "bg-blue-400",
  },
  aggregation: {
    title: "Aggregation",
    description: "Jurors must reveal their votes by this phase.",
    color: "bg-purple-400",
  },
  appeal: {
    title: "Appeal",
    description: "The result of the jurors' vote can be appealed by this phase.",
    color: "bg-orange-400",
  },
  reassigned: {
    title: "Reassigned",
    description:
      "All stakes for jurors and delegators were reassigned, with the losers paying the winners.",
    color: "bg-gray-400",
  },
  closed: {
    title: "Closed",
    description: "The case has been closed. The juror and delegator stakes can now be reassigned.",
    color: "bg-orange-400",
  },
};

export default CourtStageTimer;
