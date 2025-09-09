import { Dialog } from "@headlessui/react";
import { OutcomeReport } from "@zeitgeistpm/indexer";
import {
  IOBaseAssetId,
  IOForeignAssetId,
  MarketStage,
  MarketStatus,
  ScalarRangeType,
  parseAssetId,
} from "@zeitgeistpm/sdk";
import CourtStageTimer from "components/court/CourtStageTimer";
import Avatar from "components/ui/Avatar";
import InfoPopover from "components/ui/InfoPopover";
import Modal from "components/ui/Modal";
import Skeleton from "components/ui/Skeleton";
import Decimal from "decimal.js";
import { PromotedMarket } from "lib/cms/get-promoted-markets";
import { BLOCK_TIME_SECONDS, ZTG } from "lib/constants";
import { lookupAssetImagePath } from "lib/constants/foreign-asset";
import { MarketPageIndexedData } from "lib/gql/markets";
import { useMarketCaseId } from "lib/hooks/queries/court/useMarketCaseId";
import { useIdentity } from "lib/hooks/queries/useIdentity";
import {
  MarketEventHistory,
  useMarketEventHistory,
} from "lib/hooks/queries/useMarketEventHistory";
import { useMarketsStats } from "lib/hooks/queries/useMarketsStats";
import { usePoolStats } from "lib/hooks/queries/usePoolStats";
import { useMarketImage } from "lib/hooks/useMarketImage";
import { MarketReport } from "lib/types";
import { isMarketImageBase64Encoded } from "lib/types/create-market";
import { MarketDispute } from "lib/types/markets";
import { shortenAddress } from "lib/util";
import { estimateMarketResolutionDate } from "lib/util/estimate-market-resolution";
import { formatNumberCompact } from "lib/util/format-compact";
import { formatScalarOutcome } from "lib/util/format-scalar-outcome";
import { hasDatePassed } from "lib/util/hasDatePassed";
import { getMarketStatusDetails } from "lib/util/market-status-details";
import { isAbsoluteUrl } from "next/dist/shared/lib/utils";
import dynamic from "next/dynamic";
import Image from "next/image";
import { FC, PropsWithChildren, useState } from "react";
import { X } from "react-feather";
import { HiOutlineShieldCheck } from "react-icons/hi";
import { MdModeEdit, MdOutlineHistory } from "react-icons/md";
import { AddressDetails } from "./MarketAddresses";
import { MarketTimer, MarketTimerSkeleton } from "./MarketTimer";
import { MarketPromotionCallout } from "./PromotionCallout";
import Link from "next/link";

export const QuillViewer = dynamic(
  () => import("../../components/ui/QuillViewer"),
  {
    ssr: false,
  },
);

const MarketFavoriteToggle = dynamic(() => import("./MarketFavoriteToggle"), {
  ssr: false,
});

export const UserIdentity: FC<
  PropsWithChildren<{
    user: string;
    shorten?: { start?: number; end?: number };
    className?: string;
  }>
> = ({ user, shorten, className }) => {
  const { data: identity } = useIdentity(user ?? "");
  const displayName =
    identity && identity.displayName?.length !== 0
      ? identity.displayName
      : shortenAddress(user, shorten?.start ?? 10, shorten?.end ?? 10);
  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      <Avatar address={user} copy={false} size={18} />
      <span className="flex-1 break-all">{displayName}</span>
    </div>
  );
};

export const HeaderStat: FC<
  PropsWithChildren<{ label: string; border?: boolean }>
