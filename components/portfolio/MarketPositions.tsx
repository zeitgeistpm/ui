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
import AssetTradingButtons from "components/assets/AssetActionButtons/AssetTradingButtons";
import Table, { TableData, TableColumn } from "components/ui/Table";
import Decimal from "decimal.js";
import { useMarketStage } from "lib/hooks/queries/useMarketStage";
import { Position } from "lib/hooks/queries/usePortfolioPositions";
import { useWallet } from "lib/state/wallet";
import Link from "next/link";
import MarketPositionHeader from "./MarketPositionHeader";
import { useAllForeignAssetUsdPrices } from "lib/hooks/queries/useAssetUsdPrice";
import { lookUpAssetPrice } from "lib/util/lookup-price";
import { MIN_USD_DISPLAY_AMOUNT } from "lib/constants";

const COLUMNS: TableColumn[] = [
  {
    header: "Outcomes",
    accessor: "outcome",
    type: "text",
    infobox:
      "These are the results you've purchased in the prediction market. Each different outcome is linked to a unique asset in your portfolio.",
  },
  {
    header: "Balance",
    accessor: "userBalance",
    type: "number",
    infobox:
      "This is the amount of each asset you currently hold in your portfolio. It's equivalent to the number of shares you have for a specific outcome in a prediction market.",
  },
  {
    header: "Price",
    accessor: "price",
    type: "currency",
    infobox:
      "This is the current going rate for the asset in the market. This price can fluctuate depending on how other users are buying and selling the asset.",
  },
  {
    header: "Avg. Cost",
    accessor: "cost",
    type: "currency",
    infobox:
      "This is the average price you've paid for each asset in your portfolio. If you bought an asset multiple times at different prices, this number takes all those transactions into account.",
  },
  {
    header: "Total Value",
    accessor: "value",
    type: "currency",
    infobox:
      "This is the current worth of your holdings for a specific asset. It's calculated by multiplying the amount of the asset you own (your balance) by the asset's current market price.",
  },
  {
    header: "Unrealized PnL",
    accessor: "upnl",
    type: "currency",
    infobox:
      "This is the profit or loss you would make if you were to sell your assets at the current market price. It's the difference between the current market price and the average cost of your assets, multiplied by the amount of the asset you own. Note: this amount doesn't reflect slippage or trading fees.",
  },
  {
    header: "Realized PnL",
    accessor: "rpnl",
    type: "currency",
    infobox:
      "This is the actual profit or loss you've made from selling assets in your portfolio. It's the difference between the price you sold your assets at and the average cost of those assets, multiplied by the quantity of the asset that you sold.",
  },
  {
    header: "24 Hrs",
    accessor: "change",
    type: "change",
    infobox:
      "This shows how much the price of each asset in your portfolio has changed in the last 24 hours. It's a quick way to track the recent performance of your assets and gauge short-term market trends.",
  },
  {
    header: "",
    accessor: "actions",
    type: "component",
    infobox: "",
  },
];

const COLUMNS_LIQUIDITY: TableColumn[] = [
  {
    header: "Outcomes",
    accessor: "outcome",
    type: "text",
    infobox:
      "These are the results you've purchased in the prediction market. Each different outcome is linked to a unique asset in your portfolio.",
  },
  {
    header: "Balance",
    accessor: "userBalance",
    type: "number",
    infobox:
      "This is the amount of each asset you currently hold in your portfolio. It's equivalent to the number of shares you have for a specific outcome in a prediction market.",
  },
  {
    header: "Price",
    accessor: "price",
    type: "currency",
    infobox:
      "This is the current going rate for the asset in the market. This price can fluctuate depending on how other users are buying and selling the asset.",
  },
  {
    header: "Total Value",
    accessor: "value",
    type: "currency",
    infobox:
      "This is the current worth of your holdings for a specific asset. It's calculated by multiplying the amount of the asset you own (your balance) by the asset's current market price.",
  },
  {
    header: "24 Hrs",
    accessor: "change",
    type: "change",
    infobox:
      "This shows how much the price of each asset in your portfolio has changed in the last 24 hours. It's a quick way to track the recent performance of your assets and gauge short-term market trends.",
  },
  {
    header: "",
    accessor: "actions",
    type: "component",
    infobox: "",
  },
];

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
  const { data: foreignAssetPrices } = useAllForeignAssetUsdPrices();

  const wallet = useWallet();
  const userAddress = wallet.getActiveSigner()?.address;
  const isOracle = market?.oracle === userAddress;

  const isLiquidityMarket = positions.some(
    (pos) => pos.outcome == "Pool Share",
  );

  //display balance if any of the positions is greater than 0.01 USD
  const displayBalance = (pos) => {
    const baseAssetUsdPrice = lookUpAssetPrice(
      pos.market.baseAsset,
      foreignAssetPrices,
      usdZtgPrice,
    );
    return (
      pos.userBalance
        .mul(pos.price)
        .mul(baseAssetUsdPrice)
        .div(ZTG)
        .toNumber() >= MIN_USD_DISPLAY_AMOUNT
    );
  };

  if (positions.some(displayBalance)) {
    return (
      <div className={`${className}`}>
        <MarketPositionHeader
          marketId={market.marketId}
          question={market.question}
        />
        <Table
          columns={isLiquidityMarket ? COLUMNS_LIQUIDITY : COLUMNS}
          data={positions
            .filter((pos) => displayBalance(pos))
            .map<TableData>(
              ({
                assetId,
                price,
                userBalance,
                outcome,
                changePercentage,
                market,
                avgCost,
                rpnl,
                upnl,
              }) => {
                const baseAssetUsdPrice = lookUpAssetPrice(
                  market.baseAsset,
                  foreignAssetPrices,
                  usdZtgPrice,
                );
                return {
                  outcome: outcome,
                  userBalance: userBalance.div(ZTG).toNumber(),
                  price: {
                    value: price.toNumber(),
                    usdValue: price.mul(baseAssetUsdPrice).toNumber(),
                  },
                  cost: {
                    value: avgCost,
                    usdValue: new Decimal(avgCost)
                      .mul(baseAssetUsdPrice)
                      .toNumber(),
                  },
                  upnl: {
                    value: upnl,
                    usdValue: new Decimal(upnl)
                      .mul(baseAssetUsdPrice)
                      .toNumber(),
                  },
                  rpnl: {
                    value: rpnl,
                    usdValue: new Decimal(rpnl)
                      .mul(baseAssetUsdPrice)
                      .toNumber(),
                  },
                  value: {
                    value: userBalance.mul(price).div(ZTG).toNumber(),
                    usdValue: userBalance
                      .mul(price)
                      .mul(baseAssetUsdPrice)
                      .div(ZTG)
                      .toNumber(),
                  },
                  change: isNaN(changePercentage)
                    ? 0
                    : changePercentage.toFixed(1),
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
                        <AssetTradingButtons assetId={assetId} />
                      ) : marketStage?.type === "Resolved" ? (
                        <RedeemButton market={market} assetId={assetId} />
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
  } else {
    <></>;
  }
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
