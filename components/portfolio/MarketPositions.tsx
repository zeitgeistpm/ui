// import { Skeleton } from "@material-ui/lab";
import Skeleton from "components/ui/Skeleton";
import {
  IndexerContext,
  IOMarketOutcomeAssetId,
  IOPoolShareAssetId,
  Market,
  ZTG,
} from "@zeitgeistpm/sdk-next";
import DisputeButton from "components/assets/AssetActionButtons/DisputeButton";
import RedeemButton from "components/assets/AssetActionButtons/RedeemButton";
import ReportButton from "components/assets/AssetActionButtons/ReportButton";
import TradeButton from "components/assets/AssetActionButtons/TradeButton";
import Table, { TableData } from "components/ui/Table";
import Decimal from "decimal.js";
import { useMarketStage } from "lib/hooks/queries/useMarketStage";
import { Position } from "lib/hooks/queries/usePortfolioPositions";
import { useStore } from "lib/stores/Store";
import { useWallet } from "lib/state/wallet";
import Link from "next/link";
import MarketPositionHeader from "./MarketPositionHeader";

export type MarketPositionsProps = {
  usdZtgPrice: Decimal;
  positions: Position[];
  market: Market<IndexerContext>;
  className?: string;
};

export const MarketPositions = ({
  positions,
  usdZtgPrice,
  market,
  className,
}: MarketPositionsProps) => {
  const { data: marketStage } = useMarketStage(market);

  const wallet = useWallet();
  const store = useStore();
  const userAddress = wallet.getActiveSigner()?.address;
  const isOracle = market?.oracle === userAddress;

  return (
    <div className={`${className}`}>
      <MarketPositionHeader
        marketId={market.marketId}
        question={market.question}
      />
      <Table
        columns={[
          {
            header: "Outcomes",
            accessor: "outcome",
            type: "text",
          },
          {
            header: "Balance",
            accessor: "userBalance",
            type: "number",
          },
          {
            header: "Price",
            accessor: "price",
            type: "currency",
          },
          {
            header: "Total Value",
            accessor: "value",
            type: "currency",
          },
          {
            header: "24 Hrs",
            accessor: "change",
            type: "change",
          },
          {
            header: "",
            accessor: "actions",
            type: "component",
          },
        ]}
        data={positions.map<TableData>(
          ({ assetId, price, userBalance, outcome, changePercentage }) => {
            return {
              outcome: outcome,
              userBalance: userBalance.div(ZTG).toNumber(),
              price: {
                value: price.toNumber(),
                usdValue: usdZtgPrice.toNumber(),
              },
              value: {
                value: userBalance.mul(price).div(ZTG).toNumber(),
                usdValue: usdZtgPrice.toNumber(),
              },
              change: isNaN(changePercentage) ? 0 : changePercentage.toFixed(1),
              actions: (
                <div className="text-right">
                  {IOPoolShareAssetId.is(assetId) ? (
                    <Link href={`/liquidity/${market.pool?.poolId}`}>
                      <span className="text-mariner font-semibold text-ztg-14-120">
                        View Pool
                      </span>
                    </Link>
                  ) : marketStage?.type === "Trading" &&
                    IOMarketOutcomeAssetId.is(assetId) ? (
                    <TradeButton assetId={assetId} />
                  ) : marketStage?.type === "Resolved" ? (
                    <RedeemButton
                      market={market}
                      value={userBalance.mul(price).div(ZTG)}
                    />
                  ) : IOMarketOutcomeAssetId.is(assetId) &&
                    marketStage?.type === "Reported" ? (
                    <DisputeButton market={market} assetId={assetId} />
                  ) : IOMarketOutcomeAssetId.is(assetId) &&
                    (marketStage?.type === "OpenReportingPeriod" ||
                      (marketStage?.type === "OracleReportingPeriod" &&
                        isOracle)) ? (
                    <ReportButton market={market} assetId={assetId} />
                  ) : (
                    ""
                  )}
                </div>
              ),
            };
          },
        )}
      />
      {/* <table className="table-auto w-full">
        <thead className="border-b-1 border-gray-300 ">
          <tr className="text-gray-500 ">
            <th className="py-5 pl-5 font-normal bg-gray-100 rounded-tl-md text-left">
              Outcomes
            </th>
            <th className="py-5 px-2 font-normal bg-gray-100 text-right">
              Balance
            </th>
            <th className="py-5 px-2 font-normal bg-gray-100 text-right">
              Price
            </th>
            <th className="py-5 px-2 font-normal bg-gray-100 text-right">
              Total Value
            </th>
            <th className="py-5 px-2 font-normal bg-gray-100 text-right">
              24 Hrs
            </th>
            <th className="py-5 pr-5 font-normal bg-gray-100 rounded-tr-md text-right"></th>
          </tr>
        </thead>
        <tbody className="border-b-4 border-gray-200">
          {positions.map(
            ({
              outcome,
              userBalance,
              price,
              assetId,
              changePercentage: dailyChangePercentage,
            }) => {
              return (
                <tr
                  key={outcome}
                  className="text-lg border-b-1 border-gray-200"
                >
                  <td className="py-5 pl-5 text-left max-w-sm overflow-hidden">
                    <span className="">{outcome}</span>
                  </td>
                  <td className="py-6 px-2 text-right pl-0">
                    <span className="text-blue-500">
                      {formatNumberLocalized(userBalance.div(ZTG).toNumber())}
                    </span>
                  </td>
                  <td className="py-6 px-2 text-right pl-0">
                    <div className="font-bold mb-2">
                      {formatNumberLocalized(price.toNumber())}
                    </div>
                    <div className="text-gray-400 font-light">
                      ≈ $
                      {formatNumberLocalized(usdZtgPrice.mul(price).toNumber())}
                    </div>
                  </td>
                  <td className="py-6 px-2 text-right pl-0">
                    <div className="font-bold mb-2">
                      {formatNumberLocalized(
                        userBalance.mul(price).div(ZTG).toNumber(),
                      )}
                    </div>
                    <div className="text-gray-400 font-light">
                      ≈ $
                      {formatNumberLocalized(
                        usdZtgPrice
                          .mul(userBalance.mul(price).div(ZTG))
                          .toNumber(),
                      )}
                    </div>
                  </td>
                  <td className="py-6 px-2 text-right pl-0">
                    <div
                      className={`font-bold ${
                        dailyChangePercentage === 0 ||
                        isNaN(dailyChangePercentage)
                          ? "text-gray-800"
                          : dailyChangePercentage > 0
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {dailyChangePercentage > 0 ? "+" : ""}
                      {isNaN(dailyChangePercentage)
                        ? "0"
                        : dailyChangePercentage.toFixed(1)}
                      %
                    </div>
                  </td>
                  <td className="py-5 pr-5 text-right w-64">
                    {IOPoolShareAssetId.is(assetId) ? (
                      <Link href={`/liquidity/${market.pool?.poolId}`}>
                        <span className="text-blue-600 font-bold">
                          View Pool
                        </span>
                      </Link>
                    ) : marketStage?.type === "Trading" ? (
                      <Link href={`/markets/${market.marketId}`}>
                        <span className="text-blue-600 font-bold">Trade</span>
                      </Link>
                    ) : marketStage?.type === "Resolved" ? (
                      <RedeemButton
                        market={market}
                        value={userBalance.mul(price).div(ZTG)}
                      />
                    ) : marketStage?.type === "Reported" ? (
                      <DisputeButton market={market} assetId={assetId} />
                    ) : IOMarketOutcomeAssetId.is(assetId) &&
                      (marketStage?.type === "OpenReportingPeriod" ||
                        (marketStage?.type === "OracleReportingPeriod" &&
                          isOracle)) ? (
                      <ReportButton market={market} assetId={assetId} />
                    ) : (
                      ""
                    )}
                  </td>
                </tr>
              );
            },
          )}
        </tbody>
      </table> */}
    </div>
  );
};

export const MarketPositionsSkeleton = ({
  className,
}: {
  className?: string;
}) => {
  return (
    <div className={`${className}`}>
      <Skeleton className="mb-6 center mx-auto" height={20} width="70%" />
      <Skeleton className="mb-2" height={50} width={"100%"} />
      <Skeleton className="mb-2" height={90} width={"100%"} />
      <Skeleton height={90} width={"100%"} />
    </div>
  );
};