> = ({ label, border = true, children }) => {
  return (
    <div className={border ? "pr-2 sm:border-r sm:border-ztg-blue" : ""}>
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
    <span className={`rounded bg-gray-300 px-2.5 py-1 ${className}`}>
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
    <div className="flex gap-2">
      {status === "Resolved" && (
        <div className="flex-1 rounded-lg bg-green-light px-5 py-3">
          <span className="text-gray-500">Outcome:</span>{" "}
          <span className="font-bold">{outcome}</span>
        </div>
      )}

      {status === "Reported" && (
        <div className="flex-1 rounded-lg bg-powderblue px-5 py-3">
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
        <div className="flex-1 rounded-lg bg-yellow-light px-5 py-3">
          <span>{status} Outcome </span>
        </div>
      )}

      {status !== "Resolved" && by && (
        <div className="flex flex-1 gap-2 rounded-lg bg-gray-200 px-5 py-3">
          <span className="text-gray-400">By: </span>
          <div className="flex items-center">
            <Link href={`/portfolio/${by}`}>
              <UserIdentity user={by} />
            </Link>
          </div>
        </div>
      )}

      <div
        className={`center flex w-40  items-center gap-4 rounded-lg bg-powderblue py-3`}
      >
        {marketHistory ? (
          <button
            className="center gap-3 font-medium text-ztg-blue"
            onClick={() => setShowMarketHistory(true)}
          >
            History <MdOutlineHistory size={20} />
          </button>
        ) : (
          <Skeleton width={100} height={24} />
        )}
      </div>
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
      <div className="relative max-h-[670px] overflow-hidden rounded-xl bg-white p-6 sm:min-w-[540px] sm:max-w-[540px] sm:p-10">
        <X
          className="absolute right-5 top-5 cursor-pointer"
          onClick={() => {
            setShowMarketHistory(false);
          }}
        />
        <h3 className="mb-10 text-center font-bold">Market History</h3>
        <div className="sm:overflow-hidden">
          <ol className="h-[500px] list-decimal overflow-y-auto pl-8">
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
                        <Link href={`/portfolio/${marketHistory.reported.by}`}>
                          <UserIdentity
                            user={marketHistory.reported.by}
                            className="items-baseline"
                          />
                        </Link>
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
                              <Link href={`/portfolio/${dispute.by}`}>
                                <UserIdentity
                                  user={dispute?.by}
                                  className="items-baseline"
                                />
                              </Link>
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
  poolId?: number; // Optional poolId for combo markets
  sourceMarketStages?: Array<{ market: any; stage: MarketStage | null | undefined }>; // Stages for source markets in combo pools
}> = ({
  market,
  report,
  disputes,
  resolvedOutcome,
  token,
  marketStage,
  rejectReason,
  promotionData,
  poolId,
  sourceMarketStages,
}) => {
  const {
    categories,
    status,
    question,
    period,
    marketType,
    scalarType,
  } = market;
  const [showMarketHistory, setShowMarketHistory] = useState(false);
  const starts = Number(period.start);
  const ends = Number(period.end);


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

  // Use poolStats for combo markets, marketStats for regular markets
  const { data: marketStats, isLoading: isMarketStatsLoading } = useMarketsStats(
    poolId ? [] : [market.marketId], // Skip if we have poolId
  );
  
  const { data: poolStats, isLoading: isPoolStatsLoading } = usePoolStats(
    poolId ? [poolId] : [], // Only fetch if we have poolId
  );

  const isStatsLoading = poolId ? isPoolStatsLoading : isMarketStatsLoading;
  const stats = poolId ? poolStats : marketStats;
  
  const liquidity = stats?.[0]?.liquidity;
  const participants = poolId ? (poolStats?.[0] as any)?.traders : stats?.[0]?.participants;
  
  // Use volume from poolStats for combo markets, market.volume for regular markets
  const volume = poolId && poolStats?.[0]?.volume 
    ? new Decimal(poolStats[0].volume).div(ZTG).toNumber()
    : new Decimal(market.volume).div(ZTG).toNumber();

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
  const imagePath = lookupAssetImagePath(assetId);

  const { data: caseId } = useMarketCaseId(market.marketId);

  const { data: marketImage } = useMarketImage(market, {
    fallback:
      market.img &&
      isAbsoluteUrl(market.img) &&
      !isMarketImageBase64Encoded(market.img)
        ? market.img
        : undefined,
  });

  return (
    <header className="flex w-full flex-col gap-4">
      <div className="flex items-start gap-3 xl:items-center">
        <div className="hidden lg:block">
          <div className="relative mt-3 h-16 w-16 overflow-hidden rounded-lg xl:mt-0 ">
            <Image
              alt={"Market image"}
              src={marketImage}
              fill
              className="overflow-hidden rounded-lg"
              style={{
                objectFit: "cover",
                objectPosition: "50% 50%",
              }}
              sizes={"100px"}
            />
          </div>
        </div>

        <div>
          <h1 className="text-[32px] font-extrabold">{question}</h1>
          {rejectReason && rejectReason.length > 0 && (
            <div className="mt-2.5">Market rejected: {rejectReason}</div>
          )}
          <div className="flex flex-wrap items-center gap-2">
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
            {(status === "Active" || status === "Closed") && (
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
        </div>
      </div>

      <div className="relative mb-4 flex items-center gap-3 pl-1">
        <AddressDetails title="Creator" address={market.creator} />

        <div className="group relative">
          <Image
            width={20}
            height={20}
            src={imagePath}
            alt="Currency token logo"
            className="rounded-full"
          />
          <div className="absolute bottom-0 right-0 z-10 translate-x-[50%] translate-y-[115%] whitespace-nowrap pt-1 opacity-0 transition-opacity  group-hover:opacity-100">
            <div className="rounded-lg bg-blue-100 px-2 py-1 text-sm">
              <span className="text-gray-500">Currency: </span>
              <span className="font-semibold">{token}</span>
            </div>
          </div>
        </div>

        {market.disputeMechanism === "Court" && (
          <div className="group relative">
            <Image width={22} height={22} src="/icons/court.svg" alt="court" />
            <div className="absolute bottom-0 right-0 z-10 translate-x-[50%] translate-y-[115%] whitespace-nowrap pt-1 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="rounded-lg bg-purple-200 px-2 py-1 text-sm">
                Court Dispute Mechanism Enabled
              </div>
            </div>
          </div>
        )}

        <div className="group relative">
          <Image
            width={22}
            height={22}
            src="/icons/verified-icon.svg"
            alt="verified checkmark"
          />
          <div className="absolute bottom-0 right-0 z-10 translate-x-[50%] translate-y-[115%] whitespace-nowrap pt-1 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="rounded-lg bg-green-lighter px-2 py-1 text-sm">
              Verified Market
            </div>
          </div>
        </div>

        {!market.disputeMechanism && (
          <div className="group relative">
            <InfoPopover
              position="bottom-end"
              icon={
                <div className="center h-[22px] w-[22px] rounded-full bg-orange-200">
                  <HiOutlineShieldCheck size={14} />
                </div>
              }
            >
              <div className="text-left">
                <div className="mb-3">
                  This market has no dispute mechanism and will be resolved
                  automatically when reported.
                </div>
                <div className="flex gap-4">
                  <div>
                    <AddressDetails title="Creator" address={market.creator} />
                  </div>
                  <div>
                    <AddressDetails title="Oracle" address={market.oracle} />
                  </div>
                </div>
              </div>
            </InfoPopover>
            <div className="absolute bottom-0 right-0 z-10 translate-x-[50%] translate-y-[115%] whitespace-nowrap pt-1 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="rounded-lg bg-orange-200 px-2 py-1 text-sm">
                Trusted Market
              </div>
            </div>
          </div>
        )}

        {market.hasEdits && (
          <div className="group relative">
            <InfoPopover
              position="bottom-end"
              icon={
                <div className="center h-[22px] w-[22px] rounded-full bg-yellow-200">
                  <MdModeEdit size={12} />
                </div>
              }
            >
              <div className="text-left">
                <h4 className="mb-1 text-lg font-bold">Market edits</h4>
                <p className="mb-3 text-sm text-gray-500">
                  This market has been edited in the zeitgeist cms. The
                  following is the immutable original metadata that was set when
                  the market was created.
                </p>

                {market.originalMetadata?.question && (
                  <div className="mb-3">
                    <label className="mb-1 text-xs text-gray-500">
                      Question:
                    </label>
                    <div>{market.originalMetadata.question}</div>
                  </div>
                )}

                {market.originalMetadata?.description && (
                  <div className="mb-3">
                    <label className="mb-1 text-xs text-gray-500">
                      Description:
                    </label>
                    <div>
                      <QuillViewer
                        value={market.originalMetadata.description}
                      />
                    </div>
                  </div>
                )}
              </div>
            </InfoPopover>
            <div className="absolute bottom-0 right-0 z-10 translate-x-[50%] translate-y-[115%] whitespace-nowrap pt-1 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="rounded-lg bg-yellow-200 px-2 py-1 text-sm">
                Has been edited.
              </div>
            </div>
          </div>
        )}
        <div className="group relative flex items-center">
          <div className="pt-1">
            <MarketFavoriteToggle size={24} marketId={market.marketId} />
          </div>
          <div className="absolute bottom-0 right-0 z-10 translate-x-[50%] translate-y-[115%] whitespace-nowrap opacity-0 transition-opacity group-hover:opacity-100">
            <div className="rounded-lg bg-pink-300 px-2 py-1 text-sm">
              Toggle Favorited
            </div>
          </div>
        </div>

        {promotionData && (
          <MarketPromotionCallout market={market} promotion={promotionData} />
        )}
      </div>

      <div className="flex w-full flex-col gap-2">
        {/* Show source market statuses for combo pools */}
        {poolId && sourceMarketStages ? (
          <>
            <div className="mb-2 text-sm font-semibold text-gray-700">Source Market Status:</div>
            {sourceMarketStages.map((item, index) => (
              <div key={index} className="rounded-lg border border-gray-200 p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-600">
                    Market {index + 1} (ID: {item.market?.marketId})
                  </span>
                  <span className="text-xs text-gray-500">
                    {item.market?.status}
                  </span>
                </div>
                {item.stage ? (
                  <MarketTimer stage={item.stage} />
                ) : (
                  <MarketTimerSkeleton />
                )}
              </div>
            ))}
          </>
        ) : (
          // Regular market timer display
          marketStage?.type === "Court" ? (
            <div className="w-full">
              <h3 className="mb-2 text-sm text-gray-700">Market is in court</h3>
              {caseId != null ? (
                <CourtStageTimer caseId={caseId} />
              ) : (
                <Skeleton height={22} className="w-full rounded-md" />
              )}
            </div>
          ) : marketStage ? (
            <MarketTimer stage={marketStage} />
          ) : (
            <MarketTimerSkeleton />
          )
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
