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
    timeUntilStageEnds.years() > 1
      ? "year"
      : timeUntilStageEnds.months() > 1
      ? "month"
      : timeUntilStageEnds.weeks() > 1
      ? "week"
      : timeUntilStageEnds.days() > 1
      ? "day"
      : timeUntilStageEnds.hours() > 1
      ? "hour"
      : timeUntilStageEnds.minutes() > 1
      ? "minute"
      : timeUntilStageEnds.seconds() > 1
      ? "second"
      : "hour";

  const timer = timeUntilStageEnds.as(format);

  return (
    <div>
      <div className="flex mb-4 items-center">
        <h3 className="font-bold text-lg mr-4 text-gray-600">
          {copy[stage.type].title}
        </h3>
        <h4 className="mr-4 text-gray-600">{copy[stage.type].description}</h4>
        {!isInfinite(stage) && (
          <h4 className="text-gray-600">
            {timer.toFixed(0)} {upperFirst(format + (timer > 1 ? "s" : ""))}{" "}
            left
          </h4>
        )}
      </div>
      <div className="w-ztg-360">
        <div className="text-gray-600 text-sm text-right">
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
    <div>
      <div className="flex mb-4 items-center">
        <h3 className="font-bold text-lg mr-4 text-gray-600">
          <Skeleton width={150} />
        </h3>
        <h4 className="mr-4 text-gray-600">
          <Skeleton width={320} />
        </h4>

        <h4 className="text-gray-600">
          <Skeleton width={40} />
        </h4>
      </div>
      <div className="w-ztg-360">
        <div className="text-gray-600 text-sm text-right flex justify-end h-4"></div>
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
    title: "Outcome Reported.",
    description: "The market outcome reported by the oracle",
    color: "bg-green-400",
  },
  AuthorizedReport: {
    title: "Outcome Reported by Authority.",
    description: "The market outcome reported by the authority",
    color: "bg-green-400",
  },
  Resolved: {
    title: "Market Resolved",
    description: "Consensus reached on the outcome",
    color: "bg-green-400",
  },
};
