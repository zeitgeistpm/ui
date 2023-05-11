import {
  MarketStage,
  MarketStatus,
  ScalarRangeType,
} from "@zeitgeistpm/sdk-next";
import Avatar from "components/ui/Avatar";
import Skeleton from "components/ui/Skeleton";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { X } from "react-feather";
import { MarketPageIndexedData } from "lib/gql/markets";
import { useIdentity } from "lib/hooks/queries/useIdentity";
import { shortenAddress } from "lib/util";
import { formatNumberCompact } from "lib/util/format-compact";
import { hasDatePassed } from "lib/util/hasDatePassed";
import { FC, PropsWithChildren, useState } from "react";
import { MarketTimer } from "./MarketTimer";
import { MarketTimerSkeleton } from "./MarketTimer";
import { MarketDispute, OutcomeReport } from "@zeitgeistpm/sdk/dist/types";
import {
  MarketHistory,
  useMarketEventHistory,
} from "lib/hooks/queries/useMarketEventHistory";
import Modal from "components/ui/Modal";
import { getMarketStatusDetails } from "lib/util/market-status-details";
import { getScalarOutcome } from "lib/util/get-scalar-outcome";
import { Dialog } from "@headlessui/react";

const UserIdentity: FC<PropsWithChildren<{ user: string }>> = ({ user }) => {
  const { data: identity } = useIdentity(user ?? "");
  const displayName =
    identity?.displayName?.length > 0
      ? identity.displayName
      : shortenAddress(user, 10, 10);
  return (
    <div className="inline-flex items-baseline gap-1">
      <Avatar address={user} />
      <span className="break-all flex-1">{displayName}</span>
    </div>
  );
};

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
  PropsWithChildren<{
    setShowMarketHistory: (show: boolean) => void;
    marketHistory: MarketHistory;
    status: MarketStatus;
    outcome: string | number;
    by?: string;
  }>
> = ({ status, outcome, by, setShowMarketHistory, marketHistory }) => {
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
      <div className="flex gap-1">
        <span>{status} Outome: </span>
        {outcome ? (
          <span className="font-bold">{outcome}</span>
        ) : (
          <Skeleton width={100} height={24} />
        )}
      </div>
      {status !== "Resolved" && by && (
        <div className="flex items-center gap-4">
          <span>{status} by: </span>
          <div className="flex items-center">
            <UserIdentity user={by} />
          </div>
        </div>
      )}
      {marketHistory ? (
        <button
          className="text-ztg-blue font-medium"
          onClick={() => setShowMarketHistory(true)}
        >
          See History
        </button>
      ) : (
        <Skeleton width={100} height={24} />
      )}
    </div>
  );
};

const MarketHistory: FC<
  PropsWithChildren<{
    setShowMarketHistory: (show: boolean) => void;
    starts: number;
    ends: number;
    marketHistory: MarketHistory;
    categories: { name: string; color: string }[];
    marketType: {
      scalar: string[];
      categorical: string;
    };
    scalarType: ScalarRangeType;
  }>
