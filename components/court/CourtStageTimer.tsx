import { isInfinity } from "@zeitgeistpm/utility/dist/infinity";
import * as Time from "@zeitgeistpm/utility/dist/time";
import Skeleton from "components/ui/Skeleton";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { useCaseMarketId } from "lib/hooks/queries/court/useCaseMarketId";
import { useCourtCase } from "lib/hooks/queries/court/useCourtCase";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useChainTime } from "lib/state/chaintime";
import { CourtStage, getCourtStage } from "lib/state/court/get-stage";
import moment from "moment";
import { useMemo } from "react";

export const CourtStageTimer = ({
  market: initialMarket,
  caseId,
}: {
  market?: FullMarketFragment;
  caseId: number;
}) => {
  const time = useChainTime();

  const { data: courtCase } = useCourtCase(caseId);
  const { data: marketId } = useCaseMarketId(caseId);

  let { data: dynamicMarket } = useMarket(
    marketId != null ? { marketId } : undefined,
  );

  const market = dynamicMarket ?? initialMarket;

  const stage = useMemo(() => {
    if (time && market && courtCase) {
      return getCourtStage(time, market, courtCase);
    }
  }, [time, market, courtCase]);

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
              className={`h-full rounded-lg transition-all ${
                courtStageCopy[stage.type].color
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
    description: "Case is waiting for the vote period to start.",
    color: "bg-yellow-400",
  },
  vote: {
    title: "Voting",
    description: "Voting is open for this case.",
    color: "bg-blue-400",
  },
  aggregation: {
    title: "Aggregation",
    description: "Votes can now be revealed by jurors.",
    color: "bg-purple-400",
  },
  appeal: {
    title: "Appeal",
    description: "The case can now be appealed.",
    color: "bg-orange-400",
  },
  reassigned: {
    title: "Settled",
    description: "The case is now settled and winners have been paid out.",
    color: "bg-gray-400",
  },
  closed: {
    title: "Closed",
    description: "The case is now closed. Waiting to be reassigned.",
    color: "bg-orange-400",
  },
};

export default CourtStageTimer;
