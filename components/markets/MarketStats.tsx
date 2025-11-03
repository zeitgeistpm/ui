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
    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 sm:gap-2 md:grid-cols-4 lg:grid-cols-6">
      <div className="rounded-lg bg-white/10 px-2.5 py-1.5 shadow-md backdrop-blur-sm transition-all hover:bg-white/15 sm:px-3 sm:py-2">
        <div className="text-[10px] font-medium text-white/70 sm:text-xs">
          {hasDatePassed(starts) ? "Started" : "Starts"}
        </div>
        <div className="text-xs font-bold leading-tight text-white/90 sm:text-sm">
          {new Intl.DateTimeFormat("default", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }).format(starts)}
        </div>
      </div>

      <div className="rounded-lg bg-white/10 px-2.5 py-1.5 shadow-md backdrop-blur-sm transition-all hover:bg-white/15 sm:px-3 sm:py-2">
        <div className="text-[10px] font-medium text-white/70 sm:text-xs">
          {hasDatePassed(ends) ? "Ended" : "Ends"}
        </div>
        <div className="text-xs font-bold leading-tight text-white/90 sm:text-sm">
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
        <div className="rounded-lg bg-white/10 px-2.5 py-1.5 shadow-md backdrop-blur-sm transition-all hover:bg-white/15 sm:px-3 sm:py-2">
          <div className="text-[10px] font-medium text-white/70 sm:text-xs">
            {status === "Resolved" ? "Resolved" : "Resolves"}
          </div>
          <div className="text-xs font-bold leading-tight text-white/90 sm:text-sm">
            {new Intl.DateTimeFormat("default", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }).format(resolutionDateEstimate)}
          </div>
        </div>
      )}

      {status === "Proposed" && (
        <div className="rounded-lg bg-white/10 px-2.5 py-1.5 shadow-md backdrop-blur-sm transition-all hover:bg-white/15 sm:px-3 sm:py-2">
          <div className="text-[10px] font-medium text-white/70 sm:text-xs">Reports Open</div>
          <div className="text-xs font-bold leading-tight text-white/90 sm:text-sm">
            {new Intl.DateTimeFormat("default", {
              month: "short",
              day: "numeric",
              year: "numeric",
            }).format(reportsOpenAt)}
          </div>
        </div>
      )}

      {token ? (
        <div className="rounded-lg bg-white/10 px-2.5 py-1.5 shadow-md backdrop-blur-sm transition-all hover:bg-white/15 sm:px-3 sm:py-2">
          <div className="text-[10px] font-medium text-white/70 sm:text-xs">Volume</div>
          <div className="text-xs font-bold leading-tight text-white/90 sm:text-sm">
            {formatNumberCompact(volume)} {token}
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-white/10 px-2.5 py-1.5 shadow-md backdrop-blur-sm sm:px-4 sm:py-2.5">
          <Skeleton width="60px" height="20px" className="sm:h-6" />
        </div>
      )}

      {isStatsLoading === false && token ? (
        <div className="rounded-lg bg-white/10 px-2.5 py-1.5 shadow-md backdrop-blur-sm transition-all hover:bg-white/15 sm:px-3 sm:py-2">
          <div className="text-[10px] font-medium text-white/70 sm:text-xs">Liquidity</div>
          <div className="text-xs font-bold leading-tight text-white/90 sm:text-sm">
            {formatNumberCompact(
              new Decimal(liquidity ?? 0)?.div(ZTG).toNumber(),
            )}{" "}
            {token}
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-white/10 px-2.5 py-1.5 shadow-md backdrop-blur-sm sm:px-4 sm:py-2.5">
          <Skeleton width="60px" height="20px" className="sm:h-6" />
        </div>
      )}

      {isStatsLoading === false && token ? (
        <div className="rounded-lg bg-white/10 px-2.5 py-1.5 shadow-md backdrop-blur-sm transition-all hover:bg-white/15 sm:px-3 sm:py-2">
          <div className="text-[10px] font-medium text-white/70 sm:text-xs">Traders</div>
          <div className="text-xs font-bold leading-tight text-white/90 sm:text-sm">
            {formatNumberCompact(participants ?? 0)}
          </div>
        </div>
      ) : (
        <div className="rounded-lg bg-white/10 px-2.5 py-1.5 shadow-md backdrop-blur-sm sm:px-4 sm:py-2.5">
          <Skeleton width="60px" height="20px" className="sm:h-6" />
        </div>
      )}
    </div>
  );
};