> = ({
  marketHistory,
  categories,
  marketType,
  setShowMarketHistory,
  scalarType,
}) => {
  const marketStart = new Intl.DateTimeFormat("default", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(marketHistory?.start.timestamp);
  const marketClosed = new Intl.DateTimeFormat("default", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(marketHistory?.end.timestamp);

  const getOutcome = (outcome: OutcomeReport) => {
    if (marketType.scalar === null) {
      return categories[outcome["categorical"]]?.name;
    } else {
      return getScalarOutcome(outcome["scalar"], scalarType);
    }
  };

  return (
    <Dialog.Panel>
      <div className="bg-white p-6 sm:p-10 max-h-[670px] sm:min-w-[540px] sm:max-w-[540px] relative overflow-hidden rounded-xl">
        <X
          className="absolute top-5 right-5 cursor-pointer"
          onClick={() => {
            setShowMarketHistory(false);
          }}
        />
        <h3 className="font-bold mb-10 text-center">Market History</h3>
        <div className="sm:overflow-hidden">
          <ol className="list-decimal pl-8 overflow-y-auto h-[500px] w-[calc(100%+16px)]">
            <li className="mb-8 list-item">
              <p className="pb-1">
                {marketStart}{" "}
                {marketHistory?.start.block > 0 &&
                  `(block: ${marketHistory?.start.block})`}
              </p>
              <p> Market opened</p>
            </li>
            <li className="mb-8 list-item">
              <p className="pb-1">
                {marketClosed}{" "}
                {marketHistory?.end.block > 0 &&
                  `(block: ${marketHistory?.end.block})`}
              </p>
              <p> Market closed</p>
            </li>
            {marketHistory?.reported && (
              <li className="mb-8 list-item">
                <p className="pb-1">
                  {marketHistory?.reported.timestamp > 0 &&
                    new Intl.DateTimeFormat("default", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(marketHistory?.reported.timestamp)}{" "}
                  (block: {marketHistory?.reported.at})
                </p>
                <div>
                  {marketHistory?.oracleReported && "Oracle "}
                  <span className="inline font-medium">
                    <span className="font-bold">
                      <UserIdentity user={marketHistory?.reported.by} />
                    </span>{" "}
                    reported{" "}
                    <span className="font-bold">
                      {getOutcome(marketHistory?.reported.outcome)}
                    </span>
                  </span>
                </div>
              </li>
            )}
            {marketHistory?.disputes &&
              marketHistory?.disputes.map((dispute) => {
                return (
                  <li key={dispute.timestamp} className="mb-8">
                    <p className="pb-1">
                      {dispute.timestamp > 0 &&
                        new Intl.DateTimeFormat("default", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(dispute.timestamp)}{" "}
                      (block: {dispute.at})
                    </p>
                    <div>
                      {marketHistory.oracleReported ?? "Oracle"}
                      <span className="flex items-center">
                        <span className="inline font-medium">
                          <span className="font-bold">
                            <UserIdentity user={dispute.by} />
                          </span>{" "}
                          disputed and suggested{" "}
                          <span className="font-bold">
                            {getOutcome(dispute.outcome)}
                          </span>
                        </span>
                      </span>
                    </div>
                  </li>
                );
              })}
            {marketHistory?.resolved && (
              <li className="mb-8 list-item">
                <p className="pb-1">
                  {marketHistory?.resolved?.["timestamp"] &&
                    new Intl.DateTimeFormat("default", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(marketHistory?.resolved?.["timestamp"])}{" "}
                  (block: {marketHistory?.resolved?.["block"]})
                  <span className="block">
                    Market resolved to{" "}
                    <span className="font-bold">
                      {marketType.scalar === null
                        ? categories[marketHistory?.resolved?.["outcome"]].name
                        : getScalarOutcome(
                            marketHistory?.resolved?.["outcome"],
                            scalarType,
                          )}
                    </span>
                  </span>
                </p>
              </li>
            )}
          </ol>
        </div>
      </div>
    </Dialog.Panel>
  );
};

const MarketHeader: FC<{
  market: MarketPageIndexedData;
  report: MarketDispute;
  disputes: MarketDispute;
  resolvedOutcome: string;
  prizePool: number;
  subsidy: number;
  token: string;
  marketStage: MarketStage;
  rejectReason?: string;
}> = ({
  market,
  report,
  disputes,
  resolvedOutcome,
  prizePool,
  subsidy,
  token,
  marketStage,
  rejectReason,
}) => {
  const {
    tags,
    categories,
    status,
    question,
    period,
    marketType,
    pool,
    scalarType,
  } = market;
  const [showMarketHistory, setShowMarketHistory] = useState(false);
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
    scalarType,
  );

  const { data: marketHistory } = useMarketEventHistory(
    market.marketId.toString(),
  );

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
          <Skeleton width="150px" height="20px" />
        )}
        {prizePool >= 0 && token ? (
          <HeaderStat label="Prize Pool">
            {formatNumberCompact(prizePool)}
            &nbsp;
            {token}
          </HeaderStat>
        ) : (
          <Skeleton width="150px" height="20px" />
        )}
        {subsidy >= 0 && token ? (
          <HeaderStat label="Subsidy" border={false}>
            {formatNumberCompact(subsidy)}
            &nbsp;
            {token}
          </HeaderStat>
        ) : (
          <Skeleton width="150px" height="20px" />
        )}
      </div>
      {(status === "Reported" ||
        status === "Disputed" ||
        status === "Resolved") && (
        <MarketOutcome
          setShowMarketHistory={setShowMarketHistory}
          status={status}
          outcome={outcome}
          by={by}
          marketHistory={marketHistory}
        />
      )}

      <Modal
        open={showMarketHistory}
        onClose={() => setShowMarketHistory(false)}
      >
        <MarketHistory
          starts={starts}
          ends={ends}
          marketHistory={marketHistory}
          categories={categories}
          marketType={marketType}
          setShowMarketHistory={setShowMarketHistory}
          scalarType={scalarType}
        />
      </Modal>
    </header>
  );
};

export default MarketHeader;
