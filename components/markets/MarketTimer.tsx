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
        <div className="relative h-6 w-full overflow-hidden rounded-lg border border-sky-200/30 bg-sky-50/50 shadow-sm backdrop-blur-sm">
          <div
            className={`h-full rounded-lg transition-all ${
              copy[stage.type].color
            }`}
            style={{ width: `${percentage}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-between px-3">
            <div className="flex items-center gap-1 text-xs">
              <span className="font-semibold text-sky-950">
                {copy[stage.type].title}:
              </span>
              <span className="lowercase text-sky-950">
                {copy[stage.type].description}
              </span>
              {!isInfinite(stage) && (
                <span className="whitespace-nowrap text-sky-950">
                  - {timeUntilStageEnds.humanize()} left
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="font-semibold text-sky-950">
                {percentage.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative h-8 w-full overflow-hidden rounded-lg border border-sky-200/30 bg-sky-50/50 shadow-sm backdrop-blur-sm">
          <div
            className={`h-full rounded-lg ${copy[stage.type].color}`}
            style={{ width: "100%" }}
          />
          <div className="absolute inset-0 flex items-center justify-between px-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-sky-950">
                {copy[stage.type].title}:
              </span>
              <span className="lowercase text-sky-950">
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
      <div className="relative h-8 w-full overflow-hidden rounded-lg border border-sky-200/30 bg-sky-50/50 shadow-sm backdrop-blur-sm">
        <div
          className="h-full rounded-lg bg-sky-200/50 transition-all"
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
    title: "Proposed",
    description: "Awaiting approval",
    color: "bg-gradient-to-r from-yellow-400/80 to-yellow-500/80",
  },
  Trading: {
    title: "Live",
    description: "Trading open",
    color: "bg-gradient-to-r from-emerald-400/80 to-emerald-500/80",
  },
  GracePeriod: {
    title: "Grace Period",
    description: "Before reporting",
    color: "bg-gradient-to-r from-emerald-400/80 to-emerald-500/80",
  },
  OracleReportingPeriod: {
    title: "Ended",
    description: "Awaiting Oracle report",
    color: "bg-gradient-to-r from-purple-400/80 to-purple-500/80",
  },
  OpenReportingPeriod: {
    title: "Oracle failed to report",
    description: "Open to all",
    color: "bg-gradient-to-r from-purple-400/80 to-purple-500/80",
  },
  Disputed: {
    title: "Outcome Disputed",
    description: "Awaiting authority report",
    color: "bg-gradient-to-r from-orange-400/80 to-orange-500/80",
  },
  Reported: {
    title: "Outcome Reported",
    description: "Disputes open to all",
    color: "bg-gradient-to-r from-emerald-400/80 to-emerald-500/80",
  },
  AuthorizedReport: {
    title: "Outcome Reported by Authority",
    description: "Awaiting correction period to end",
    color: "bg-gradient-to-r from-emerald-400/80 to-emerald-500/80",
  },
  Resolved: {
    title: "Market Resolved",
    description: "Consensus reached",
    color: "bg-gradient-to-r from-emerald-400/80 to-emerald-500/80",
  },
  Destroyed: {
    title: "Destroyed",
    description: "Market removed",
    color: "bg-gradient-to-r from-gray-600/80 to-gray-700/80",
  },
  Court: {
    title: "Disputed in Court",
    description: "Awaiting ruling",
    color: "bg-gradient-to-r from-orange-400/80 to-orange-500/80",
  },
};
