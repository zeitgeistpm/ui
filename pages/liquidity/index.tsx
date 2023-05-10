import { MarketStatus } from "@zeitgeistpm/indexer";
import {
  AssetId,
  IOMarketOutcomeAssetId,
  ZTG,
  getIndexOf,
  parseAssetId,
} from "@zeitgeistpm/sdk-next";
import MarketImage from "components/ui/MarketImage";
import Table, { TableColumn, TableData } from "components/ui/Table";
import Decimal from "decimal.js";
import { useInfiniteMarkets } from "lib/hooks/queries/useInfiniteMarkets";
import { useMarketStatusCount } from "lib/hooks/queries/useMarketStatusCount";
import { useTotalLiquidity } from "lib/hooks/queries/useTotalLiquidity";
import { useZtgPrice } from "lib/hooks/queries/useZtgPrice";
import { MarketsOrderBy } from "lib/types/market-filter";
import { formatNumberLocalized } from "lib/util";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { AiOutlineRead } from "react-icons/ai";

const calcLiqudity = (assets) => {
  return assets.reduce((total, asset) => {
    if (!asset.price || !asset.amountInPool) {
      return total;
    }
    const price = new Decimal(asset.price);
    return total.plus(
      new Decimal(price.div(ZTG)).mul(new Decimal(asset.amountInPool)),
    );
  }, new Decimal(0));
};

const columns: TableColumn[] = [
  {
    header: "Market Id",
    accessor: "marketId",
    type: "component",
    alignment: "text-left",
  },
  {
    header: "Composition",
    accessor: "composition",
    type: "paragraph",
  },
  {
    header: "Status",
    accessor: "status",
    type: "paragraph",
  },
  {
    header: "Liquidity",
    accessor: "poolBalance",
    type: "currency",
  },
];

const LiquidityPools: NextPage = () => {
  const router = useRouter();

  const { data: ztgPrice } = useZtgPrice();

  const {
    data: marketsPages,
    isLoading,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteMarkets(MarketsOrderBy.Newest, true, {
    status: [],
    tag: [],
    currency: [],
  });

  const markets = marketsPages?.pages.flatMap((markets) => markets.data) ?? [];
  const pools = markets?.map((market) => market.pool) || [];

  const totalLiquidity = useTotalLiquidity({ enabled: true });

  const totalLiquidityValue = useMemo(() => {
    if (ztgPrice) {
      return totalLiquidity.div(ZTG).mul(ztgPrice);
    }
    return new Decimal(0);
  }, [ztgPrice, totalLiquidity]);

  const { data: activeMarketCount } = useMarketStatusCount(MarketStatus.Active);

  const tableData = useMemo<TableData[]>(() => {
    return (
      markets?.map((market) => {
        const pool = market.pool;
        const { categories } = market;
        const poolLiquidty = calcLiqudity(pool.assets);
        return {
          poolId: pool.poolId,
          marketId: (
            <div className="flex items-center py-3">
              <div className="w-ztg-70 h-ztg-70 rounded-ztg-10 flex-shrink-0 bg-sky-600 mr-4">
                <MarketImage
                  image={market.img}
                  alt={market.description}
                  className="rounded-ztg-10"
                />
              </div>

              <div className="text-ztg-12-120 font-bold uppercase text-sky-600">
                {market.slug?.toUpperCase() || market.marketId}
              </div>
            </div>
          ),
          status: <div className="w-28">{market.status ?? "..."}</div>,
          composition: (
            <span>
              {pool.assets
                .map((asset) => {
                  const assetId = parseAssetId(asset.assetId).unwrap();
                  const assetIndex =
                    IOMarketOutcomeAssetId.is(assetId) && getIndexOf(assetId);
                  const category = categories[assetIndex];
                  const weight = pool.weights[assetIndex];
                  const percentage = Math.round(
                    new Decimal(weight.weight)
                      .dividedBy(pool.totalWeight)
                      .mul(100)
                      .toNumber(),
                  );
                  return `${percentage}% ${category.name}`;
                })
                .join(" - ") || "..."}
            </span>
          ),
          poolBalance: {
            value: poolLiquidty.toNumber(),
            usdValue: ztgPrice?.toNumber() ?? 0,
          },
        };
      }) ?? []
    );
  }, [pools]);

  const handleRowClick = (data: TableData) => {
    router.push(`/liquidity/${data.poolId}`);
  };

  return (
    <div data-testid="liquidityPage">
      <div className="mb-ztg-20 grid sm:grid-cols-3 grid-cols-2 gap-[20px]">
        <div className="px-4 py-6 bg-sky-100 rounded-ztg-10 min-h-[165px]">
          <h3 className="bg-gray-200 rounded-3xl py-1 px-3 text-sm inline-block mb-3">
            Total Value
          </h3>
          <div className="font-bold px-1 text-xl mb-2">
            {formatNumberLocalized(totalLiquidity.div(ZTG).toNumber())} ZTG
          </div>
          <div className="px-1 text-sm text-gray-600">
            ≈ {formatNumberLocalized(totalLiquidityValue.toNumber())} USD
          </div>
        </div>

        <div className="px-4 py-6 bg-sky-100 rounded-ztg-10 min-h-[165px]">
          <h3 className="bg-gray-200 rounded-3xl py-1 px-3 text-sm inline-block mb-3">
            Active Markets
          </h3>
          <div className="font-bold px-1 text-xl mb-2">
            {activeMarketCount ?? 0}
          </div>
          <div className="px-1 text-sm text-gray-600">
            Currently open markets.
          </div>
        </div>

        <a
          href={"https://docs.zeitgeist.pm/docs/learn/liquidity"}
          target="_blank"
          className="relative px-4 py-6 bg-ztg-blue rounded-ztg-10 cursor-pointer hover:scale-105 transition-all col-span-2 sm:col-span-1"
        >
          <div className="absolute top-2 right-4 text-gray-50">
            <AiOutlineRead size={22} />
          </div>
          <h3 className="bg-gray-100 rounded-3xl py-1 px-3 text-sm inline-block mb-3">
            Learn & Earn
          </h3>
          <h3 className="text-gray-100 px-1 mb-2">Liquidity Pools</h3>
          <div className="px-1 text-sm text-gray-200">
            Learn about earning ZTG by providing liquidity.
          </div>
        </a>
      </div>

      <h2 className="mb-5">Market Pools</h2>

      <Table
        data={tableData}
        columns={columns}
        onRowClick={handleRowClick}
        onLoadMore={hasNextPage ? fetchNextPage : undefined}
        loadingMore={isLoading}
        loadingNumber={10}
        hideLoadMore
        loadMoreThreshold={70}
        testId="liquidityTable"
      />
    </div>
  );
};

export default LiquidityPools;
