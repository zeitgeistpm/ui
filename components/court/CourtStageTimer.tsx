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
        <div className="flex mb-1 items-center">
          <div className="font-semibold mr-4 text-black">
            {copy[stage.type].title}
          </div>
          <div className="text-sky-600 text-sm">
            {copy[stage.type].description}
          </div>
          {stage.type !== "closed" && stage.type !== "reassigned" && (
            <div className="ml-auto text-black text-right">
              {timeLeft?.humanize()} left
            </div>
          )}
        </div>
        <div className="w-full">
          <div className="text-xs text-sky-600 text-right">
            {percentage.toFixed(0)}%
          </div>
          <div className="w-full rounded-lg h-1.5 bg-gray-100">
            <div
              className={`rounded-lg h-full transition-all ${
                copy[stage.type].color
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    </>
  );
};

const copy: Record<
  CourtStage["type"],
  { title: string; description: string; color: string }
> = {
  "pre-vote": {
    title: "Pre Vote",
    description: "Case is waiting for the vote period to start.",
    color: "bg-yellow-400",
  },
  vote: {
    title: "Voting",
    description: "Voting is open for this case.",
    color: "bg-green-400",
  },
  aggregation: {
    title: "Aggregation",
    description: "Votes can now be revealed by jurors.",
    color: "bg-purple-400",
  },
  appeal: {
    title: "Appeal",
    description: "Jurors can now appeal the case.",
    color: "bg-blue-400",
  },
  reassigned: {
    title: "Reassigned",
    description: "The case is now reassigned. Winners paid out.",
    color: "bg-gray-400",
  },
  closed: {
    title: "Closed",
    description: "The case is now closed. Waiting to be reassigned.",
    color: "bg-orange-400",
  },
};

export default CourtStageTimer;
