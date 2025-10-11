import { Tab } from "@headlessui/react";
import SubTabsList from "components/ui/SubTabsList";
import { useAccountAmm2Pool } from "lib/hooks/queries/useAccountAmm2Pools";
import { useQueryParamState } from "lib/hooks/useQueryParamState";
import { useMemo } from "react";
import AccountPoolsTable from "./AccountPoolsTable";
import EmptyPortfolio from "./EmptyPortfolio";

type CreatedMarketsSubTab = "Markets" | "Multi-Markets";

const createdMarketsSubTabs: CreatedMarketsSubTab[] = [
  "Markets",
  "Multi-Markets",
];

export const CreatedMarketsTabGroup = ({ address }: { address: string }) => {
  const [createdMarketsTabSelection, setCreatedMarketsTabSelection] =
    useQueryParamState<CreatedMarketsSubTab>("createdMarketsTab");

  const { data: pools, isLoading } = useAccountAmm2Pool(address);

  // Split pools into regular markets and multi-markets
  const { regularMarketPools, multiMarketPools } = useMemo(() => {
    if (!pools) {
      return { regularMarketPools: null, multiMarketPools: null };
    }

    const regular: typeof pools = [];
    const multi: typeof pools = [];

    pools.forEach((pool) => {
      // Check if this is a multi-market pool
      // Multi-markets have isMultiMarket flag and marketIds with > 1 market
      if (pool.isMultiMarket && pool.marketIds && pool.marketIds.length > 1) {
        multi.push(pool);
      } else {
        // Regular markets include single-market pools
        regular.push(pool);
      }
    });

    return { regularMarketPools: regular, multiMarketPools: multi };
  }, [pools]);

  return (
    <Tab.Group
      defaultIndex={0}
      selectedIndex={
        createdMarketsTabSelection &&
        createdMarketsSubTabs.indexOf(createdMarketsTabSelection)
      }
      onChange={(index) =>
        setCreatedMarketsTabSelection(createdMarketsSubTabs[index])
      }
    >
      <div className="overflow-auto">
        <SubTabsList titles={createdMarketsSubTabs} />
      </div>

      <Tab.Panels>
        {/* Regular Markets Tab */}
        <Tab.Panel>
          {regularMarketPools &&
          regularMarketPools.length === 0 &&
          !isLoading ? (
            <EmptyPortfolio
              headerText="You don't have any market liquidity"
              bodyText="Create markets or provide liquidity to existing markets"
              buttonText="View Markets"
              buttonLink="/markets"
            />
          ) : (
            <AccountPoolsTable
              pools={regularMarketPools}
              isLoading={isLoading}
            />
          )}
        </Tab.Panel>

        {/* Multi-Markets Tab */}
        <Tab.Panel>
          {multiMarketPools && multiMarketPools.length === 0 && !isLoading ? (
            <EmptyPortfolio
              headerText="You don't have any multi-market liquidity"
              bodyText="Create multi-markets or provide liquidity to existing multi-markets"
              buttonText="View Multi-Markets"
              buttonLink="/markets?marketType=multi"
            />
          ) : (
            <AccountPoolsTable pools={multiMarketPools} isLoading={isLoading} />
          )}
        </Tab.Panel>
      </Tab.Panels>
    </Tab.Group>
  );
};
