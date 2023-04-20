import { Skeleton } from "@material-ui/lab";
import { formatNumberCompact } from "lib/util/format-compact";
import { hasDatePassed } from "lib/util/hasDatePassed";
import { FC, PropsWithChildren } from "react";
import { MarketStage } from "@zeitgeistpm/sdk-next";
import { MarketTimer } from "./MarketTimer";
import { MarketTimerSkeleton } from "./MarketTimer";
import { MarketPageIndexedData } from "lib/gql/markets";
import { ZTG } from "lib/constants";
import Decimal from "decimal.js";
import Avatar from "components/ui/Avatar";
import { shortenAddress } from "lib/util";
import { getMarketStatusDetails } from "lib/util/market-status-details";

const HeaderStat: FC<PropsWithChildren<{ label: string; border?: boolean }>> =
  ({ label, border = true, children }) => {
    return (
      <div className={border ? "sm:border-r sm:border-ztg-blue pr-2" : ""}>
        <span>{label}: </span>
        <span className="font-medium">{children}</span>
      </div>
    );
  };

const Tag: FC<PropsWithChildren<{ className?: string }>> = ({
  className,
  children,
}) => {
  return (
    <span className={`px-2.5 py-1 rounded bg-gray-300 ${className}`}>
      {children}
    </span>
  );
};

const MarketOutcome: FC<
  PropsWithChildren<{ status: string; outcome: string | number; by?: string }>
> = ({ status, outcome, by }) => {
  return (
    <div
      className={`w-full flex center items-center gap-4 py-6 mb-10 rounded-lg ${
        status === "Resolved"
          ? "bg-green-light"
          : status === "Reported"
          ? "bg-powderblue"
          : "bg-yellow-light"
      }`}
    >
      <div className="">
        <span>{status} Outome: </span>
        <span className="font-bold">{outcome}</span>
      </div>
      {status !== "Resolved" && (
        <div className="flex items-center gap-4">
          <span>{status} by: </span>
          <div className="flex items-center">
            <Avatar address={by} />
            <span className="font-medium px-3.5 text-sms h-full leading-[40px]">
              {shortenAddress(by, 6, 4)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

const MarketHeader: FC<{
  market: MarketPageIndexedData;
  token: string;
  prizePool: number;
  subsidy: number;
  marketStage: MarketStage;
  rejectReason?: string;
}> = ({ market, prizePool, subsidy, token, marketStage, rejectReason }) => {
  const {
    tags,
    categories,
    status,
    question,
    period,
    marketType,
    pool,
    disputes,
    report,
    resolvedOutcome,
  } = market;
  const starts = Number(period.start);
  const ends = Number(period.end);
  const volume = pool?.volume
    ? new Decimal(pool?.volume).div(ZTG).toNumber()
    : 0;

  const { outcome, by } = getMarketStatusDetails(
    marketType,
    categories,
    status,
    disputes,
    report,
    resolvedOutcome,
  );

  console.log(outcome, by);
  return (
    <header className="flex flex-col items-center w-full max-w-[1000px] mx-auto">
      <h1 className="text-4xl font-extrabold my-5 text-center">{question}</h1>
      <div className="flex flex-wrap justify-center gap-2.5">
        <Tag className={`${status === "Active" && "!bg-green-lighter"}`}>
          {status === "Active" && <span className="text-green">&#x2713; </span>}
          {status}
        </Tag>
        {tags?.map((tag, index) => {
          return <Tag key={index}>{tag}</Tag>;
        })}
        <Tag className="!bg-black text-white">
          {marketType?.scalar === null ? "Categorical" : "Scalar"}
        </Tag>
      </div>
      {rejectReason && rejectReason.length > 0 && (
        <div className="mt-2.5">Market rejected: {rejectReason}</div>
      )}
      <div className="flex justify-center my-8 w-full">
        {marketStage ? (
          <MarketTimer stage={marketStage} />
        ) : (
          <MarketTimerSkeleton />
        )}
      </div>
      <div className="flex flex-col sm:flex-row sm:flex-wrap items-center justify-center gap-2 mb-5">
        <HeaderStat label={hasDatePassed(starts) ? "Started" : "Starts"}>
          {new Intl.DateTimeFormat("default", {
            dateStyle: "medium",
          }).format(starts)}
        </HeaderStat>
        <HeaderStat label={hasDatePassed(ends) ? "Ended" : "Ends"}>
          {new Intl.DateTimeFormat("default", {
            dateStyle: "medium",
          }).format(ends)}
        </HeaderStat>
        {token ? (
          <HeaderStat label="Volume">
            {formatNumberCompact(volume)}
            &nbsp;
            {token}
          </HeaderStat>
        ) : (
          <Skeleton width="150px" height="24px" />
        )}
        {prizePool >= 0 && token ? (
          <HeaderStat label="Prize Pool">
            {formatNumberCompact(prizePool)}
            &nbsp;
            {token}
          </HeaderStat>
        ) : (
          <Skeleton width="150px" height="24px" />
        )}
        {subsidy >= 0 && token ? (
          <HeaderStat label="Subsidy" border={false}>
            {formatNumberCompact(subsidy)}
            &nbsp;
            {token}
          </HeaderStat>
        ) : (
          <Skeleton width="150px" height="24px" />
        )}
      </div>
      {(status === "Reported" ||
        status === "Disputed" ||
        status === "Resolved") && (
        <MarketOutcome status={status} outcome={outcome} by={by} />
      )}
    </header>
  );
};

export default MarketHeader;
