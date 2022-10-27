import { useQuery } from "@tanstack/react-query";
import { ZTG } from "@zeitgeistpm/sdk-next";
import { fetchZTGInfo } from "@zeitgeistpm/utility/dist/ztg";
import BigNumber from "bignumber.js";
import Table, { TableColumn, TableData } from "components/ui/Table";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { formatNumberLocalized } from "lib/util";
import { sortBy } from "lodash";
import { observer } from "mobx-react";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useMemo } from "react";

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
  const sdk = useSdkv2();
  const router = useRouter();

  const { data: ztgInfo } = useQuery(["ztg-price-info"], () => fetchZTGInfo(), {
    refetchInterval: 1000 * 10,
  });

  const { data: pools, isLoading: isLoadingPools } = useQuery(
    ["pools"],
    async () => {
      const pools = await sdk.model.swaps.listPools({});
      return sortBy(pools, "poolId", "desc").reverse();
    },
    {
      enabled: Boolean(sdk),
    },
  );

  const { data: assetIndex } = useQuery(
    ["pools-asset-index"],
    async () => {
      return sdk.model.swaps.assetsIndex(pools);
    },
    {
      enabled: Boolean(sdk) && Boolean(pools),
    },
  );

  const totalLiquidity = useMemo(() => {
    return Object.values(assetIndex || {}).reduce((acc, { liquidity }) => {
      return acc.plus(liquidity);
    }, new BigNumber(0));
  }, [assetIndex]);

  const totalLiquidityValue = useMemo(() => {
    if (ztgInfo) {
      return totalLiquidity.div(ZTG).multipliedBy(ztgInfo.price);
    }
    return new BigNumber(0);
  }, [ztgInfo, totalLiquidity]);

  const activeMarketCount = useMemo(() => {
    return Object.values(assetIndex || {}).reduce((count, { market }) => {
      return count + (market.status.toLowerCase() === "active" ? 1 : 0);
    }, 0);
  }, [assetIndex]);

  const tableData = useMemo<TableData[]>(() => {
    return (
      pools?.map((pool) => {
        const index = assetIndex?.[pool.poolId];
        return {
          poolId: pool.poolId,
          marketId: (
            <div className="flex items-center py-3">
              <div className="w-ztg-70 h-ztg-70 rounded-ztg-10 flex-shrink-0 bg-sky-600 mr-4">
                <div
                  className="w-ztg-70 h-ztg-70 rounded-ztg-10 flex-shrink-0"
                  style={{
                    backgroundImage:
                      index?.market.img == null
                        ? "url(/icons/default-market.png)"
                        : `url(${index.market.img})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                />
              </div>

              <div className="text-ztg-12-120 font-bold uppercase text-sky-600">
                {index?.market.slug.toUpperCase() || "..."}
              </div>
            </div>
          ),
          status: <div className="w-28">{index?.market.status ?? "..."}</div>,
          composition: (
            <span>
              {index?.assets
                .map((asset) => `${asset.percentage}% ${asset.category.ticker}`)
                .join(" - ") || "..."}
            </span>
          ),
          poolBalance: index ? (
            {
              value: index?.liquidity.div(ZTG).toNumber(),
              usdValue: ztgInfo?.price.toNumber() ?? 0,
            }
          ) : (
            <span>...</span>
          ),
        };
      }) ?? []
    );
  }, [pools, assetIndex]);

  const handleRowClick = (data: TableData) => {
    router.push(`/liquidity/${data.poolId}`);
  };

  return (
    <div>
      <div className="flex mb-ztg-20">
        <div className="px-4 py-6 bg-sky-100 dark:bg-black rounded-ztg-10 w-1/3 mr-4">
          <h3 className="bg-gray-200 dark:bg-gray-800 rounded-3xl py-1 px-3 font-bold text-sm inline-block mb-3">
            Total Value
          </h3>
          <div className="font-bold font-roboto px-1 text-xl mb-2">
            {formatNumberLocalized(totalLiquidity.div(ZTG).toNumber())} ZTG
          </div>
          <div className="font-roboto px-1 text-sm text-gray-600">
            ≈ {formatNumberLocalized(totalLiquidityValue.toNumber())} USD
          </div>
        </div>
        <div className="px-4 py-6 bg-sky-100 dark:bg-black rounded-ztg-10 w-1/3">
          <h3 className="bg-gray-200 dark:bg-gray-800 rounded-3xl py-1 px-3 font-bold text-sm inline-block mb-3">
            Active Markets
          </h3>
          <div className="font-bold font-roboto px-1 text-xl mb-2">
            {activeMarketCount}
          </div>
          <div className="font-roboto px-1 text-sm text-gray-600">
            Currently open markets.
          </div>
        </div>
      </div>

      <h2 className="mb-ztg-20 font-space text-[24px] font-semibold">
        Market Pools
      </h2>

      <Table
        data={tableData}
        columns={columns}
        onRowClick={handleRowClick}
        // onLoadMore={handleLoadMoreFromChain}
        // hideLoadMore={graphQlEnabled || poolsStore.allPoolsShown}
        loadingMore={isLoadingPools}
        loadingNumber={10}
      />
    </div>
  );
});

export default LiquidityPools;
