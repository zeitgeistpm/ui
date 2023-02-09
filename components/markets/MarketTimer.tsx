import { isInfinite, MarketStage } from "@zeitgeistpm/sdk-next";
import { clamp, upperFirst } from "lodash-es";
import { Skeleton } from "@material-ui/lab";
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

  const format =
    timeUntilStageEnds.asYears() > 1
      ? "year"
      : timeUntilStageEnds.asMonths() > 1
      ? "month"
      : timeUntilStageEnds.asWeeks() > 1
      ? "week"
      : timeUntilStageEnds.asDays() > 1
      ? "day"
      : timeUntilStageEnds.asHours() > 1
      ? "hour"
      : timeUntilStageEnds.asMinutes() > 1
      ? "minute"
      : timeUntilStageEnds.asSeconds() > 1
      ? "second"
      : "hour";

  const timer = timeUntilStageEnds.as(format);

  return (
    <div className="inline-block">
      <div className="flex mb-4 items-center">
        <h3 className="font-bold text-lg mr-4 text-gray-700">
          {copy[stage.type].title}
        </h3>
        <h4 className="mr-20 text-gray-500">{copy[stage.type].description}</h4>
        {!isInfinite(stage) && (
          <h4 className="text-gray-500">
            {timer.toFixed(0)}{" "}
            {upperFirst(format + (Math.floor(timer) > 1 ? "s" : ""))} left
          </h4>
        )}
      </div>
      <div className="w-full">
        <div className="text-gray-500 text-sm text-right">
          {percentage.toFixed(0)}%
        </div>
        <div className="w-full rounded-lg h-2 bg-gray-200">
          <div
            className={`rounded-lg h-full transition-all ${
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
    <div className="inline-block">
      <div className="flex mb-4 items-center">
        <h3 className="font-bold text-lg mr-4 text-gray-500">
          <Skeleton width={150} />
        </h3>
        <h4 className="mr-4 text-gray-500">
          <Skeleton width={260} />
        </h4>

        <h4 className="text-gray-500">
          <Skeleton width={40} />
        </h4>
      </div>
      <div className="w-full">
        <div className="text-gray-500 text-sm text-right flex justify-end h-4"></div>
        <div className="w-full rounded-lg h-2 bg-gray-200">
          <div
            className={`rounded-lg h-full transition-all bg-gray-400`}
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
};
