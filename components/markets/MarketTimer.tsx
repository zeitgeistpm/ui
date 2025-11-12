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
        <div className="relative h-8 w-full overflow-hidden rounded-lg bg-white/10 shadow-md backdrop-blur-sm sm:h-10">
          <div
            className={`h-full rounded-lg transition-all ${
              copy[stage.type].color
            }`}
            style={{ width: `${percentage}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-between px-2.5 sm:px-4">
            <div className="flex flex-wrap items-center gap-1 text-xs sm:gap-1.5 sm:text-sm">
              <span className="font-bold text-white">
                {copy[stage.type].title}:
              </span>
              <span className="font-medium lowercase text-white/80">
                {copy[stage.type].description}
              </span>
              {!isInfinite(stage) && (
                <span className="whitespace-nowrap font-medium text-white/70">
                  - {timeUntilStageEnds.humanize()} left
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs sm:gap-3 sm:text-sm">
              <span className="font-bold text-white">
                {percentage.toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative h-8 w-full overflow-hidden rounded-lg bg-white/10 shadow-md backdrop-blur-sm sm:h-10">
          <div
            className={`h-full rounded-lg ${copy[stage.type].color}`}
            style={{ width: "100%" }}
          />
          <div className="absolute inset-0 flex items-center justify-between px-2.5 sm:px-4">
            <div className="flex flex-wrap items-center gap-1 text-xs sm:gap-2 sm:text-sm">
              <span className="font-bold text-white">
                {copy[stage.type].title}:
              </span>
              <span className="font-medium lowercase text-white/80">
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
      <div className="relative h-8 w-full overflow-hidden rounded-lg bg-white/10 shadow-md backdrop-blur-sm sm:h-10">
        <div
          className="h-full rounded-lg bg-ztg-green-500/30 transition-all"
          style={{ width: "15%" }}
        />
        <div className="absolute inset-0 flex items-center justify-between px-2.5 sm:px-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Skeleton width={80} height={10} className="sm:h-3 sm:w-[120px]" />
            <Skeleton width={70} height={10} className="sm:h-3 sm:w-[100px]" />
          </div>
          <Skeleton width={24} height={10} className="sm:h-3 sm:w-[30px]" />
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
    description: "Pending",
    color: "bg-gradient-to-r from-yellow-400/80 to-yellow-500/80",
  },
  Trading: {
    title: "Live",
    description: "Trading",
    color: "bg-gradient-to-r from-ztg-primary-300/85 to-ztg-primary-200/95",
  },
  GracePeriod: {
    title: "Grace Period",
    description: "Pre-reporting",
    color: "bg-gradient-to-r from-ztg-primary-300/85 to-ztg-primary-200/95",
  },
  OracleReportingPeriod: {
    title: "Ended",
    description: "Oracle pending",
    color: "bg-gradient-to-r from-ztg-primary-300/85 to-ztg-primary-200/95",
  },
  OpenReportingPeriod: {
    title: "Oracle Failed",
    description: "Open reporting",
    color: "bg-gradient-to-r from-orange-400/80 to-orange-500/80",
  },
  Disputed: {
    title: "Disputed",
    description: "Authority pending",
    color: "bg-gradient-to-r from-orange-400/80 to-orange-500/80",
  },
  Reported: {
    title: "Reported",
    description: "Disputable",
    color: "bg-gradient-to-r from-purple-400/80 to-purple-500/80",
  },
  AuthorizedReport: {
    title: "Authority Report",
    description: "Correction period",
    color: "bg-gradient-to-r from-purple-400/80 to-purple-500/80",
  },
  Resolved: {
    title: "Resolved",
    description: "Final",
    color: "bg-gradient-to-r from-emerald-400/80 to-emerald-500/80",
  },
  Destroyed: {
    title: "Destroyed",
    description: "Removed",
    color: "bg-gradient-to-r from-gray-600/80 to-gray-700/80",
  },
  Court: {
    title: "In Court",
    description: "Pending ruling",
    color: "bg-gradient-to-r from-orange-400/80 to-orange-500/80",
  },
};
