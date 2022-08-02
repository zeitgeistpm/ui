import InfoBoxes from "components/ui/InfoBoxes";
import Table, { TableColumn, TableData } from "components/ui/Table";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { usePoolsListQuery } from "lib/hooks/usePoolsUrlQuery";
import { usePoolsStore } from "lib/stores/PoolsStore";
import { observer } from "mobx-react";
import hashObject from "object-hash";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useIsOnScreen } from "lib/hooks/useIsOnScreen";
import { useUserStore } from "lib/stores/UserStore";

const MarketCell = ({ text }: { text: string }) => {
  return (
    <div className="text-ztg-12-120 font-bold uppercase text-sky-600">
      {text}
    </div>
  );
};

const LiquidityPools: NextPage = observer(() => {
  const router = useRouter();
  const { graphQlEnabled } = useUserStore();

  const poolsStore = usePoolsStore();

  const [initialLoad, setInitialLoad] = useState(true);

  const query = usePoolsListQuery();
  const queryHash = hashObject(query);

  const [loadingPage, setLoadingPage] = useState(false);

  const paginatorRef = useRef<HTMLDivElement>();
  const paginatorInView = useIsOnScreen(paginatorRef);

  const tableData: TableData[] = useMemo(() => {
    if (graphQlEnabled) {
      return poolsStore.filteredPoolsInOrder.map((pool) => ({
        marketId: <MarketCell text={pool.marketSlug} />,
        poolId: pool.poolId,
        composition: pool.assets
          .map(
            (asset) =>
              `${asset.percentage}% ${
                typeof asset.category === "string"
                  ? "ztg"
                  : asset.category.ticker
              }`,
          )
          .join(" - "),
        poolBalance: {
          value: new Decimal(pool.liquidity).div(ZTG).toNumber(),
          usdValue: 0,
        },
      }));
    } else {
      return poolsStore.chainPools?.map((pool) => ({
        marketId: <MarketCell text={pool.market.slug} />,
        poolId: pool.pool.poolId,
        composition: pool.assets
          .map((asset) => `${asset.percentage}% ${asset.ticker}`)
          .join(" - "),
        poolBalance: {
          value: pool.liquidity,
          usdValue: 0,
        },
      }));
    }
  }, [poolsStore.filteredPoolsList, poolsStore.chainPools]);

  useEffect(() => {
    (async () => {
      setLoadingPage(true);
      if (initialLoad) {
        if (graphQlEnabled) {
          await poolsStore.loadFilteredPools({
            pagination: {
              page: 1,
              pageSize: query.pagination.page * query.pagination.pageSize,
            },
          });
        } else {
          await poolsStore.loadPoolsFromChain(5);
        }

        setLoadingPage(false);
        setInitialLoad(false);
      } else {
        setLoadingPage(true);
        await poolsStore.loadFilteredPools(query);
        setLoadingPage(false);
      }
    })();
  }, [queryHash]);

  useEffect(() => {
    if (
      paginatorInView &&
      !initialLoad &&
      !poolsStore.filteredPoolsListFullyLoaded &&
      graphQlEnabled
    ) {
      query.updateQuery({
        pagination: { page: query.pagination.page + 1 },
      });
    }
  }, [paginatorInView]);

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

  const handleRowClick = (data: TableData) => {
    router.push(`/liquidity/${data.poolId}`);
  };

  const handleLoadMoreFromChain = () => {
    (async () => {
      setLoadingPage(true);
      await poolsStore.loadPoolsFromChain(5);
      setLoadingPage(false);
    })();
  };

  return (
    <div>
      <InfoBoxes />
      <h2 className="header mb-ztg-23">Liquidity Pools</h2>
      <h3 className="mb-ztg-23 font-medium text-ztg-14-150">All Pools</h3>
      <Table
        data={tableData}
        columns={columns}
        onRowClick={handleRowClick}
        onLoadMore={handleLoadMoreFromChain}
        hideLoadMore={graphQlEnabled || poolsStore.allPoolsShown}
        loadingMore={loadingPage}
        loadingNumber={graphQlEnabled ? 5 : query.pagination.pageSize}
      />
      <div className="my-22 w-full h-40"></div>
      <div ref={paginatorRef} />
    </div>
  );
});

export default LiquidityPools;
