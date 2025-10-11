import Skeleton from "components/ui/Skeleton";
import { MarketStatus } from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { formatNumberCompact } from "lib/util/format-compact";
import { hasDatePassed } from "lib/util/hasDatePassed";
import { FC } from "react";

interface MarketStatsProps {
  starts: number;
  ends: number;
  status: MarketStatus;
  resolutionDateEstimate: Date;
  reportsOpenAt: number;
  volume: number;
  liquidity?: string;
  participants?: number;
  token?: string;
  isStatsLoading: boolean;
}

export const MarketStats: FC<MarketStatsProps> = ({
  starts,
  ends,
  status,
  resolutionDateEstimate,
  reportsOpenAt,
  volume,
  liquidity,
  participants,
  token,
  isStatsLoading,
}) => {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      <div className="rounded-md bg-white/60 px-2 py-1 backdrop-blur-sm">
        <div className="text-xxs font-medium text-gray-600">
          {hasDatePassed(starts) ? "Started" : "Starts"}
        </div>
        <div className="text-xs font-bold text-gray-900">
          {new Intl.DateTimeFormat("default", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }).format(starts)}
        </div>
      </div>

      <div className="rounded-md bg-white/60 px-2 py-1 backdrop-blur-sm">
        <div className="text-xxs font-medium text-gray-600">
          {hasDatePassed(ends) ? "Ended" : "Ends"}
        </div>
        <div className="text-xs font-bold text-gray-900">
          {new Intl.DateTimeFormat("default", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }).format(ends)}
        </div>
      </div>

      {(status === "Active" ||
        status === "Closed" ||
        status === "Reported" ||
        status === "Disputed" ||
        status === "Resolved") && (
        <div className="rounded-md bg-white/60 px-2 py-1 backdrop-blur-sm">
          <div className="text-xxs font-medium text-gray-600">
            {status === "Resolved" ? "Resolved" : "Resolves"}
          </div>
          <div className="text-xs font-bold text-gray-900">
            {new Intl.DateTimeFormat("default", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }).format(resolutionDateEstimate)}
          </div>
        </div>
      )}

      {status === "Proposed" && (
        <div className="rounded-md bg-white/60 px-2 py-1 backdrop-blur-sm">
          <div className="text-xxs font-medium text-gray-600">Reports Open</div>
          <div className="text-xs font-bold text-gray-900">
            {new Intl.DateTimeFormat("default", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }).format(reportsOpenAt)}
          </div>
        </div>
      )}

      {token ? (
        <div className="rounded-md bg-white/60 px-2 py-1 backdrop-blur-sm">
          <div className="text-xxs font-medium text-gray-600">Volume</div>
          <div className="text-xs font-bold text-gray-900">
            {formatNumberCompact(volume)} {token}
          </div>
        </div>
      ) : (
        <div className="rounded-md bg-white/60 px-2 py-1 backdrop-blur-sm">
          <Skeleton width="60px" height="24px" />
        </div>
      )}

      {isStatsLoading === false && token ? (
        <div className="rounded-md bg-white/60 px-2 py-1 backdrop-blur-sm">
          <div className="text-xxs font-medium text-gray-600">Liquidity</div>
          <div className="text-xs font-bold text-gray-900">
            {formatNumberCompact(
              new Decimal(liquidity ?? 0)?.div(ZTG).toNumber(),
            )}{" "}
            {token}
          </div>
        </div>
      ) : (
        <div className="rounded-md bg-white/60 px-2 py-1 backdrop-blur-sm">
          <Skeleton width="60px" height="24px" />
        </div>
      )}

      {isStatsLoading === false && token ? (
        <div className="rounded-md bg-white/60 px-2 py-1 backdrop-blur-sm">
          <div className="text-xxs font-medium text-gray-600">Traders</div>
          <div className="text-xs font-bold text-gray-900">
            {formatNumberCompact(participants ?? 0)}
          </div>
        </div>
      ) : (
        <div className="rounded-md bg-white/60 px-2 py-1 backdrop-blur-sm">
          <Skeleton width="60px" height="24px" />
        </div>
      )}
    </div>
  );
};
