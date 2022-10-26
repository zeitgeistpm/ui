import { TableCell } from "@material-ui/core";
import { useQuery } from "@tanstack/react-query";
import { ZTG } from "@zeitgeistpm/sdk-next";
import Table, { TableColumn, TableData } from "components/ui/Table";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { sortBy } from "lodash";
import { observer } from "mobx-react";
import { NextPage } from "next";
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
    header: "Liquidity",
    accessor: "poolBalance",
    type: "currency",
  },
];

const LiquidityPools: NextPage = observer(() => {
  const sdk = useSdkv2();

  const pools = useQuery(
    ["pools"],
    async () => {
      const pools = await sdk.model.swaps.listPools({});
      return sortBy(pools, "poolId", "desc").reverse();
    },
    {
      enabled: Boolean(sdk),
    },
  );

  const assetIndex = useQuery(
    ["pools-asset-index"],
    async () => {
      return sdk.model.swaps.assetsIndex(pools.data);
    },
    {
      enabled: Boolean(sdk) && Boolean(pools.data),
    },
  );

  const tableData = useMemo<TableData[]>(() => {
    return (
      pools.data?.map((pool) => {
        const index = assetIndex.data?.[pool.poolId];
        return {
          marketId: <span>{index?.market.slug || "..."}</span>,
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
              usdValue: 0,
            }
          ) : (
            <span>...</span>
          ),
        };
      }) ?? []
    );
  }, [pools.data, assetIndex.data]);

  return (
    <div>
      <Table
        data={tableData}
        columns={columns}
        // onRowClick={handleRowClick}
        // onLoadMore={handleLoadMoreFromChain}
        // hideLoadMore={graphQlEnabled || poolsStore.allPoolsShown}
        // loadingMore={loadingPage}
        // loadingNumber={graphQlEnabled ? 5 : query.pagination.pageSize}
      />
    </div>
  );
});

export default LiquidityPools;
