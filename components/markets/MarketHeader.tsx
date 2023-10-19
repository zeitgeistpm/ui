import {
  IOBaseAssetId,
  IOForeignAssetId,
  MarketStage,
  MarketStatus,
  ScalarRangeType,
  parseAssetId,
} from "@zeitgeistpm/sdk";
import Avatar from "components/ui/Avatar";
import Skeleton from "components/ui/Skeleton";
import Decimal from "decimal.js";
import { BLOCK_TIME_SECONDS, ZTG } from "lib/constants";
import { X } from "react-feather";
import { MarketPageIndexedData } from "lib/gql/markets";
import { useIdentity } from "lib/hooks/queries/useIdentity";
import { shortenAddress } from "lib/util";
import { formatNumberCompact } from "lib/util/format-compact";
import { hasDatePassed } from "lib/util/hasDatePassed";
import { FC, PropsWithChildren, useState } from "react";
import { MarketTimer } from "./MarketTimer";
import { MarketTimerSkeleton } from "./MarketTimer";
import { OutcomeReport } from "@zeitgeistpm/indexer";
import {
  MarketEventHistory,
  useMarketEventHistory,
} from "lib/hooks/queries/useMarketEventHistory";
import Modal from "components/ui/Modal";
import { getMarketStatusDetails } from "lib/util/market-status-details";
import { formatScalarOutcome } from "lib/util/format-scalar-outcome";
import { Dialog } from "@headlessui/react";
import { usePoolLiquidity } from "lib/hooks/queries/usePoolLiquidity";
import { estimateMarketResolutionDate } from "lib/util/estimate-market-resolution";
import { MarketReport } from "lib/types";
import { AddressDetails } from "./MarketAddresses";
import Image from "next/image";
import {
  FOREIGN_ASSET_METADATA,
  lookupAssetImagePath,
} from "lib/constants/foreign-asset";
import { useMarketsStats } from "lib/hooks/queries/useMarketsStats";
import { MarketPromotionCallout } from "./PromotionCallout";
import { PromotedMarket } from "lib/cms/get-promoted-markets";
import { MarketDispute } from "lib/types/markets";

export const UserIdentity: FC<
  PropsWithChildren<{ user: string; className?: string }>
> = ({ user, className }) => {
  const { data: identity } = useIdentity(user ?? "");
  const displayName =
    identity && identity.displayName?.length !== 0
      ? identity.displayName
      : shortenAddress(user, 10, 10);
  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <Avatar address={user} copy={false} size={18} />
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
    marketHistory: MarketEventHistory;
    status: MarketStatus;
    outcome: string | number;
    by?: string;
  }>
