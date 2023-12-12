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
import InfoPopover from "components/ui/InfoPopover";
import { CourtAppealRound } from "lib/state/court/types";

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

  const round = courtCase
    ? (courtCase.appeals.length as CourtAppealRound)
    : undefined;

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
          <div className="ml-auto flex items-center gap-2">
            {stage.type !== "closed" && stage.type !== "reassigned" && (
              <div className=" text-right text-black">
                {timeLeft?.humanize()} left
              </div>
            )}
            {round && (
              <div
                className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs ${roundCopy[round].className}`}
              >
                Round {round}{" "}
                <InfoPopover>{roundCopy[round].description}</InfoPopover>
              </div>
            )}
          </div>
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

export const roundCopy: Record<
  CourtAppealRound,
  { description: string; className: string }
> = {
  "1": {
    description:
      "This case outcome has been appealed and is starting a new round of voting.",
    className: "text-gray-500 bg-slate-100",
  },
  "2": {
    description:
      "This case has been appealed for the second time and is starting a new round of voting.",
    className: "text-gray-500 bg-slate-100",
  },
  "3": {
    description:
      "This case has been appealed for the third time and is starting its last round of voting. If it is appealed a fourth time it will be moved to global disputes.",
    className: "text-orange-800 bg-orange-400",
  },
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
