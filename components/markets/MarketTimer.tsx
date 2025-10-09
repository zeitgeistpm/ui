import { isInfinite, MarketStage } from "@zeitgeistpm/sdk";
import { clamp } from "lodash-es";
import Skeleton from "components/ui/Skeleton";
import moment from "moment";
import { isInfinity } from "@zeitgeistpm/utility/dist/infinity";

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
      {!isInfinity(stage.remainingTime) ? (
        <div className="relative h-6 w-full rounded-lg bg-slate-400 overflow-hidden">
          <div
            className={`h-full rounded-lg transition-all ${
              copy[stage.type].color
            }`}
            style={{ width: `${percentage}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-between px-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-white drop-shadow-md">
                {copy[stage.type].title}:
              </span>
              <span className="text-white/90 lowercase drop-shadow-md">
                {copy[stage.type].description}
              </span>
              {!isInfinite(stage) && (
                <span className="text-white/90 whitespace-nowrap drop-shadow-md">
                 - {timeUntilStageEnds.humanize()} left
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-white font-semibold drop-shadow-md">
                {percentage.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative h-8 w-full rounded-lg bg-gray-100 overflow-hidden">
          <div
            className={`h-full rounded-lg ${copy[stage.type].color}`}
            style={{ width: "100%" }}
          />
          <div className="absolute inset-0 flex items-center justify-between px-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-white drop-shadow-md">
                {copy[stage.type].title}:
              </span>
              <span className="text-white/90 lowercase drop-shadow-md">
                {copy[stage.type].description}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export const MarketTimerSkeleton = () => {
  return (
    <div className="inline-block w-full">
      <div className="relative h-8 w-full rounded-lg bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-lg bg-gray-300 transition-all"
          style={{ width: "15%" }}
        />
        <div className="absolute inset-0 flex items-center justify-between px-3">
          <div className="flex items-center gap-2">
            <Skeleton width={120} height={12} />
            <Skeleton width={100} height={12} />
          </div>
          <Skeleton width={30} height={12} />
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
    color: "bg-yellow-500",
  },
  Trading: {
    title: "Market is Live",
    description: "Open for trading",
    color: "bg-emerald-500",
  },
  GracePeriod: {
    title: "Market Grace Period",
    description: "Cooling down before reporting",
    color: "bg-emerald-500",
  },
  OracleReportingPeriod: {
    title: "Market ended",
    description: "Awaiting Oracle to report",
    color: "bg-purple-500",
  },
  OpenReportingPeriod: {
    title: "Oracle has failed to report",
    description: "Reporting open to all",
    color: "bg-purple-500",
  },
  Disputed: {
    title: "Market outcome Disputed",
    description: "Awaiting authority to report",
    color: "bg-orange-500",
  },
  Reported: {
    title: "Outcome Reported",
    description: "Disputes open to all",
    color: "bg-emerald-500",
  },
  AuthorizedReport: {
    title: "Outcome Reported by Authority",
    description: "Awaiting correction period to end",
    color: "bg-emerald-500",
  },
  Resolved: {
    title: "Market Resolved",
    description: "Consensus reached on outcome",
    color: "bg-emerald-500",
  },
  Destroyed: {
    title: "Market Destroyed",
    description: "Market removed",
    color: "bg-gray-800",
  },
  Court: {
    title: "Disputed in Court",
    description: "Awaiting ruling",
    color: "bg-orange-500",
  },
};
