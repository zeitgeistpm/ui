import { isInfinite, MarketStage } from "@zeitgeistpm/sdk";
import { clamp } from "lodash-es";
import Skeleton from "components/ui/Skeleton";
import moment from "moment";

export type MarketTimerProps = {
  stage: MarketStage;
};

export const MarketTimer = ({ stage }: MarketTimerProps) => {
  const remainingTime = clamp(stage.remainingTime, 0, stage.totalTime);
  const totalTime = stage.totalTime;

  const percentage = isInfinite(stage)
    ? 100
    : ((totalTime - remainingTime) / totalTime) * 100;

  const timeUntilStageEnds = moment.duration(remainingTime, "millisecond");

  return (
    <div className="inline-block w-full">
      <div className="mb-1 flex items-center">
        <div className="mr-4 font-semibold text-black">
          {copy[stage.type].title}
        </div>
        <div className="text-sm text-sky-600">
          {copy[stage.type].description}
        </div>
        {!isInfinite(stage) && (
          <div className="ml-auto text-right text-black">
            {timeUntilStageEnds.humanize()} left
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
              copy[stage.type].color
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export const MarketTimerSkeleton = () => {
  return (
    <div className="inline-block w-full">
      <div className="mb-1 flex items-center">
        <div className="mr-4">
          <Skeleton width={150} className="inline-block" />
        </div>
        <div className="hidden sm:block">
          <Skeleton width={260} className="inline-block" />
        </div>

        <div className="ml-auto">
          <Skeleton width={40} className="inline-block" />
        </div>
      </div>
      <div className="w-full">
        <div className="flex h-4 justify-end text-right text-sm text-gray-500"></div>
        <div className="h-2 w-full rounded-lg bg-gray-100">
          <div
            className={`h-full rounded-lg bg-gray-400 transition-all`}
            style={{ width: `10%` }}
          />
        </div>
      </div>
    </div>
  );
};

const copy: Record<
  MarketStage["type"],
  { title: string; description: string; color: string }
> = {
  Proposed: {
    title: "Market is Proposed",
    description: "Awaiting approval",
    color: "bg-yellow-400",
  },
  Trading: {
    title: "Market is Live",
    description: "Market is open for trading",
    color: "bg-green-400",
  },
  GracePeriod: {
    title: "Market Grace Period",
    description: "Market is cooling down before opening to reports",
    color: "bg-green-400",
  },
  OracleReportingPeriod: {
    title: "Market ended",
    description: "Waiting for Oracle report",
    color: "bg-purple-600",
  },
  OpenReportingPeriod: {
    title: "Oracle has failed to report",
    description: "Reporting open to all",
    color: "bg-purple-600",
  },
  Disputed: {
    title: "Market outcome Disputed",
    description: "Waiting for authority to report",
    color: "bg-orange-400",
  },
  Reported: {
    title: "Outcome Reported",
    description: "Disputes are open to all",
    color: "bg-green-400",
  },
  AuthorizedReport: {
    title: "Outcome Reported by Authority",
    description: "Waiting for correction period to end",
    color: "bg-green-400",
  },
  Resolved: {
    title: "Market Resolved",
    description: "Consensus reached on the outcome",
    color: "bg-green-400",
  },
  Destroyed: {
    title: "Market Destroyed",
    description: "Market has been removed",
    color: "bg-black",
  },
  Court: {
    title: "Disputed in Court",
    description: "Market is awaiting a ruling",
    color: "bg-orange-400",
  },
};
