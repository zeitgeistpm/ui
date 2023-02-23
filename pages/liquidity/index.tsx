import { ZTG } from "@zeitgeistpm/sdk-next";
import Table, { TableColumn, TableData } from "components/ui/Table";
import Decimal from "decimal.js";
import { useInfinitePoolsList } from "lib/hooks/queries/useInfinitePoolsList";
import { useMarketStatusCount } from "lib/hooks/queries/useMarketStatusCount";
import { useSaturatedPoolsIndex } from "lib/hooks/queries/useSaturatedPoolsIndex";
import { useTotalLiquidity } from "lib/hooks/queries/useTotalLiquidity";
import { useZtgInfo } from "lib/hooks/queries/useZtgInfo";
import { formatNumberLocalized } from "lib/util";
import { observer } from "mobx-react";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useMemo } from "react";
import { AiOutlineRead } from "react-icons/ai";
import { MarketStatus } from "@zeitgeistpm/indexer";

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

const LiquidityPools: NextPage = observer(() => {
  const router = useRouter();

  const { data: ztgInfo } = useZtgInfo();

  const {
    data: poolPages,
    isLoading: isLoadingPools,
    hasNextPage,
    fetchNextPage,
  } = useInfinitePoolsList();

  const pools = poolPages?.pages.flatMap((pools) => pools.data) || [];

  const { data: saturatedIndex, isFetched } = useSaturatedPoolsIndex(pools);

  const totalLiquidity = useTotalLiquidity({ enabled: isFetched });

  const totalLiquidityValue = useMemo(() => {
    if (ztgInfo) {
      return totalLiquidity.div(ZTG).mul(ztgInfo.price);
    }
    return new Decimal(0);
  }, [ztgInfo, totalLiquidity]);

  const { data: activeMarketCount } = useMarketStatusCount(MarketStatus.Active);

  const tableData = useMemo<TableData[]>(() => {
    return (
      pools?.map((pool) => {
        const saturatedData = saturatedIndex?.[pool.poolId];
        return {
          poolId: pool.poolId,
          marketId: (
            <div className="flex items-center py-3">
              <div className="w-ztg-70 h-ztg-70 rounded-ztg-10 flex-shrink-0 bg-sky-600 mr-4">
                <div
                  className="w-ztg-70 h-ztg-70 rounded-ztg-10 flex-shrink-0"
                  style={{
                    backgroundImage:
                      saturatedData?.market.img == null
                        ? "url(/icons/default-market.png)"
                        : `url(${saturatedData.market.img})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              </div>

              <div className="text-ztg-12-120 font-bold uppercase text-sky-600">
                {saturatedData?.market.slug?.toUpperCase() ||
                  saturatedData?.market.marketId}
              </div>
            </div>
          ),
          status: (
            <div className="w-28">{saturatedData?.market.status ?? "..."}</div>
          ),
          composition: (
            <span>
              {saturatedData?.assets
                .map((asset) => `${asset.percentage}% ${asset.category.ticker}`)
                .join(" - ") || "..."}
            </span>
          ),
          poolBalance: saturatedData ? (
            {
              value: saturatedData?.liquidity.div(ZTG).toNumber(),
              usdValue: ztgInfo?.price.toNumber() ?? 0,
            }
          ) : (
            <span>...</span>
          ),
        };
      }) ?? []
    );
  }, [pools, saturatedIndex]);

  const handleRowClick = (data: TableData) => {
    router.push(`/liquidity/${data.poolId}`);
  };

  return (
    <div data-testid="liquidityPage">
      <div className="flex mb-ztg-20">
        <div className="px-4 py-6 bg-sky-100 dark:bg-black rounded-ztg-10 w-1/3 mr-4">
          <h3 className="bg-gray-200 dark:bg-gray-800 rounded-3xl py-1 px-3 font-bold text-sm inline-block mb-3">
            Total Value
          </h3>
          <div className="font-bold font-mono px-1 text-xl mb-2">
            {formatNumberLocalized(totalLiquidity.div(ZTG).toNumber())} ZTG
          </div>
          <div className="font-mono px-1 text-sm text-gray-600">
            ≈ {formatNumberLocalized(totalLiquidityValue.toNumber())} USD
          </div>
        </div>

        <div className="px-4 py-6 bg-sky-100 dark:bg-black rounded-ztg-10 w-1/3 mr-4">
          <h3 className="bg-gray-200 dark:bg-gray-800 rounded-3xl py-1 px-3 font-bold text-sm inline-block mb-3">
            Active Markets
          </h3>
          <div className="font-bold font-mono px-1 text-xl mb-2">
            {activeMarketCount ?? 0}
          </div>
          <div className="font-mono px-1 text-sm text-gray-600">
            Currently open markets.
          </div>
        </div>

        <a
          href={"https://docs.zeitgeist.pm/docs/learn/liquidity"}
          target="_blank"
          className="relative px-4 py-6 bg-ztg-blue rounded-ztg-10 w-1/3 cursor-pointer hover:scale-105 transition-all"
        >
          <div className="absolute top-2 right-4 text-gray-50">
            <AiOutlineRead size={22} />
          </div>
          <h3 className="bg-gray-100 dark:bg-gray-800 rounded-3xl py-1 px-3 font-bold text-sm inline-block mb-3">
            Learn & Earn
          </h3>
          <div className="font-bold text-gray-100 font-mono px-1 text-xl mb-2">
            Liquidity Pools
          </div>
          <div className="font-mono px-1 text-sm text-gray-200">
            Learn about earning ZTG by providing liquidity.
          </div>
        </a>
      </div>

      <h2 className="mb-ztg-20  text-[24px] font-semibold">Market Pools</h2>

      <Table
        data={tableData}
        columns={columns}
        onRowClick={handleRowClick}
        onLoadMore={hasNextPage ? fetchNextPage : undefined}
        loadingMore={isLoadingPools}
        loadingNumber={10}
        hideLoadMore
        loadMoreThreshold={70}
        testId="liquidityTable"
      />
    </div>
  );
});

export default LiquidityPools;
