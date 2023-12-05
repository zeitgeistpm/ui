import Skeleton from "components/ui/Skeleton";
import {
  IndexerContext,
  IOMarketOutcomeAssetId,
  IOPoolShareAssetId,
  Market,
  ZTG,
} from "@zeitgeistpm/sdk";
import DisputeButton from "components/assets/AssetActionButtons/DisputeButton";
import RedeemButton from "components/assets/AssetActionButtons/RedeemButton";
import ReportButton from "components/assets/AssetActionButtons/ReportButton";
import AssetTradingButtons from "components/assets/AssetActionButtons/AssetTradingButtons";
import Table, { TableData, TableColumn } from "components/ui/Table";
import Decimal from "decimal.js";
import { useMarketStage } from "lib/hooks/queries/useMarketStage";
import { Position } from "lib/hooks/queries/usePortfolioPositions";
import { useWallet } from "lib/state/wallet";
import MarketPositionHeader from "./MarketPositionHeader";
import { useAllForeignAssetUsdPrices } from "lib/hooks/queries/useAssetUsdPrice";
import { lookUpAssetPrice } from "lib/util/lookup-price";
import { MIN_USD_DISPLAY_AMOUNT } from "lib/constants";
import PoolShareButtons from "components/assets/AssetActionButtons/PoolShareButtons";

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
  const isOracle = market?.oracle === wallet.realAddress;

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
        .mul(baseAssetUsdPrice ?? 0)
        .div(ZTG)
        .toNumber() >= MIN_USD_DISPLAY_AMOUNT
    );
  };

  if (positions.some(displayBalance)) {
    return (
      <div className={`${className}`}>
        <MarketPositionHeader
          marketId={market.marketId}
          question={market.question ?? undefined}
        />
        <Table
          showHighlight={false}
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
                    usdValue: price.mul(baseAssetUsdPrice ?? 0).toNumber(),
                  },
                  cost: {
                    value: avgCost,
                    usdValue: new Decimal(avgCost)
                      .mul(baseAssetUsdPrice ?? 0)
                      .toNumber(),
                  },
                  upnl: {
                    value: upnl,
                    usdValue: new Decimal(upnl)
                      .mul(baseAssetUsdPrice ?? 0)
                      .toNumber(),
                  },
                  rpnl: {
                    value: rpnl,
                    usdValue: new Decimal(rpnl)
                      .mul(baseAssetUsdPrice ?? 0)
                      .toNumber(),
                  },
                  value: {
                    value: userBalance.mul(price).div(ZTG).toNumber(),
                    usdValue: userBalance
                      .mul(price)
                      .mul(baseAssetUsdPrice ?? 0)
                      .div(ZTG)
                      .toNumber(),
                  },
                  change: isNaN(changePercentage)
                    ? 0
                    : changePercentage.toFixed(1),
                  actions: (
                    <div className="text-right">
                      {IOPoolShareAssetId.is(assetId) ? (
                        <PoolShareButtons
                          poolId={assetId.PoolShare}
                          market={market}
                        />
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
      </div>
    );
  }

  return <></>;
};

export const MarketPositionsSkeleton = ({
  className,
}: {
  className?: string;
}) => {
  return (
    <div className={`${className}`}>
      <Skeleton className="mb-6" height={20} width="70%" />
      <Skeleton className="mb-2" height={50} width={"100%"} />
      <Skeleton className="mb-2" height={90} width={"100%"} />
      <Skeleton height={90} width={"100%"} />
    </div>
  );
};