> = ({ status, outcome, by, setShowMarketHistory, marketHistory }) => {
  return (
    <div
      className={`w-full flex center items-center gap-4 py-3 rounded-lg ${
        status === "Resolved"
          ? "bg-green-light"
          : status === "Reported"
          ? "bg-powderblue"
          : "bg-yellow-light"
      }`}
    >
      <div className="center gap-1">
        {status === "Reported" && (
          <div className="flex gap-1">
            <span>{status} Outcome </span>
            {outcome ? (
              <span className="font-bold">{outcome}</span>
            ) : status === "Reported" ? (
              <Skeleton width={100} height={24} />
            ) : (
              ""
            )}
          </div>
        )}

        {status === "Disputed" && (
          <div className="flex gap-1">
            <span>{status} Outcome </span>
          </div>
        )}

        {status !== "Resolved" && by && (
          <div className="flex items-center gap-4">
            <span>by: </span>
            <div className="flex items-center">
              <UserIdentity user={by} />
            </div>
          </div>
        )}
      </div>

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
    marketHistory: MarketEventHistory;
    oracleReported: boolean;
    categories: { name: string; color: string }[];
    marketType: {
      scalar: string[];
      categorical: string;
    };
    scalarType: ScalarRangeType;
  }>
> = ({
  marketHistory,
  oracleReported,
  categories,
  marketType,
  setShowMarketHistory,
  scalarType,
}) => {
  const marketStart = new Intl.DateTimeFormat("default", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(marketHistory?.start?.timestamp);
  const marketClosed = new Intl.DateTimeFormat("default", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(marketHistory?.end?.timestamp);
  const getOutcome = (outcome: OutcomeReport) => {
    if (marketType.scalar === null) {
      return categories[outcome.categorical!]?.name;
    } else {
      return formatScalarOutcome(outcome["scalar"], scalarType);
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
          <ol className="list-decimal pl-8 overflow-y-auto h-[500px]">
            <li className="mb-8 list-item">
              <p> Market opened</p>
              <p className="pb-1 text-sm text-gray-500">
                {marketStart}{" "}
                {marketHistory?.start?.blockNumber > 0 &&
                  `(block: ${marketHistory?.start.blockNumber})`}
              </p>
            </li>
            <li className="mb-8 list-item">
              <p> Market closed</p>
              <p className="pb-1 text-sm text-gray-500">
                {marketClosed}{" "}
                {marketHistory?.end?.blockNumber > 0 &&
                  `(block: ${marketHistory?.end.blockNumber})`}
              </p>
            </li>
            {marketHistory?.reported && (
              <li className="mb-8 list-item">
                <div>
                  {oracleReported && "Oracle "}
                  <span className="inline font-medium">
                    <span className="font-bold">
                      {marketHistory?.reported?.by ? (
                        <UserIdentity
                          user={marketHistory.reported.by}
                          className="items-baseline"
                        />
                      ) : (
                        "Unknown"
                      )}
                    </span>{" "}
                    reported{" "}
                    <span className="font-bold">
                      {getOutcome(marketHistory?.reported.outcome)}
                    </span>
                  </span>
                </div>
                <p className="pb-1 text-sm text-gray-500">
                  {marketHistory?.reported.timestamp &&
                    new Intl.DateTimeFormat("default", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(marketHistory?.reported.timestamp)}{" "}
                  (block: {marketHistory?.reported?.blockNumber})
                </p>
              </li>
            )}
            {marketHistory?.disputes &&
              marketHistory?.disputes.map((dispute) => {
                return (
                  <li key={dispute.timestamp} className="mb-8">
                    <div className="pb-1">
                      {oracleReported ?? "Oracle"}
                      <span className="flex items-center ">
                        <span className="inline font-medium">
                          <span className="font-bold">
                            {dispute?.by ? (
                              <UserIdentity
                                user={dispute?.by}
                                className="items-baseline"
                              />
                            ) : (
                              "Unknown"
                            )}
                          </span>{" "}
                          disputed the reported outcome.
                        </span>
                      </span>
                      <span className="text-sm text-gray-500">
                        {dispute.timestamp &&
                          new Intl.DateTimeFormat("default", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(dispute.timestamp)}{" "}
                        (block: {dispute?.blockNumber})
                      </span>
                    </div>
                  </li>
                );
              })}
            {marketHistory?.resolved?.resolvedOutcome && (
              <li className="mb-8 list-item">
                <p className="pb-1">
                  Market resolved to{" "}
                  <span className="font-bold">
                    {marketType.scalar === null
                      ? categories[marketHistory?.resolved?.resolvedOutcome]
                          ?.name
                      : formatScalarOutcome(
                          marketHistory?.resolved?.resolvedOutcome,
                          scalarType,
                        )}
                  </span>
                </p>
                <span className="text-sm text-gray-500">
                  {marketHistory?.resolved?.timestamp &&
                    new Intl.DateTimeFormat("default", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(marketHistory?.resolved?.timestamp)}{" "}
                  (block: {marketHistory?.resolved?.blockNumber})
                </span>{" "}
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
  report?: MarketReport;
  disputes?: MarketDispute;
  resolvedOutcome?: string;
  token?: string;
  marketStage?: MarketStage;
  rejectReason?: string;
  promotionData?: PromotedMarket | null;
}> = ({
  market,
  report,
  disputes,
  resolvedOutcome,
  token,
  marketStage,
  rejectReason,
  promotionData,
}) => {
  const { categories, status, question, period, marketType, pool, scalarType } =
    market;
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
    scalarType,
    disputes,
    report,
    resolvedOutcome,
  );

  const { data: marketHistory } = useMarketEventHistory(
    market.marketId.toString(),
  );

  const { data: stats, isLoading: isStatsLoading } = useMarketsStats([
    market.marketId,
  ]);

  const liquidity = stats?.[0].liquidity;
  const participants = stats?.[0].participants;

  const oracleReported = marketHistory?.reported?.by === market.oracle;

  const gracePeriodMS =
    Number(market.deadlines?.gracePeriod ?? 0) * BLOCK_TIME_SECONDS * 1000;
  const reportsOpenAt = Number(market.period.end) + gracePeriodMS;
  const resolutionDateEstimate = estimateMarketResolutionDate(
    new Date(Number(market.period.end)),
    BLOCK_TIME_SECONDS,
    Number(market.deadlines?.gracePeriod ?? 0),
    Number(market.deadlines?.oracleDuration ?? 0),
    Number(market.deadlines?.disputeDuration ?? 0),
  );

  const assetId = parseAssetId(market.baseAsset).unwrap();
  const imagePath = IOForeignAssetId.is(assetId)
    ? lookupAssetImagePath(assetId.ForeignAsset)
    : IOBaseAssetId.is(assetId)
    ? lookupAssetImagePath(assetId.Ztg)
    : "";

  return (
    <header className="flex flex-col gap-4 w-full">
      <h1 className="text-[32px] font-extrabold">{question}</h1>
      {rejectReason && rejectReason.length > 0 && (
        <div className="mt-2.5">Market rejected: {rejectReason}</div>
      )}
      <div className="flex flex-wrap items-center gap-2 mb-4">
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
        {(market.status === "Active" || market.status === "Closed") && (
          <HeaderStat label="Resolves">
            {new Intl.DateTimeFormat("default", {
              dateStyle: "medium",
            }).format(resolutionDateEstimate)}
          </HeaderStat>
        )}
        {market.status === "Proposed" && (
          <HeaderStat label="Reports Open">
            {new Intl.DateTimeFormat("default", {
              dateStyle: "medium",
            }).format(reportsOpenAt)}
          </HeaderStat>
        )}
        {token ? (
          <HeaderStat label="Volume">
            {formatNumberCompact(volume)}
            &nbsp;
            {token}
          </HeaderStat>
        ) : (
          <Skeleton width="150px" height="20px" />
        )}
        {isStatsLoading === false && token ? (
          <HeaderStat label="Liquidity" border={true}>
            {formatNumberCompact(
              new Decimal(liquidity ?? 0)?.div(ZTG).toNumber(),
            )}
            &nbsp;
            {token}
          </HeaderStat>
        ) : (
          <Skeleton width="150px" height="20px" />
        )}
        {isStatsLoading === false && token ? (
          <HeaderStat label="Traders" border={false}>
            {formatNumberCompact(participants ?? 0)}
          </HeaderStat>
        ) : (
          <Skeleton width="150px" height="20px" />
        )}
      </div>
      <div className="flex relative items-center gap-3 mb-4">
        <AddressDetails title="Creator" address={market.creator} />

        <div className="relative group">
          <Image
            width={20}
            height={20}
            src={imagePath}
            alt="Currency token logo"
            className="rounded-full"
          />
          <div className="opacity-0 transition-opacity absolute right-0 bottom-0 translate-x-[50%] z-10 translate-y-[115%] group-hover:opacity-100 pt-1  whitespace-nowrap">
            <div className="py-1 px-2 text-sm bg-blue-100 rounded-lg">
              <span className="text-gray-500">Currency: </span>
              <span className="font-semibold">{token}</span>
            </div>
          </div>
        </div>

        {market.disputeMechanism === "Court" && (
          <div className="relative group">
            <Image width={22} height={22} src="/icons/court.svg" alt="court" />
            <div className="opacity-0 transition-opacity absolute right-0 bottom-0 translate-x-[50%] z-10 translate-y-[115%] group-hover:opacity-100 pt-1 whitespace-nowrap">
              <div className="py-1 px-2 text-sm bg-purple-200 rounded-lg">
                Court Dispute Mechanism Enables
              </div>
            </div>
          </div>
        )}

        <div className="relative group">
          <Image
            width={22}
            height={22}
            src="/icons/verified-icon.svg"
            alt="verified checkmark"
          />
          <div className="opacity-0 transition-opacity absolute right-0 bottom-0 translate-x-[50%] z-10 translate-y-[115%] group-hover:opacity-100 pt-1 whitespace-nowrap">
            <div className="py-1 px-2 text-sm bg-green-lighter rounded-lg">
              Verified Market
            </div>
          </div>
        </div>

        {promotionData && (
          <MarketPromotionCallout market={market} promotion={promotionData} />
        )}
      </div>
      <div className="flex w-full">
        {marketStage ? (
          <MarketTimer stage={marketStage} />
        ) : (
          <MarketTimerSkeleton />
        )}
      </div>

      {(status === "Reported" ||
        status === "Disputed" ||
        status === "Resolved") &&
        marketHistory && (
          <MarketOutcome
            setShowMarketHistory={setShowMarketHistory}
            status={status}
            outcome={outcome ?? ""}
            by={by}
            marketHistory={marketHistory}
          />
        )}

      <Modal
        open={showMarketHistory}
        onClose={() => setShowMarketHistory(false)}
      >
        {marketHistory && (
          <MarketHistory
            starts={starts}
            ends={ends}
            marketHistory={marketHistory}
            oracleReported={oracleReported}
            categories={categories}
            marketType={marketType}
            setShowMarketHistory={setShowMarketHistory}
            scalarType={scalarType}
          />
        )}
      </Modal>
    </header>
  );
};

export default MarketHeader;
