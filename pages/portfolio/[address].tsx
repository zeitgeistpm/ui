import { Tab } from "@headlessui/react";
import { getMarketIdOf } from "@zeitgeistpm/sdk-next";
import { PortfolioBreakdown } from "components/portfolio/Breakdown";
import InfoBoxes from "components/ui/InfoBoxes";
import { filters, TimeFilter } from "components/ui/TimeFilters";
import Decimal from "decimal.js";
import { DAY_SECONDS } from "lib/constants";
import { useAccountBalanceHistory } from "lib/hooks/queries/useAccountBalanceHistory";
import { useAccountTokenPositions } from "lib/hooks/queries/useAccountTokenPositions";
import { useAssetsPriceHistory } from "lib/hooks/queries/useAssetsPriceHistory";
import { useChainTimeNow } from "lib/hooks/queries/useChainTime";
import { usePoolsByIds } from "lib/hooks/queries/usePoolsByIds";
import { useSaturatedPoolsIndex } from "lib/hooks/queries/useSaturatedPoolsIndex";
import { useStore } from "lib/stores/Store";
import { observer } from "mobx-react";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useState } from "react";

const Portfolio: NextPage = observer(() => {
  const store = useStore();
  const router = useRouter();
  const address = Array.isArray(router.query.address)
    ? router.query.address[0]
    : router.query.address;

  const [timeFilter, setTimeFilter] = useState<TimeFilter>(
    filters.find((f) => f.label === "All"),
  );

  const { data: now } = useChainTimeNow();

  const balanceHistory = useAccountBalanceHistory(address, timeFilter);
  const accountTokenPositions = useAccountTokenPositions(address);

  const pools = usePoolsByIds(
    accountTokenPositions.data?.map(({ asset }) => ({
      marketId: getMarketIdOf(asset),
    })),
  );

  const saturatedPoolsIndex = useSaturatedPoolsIndex(pools?.data);

  const assetPricesHistoryLookup = useAssetsPriceHistory(
    accountTokenPositions.data?.map(({ asset }) => asset),
    {
      startTimeStamp: dateOneWeekAgo,
    },
  );

  /**
   * for trading positions and subsidy
   *  lookup accountBalances, filter by accountId
   *  group by assetId is subsidy or trading related clientside
   *    for trading and subsidy respectively
   *      get assetId
   *      fetch price and ballance from rpc
   */

  const breakdown = {
    usdZtgPrice: new Decimal(0.1),
    total: {
      value: new Decimal(1238147473712737),
      changePercentage: 12,
    },
    tradingPositions: {
      value: new Decimal(489384787458),
      changePercentage: -32,
    },
    subsidy: {
      value: new Decimal(9459388294948958),
      changePercentage: 12,
    },
    bonded: {
      value: new Decimal(234422344),
      changePercentage: 30,
    },
  };

  return (
    <>
      <InfoBoxes />

      <h2 className="header text-xs font-bold mb-8">Portfolio</h2>

      <div className="mb-12">
        <h3 className="font-bold text-xl mb-4">Breakdown</h3>
        <PortfolioBreakdown {...breakdown} />
      </div>

      <div>
        <h3 className="text-3xl mb-6 text-center">Predictions</h3>
        <Tab.Group>
          <Tab.List className="flex center">
            <Tab className="text-lg px-4 ui-selected:font-bold ui-selected:text-gray-800 text-gray-500">
              By Markets
            </Tab>
            <Tab className="text-lg px-4 ui-selected:font-bold ui-selected:text-gray-800 text-gray-500">
              Subsidy
            </Tab>
          </Tab.List>
          <Tab.Panels>
            <Tab.Panel>Content 1</Tab.Panel>
            <Tab.Panel>Content 3</Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>

      {/* <div className="-ml-ztg-22 mb-ztg-30">
            <div className="flex justify-end -mt-ztg-30">
              <TimeFilters value={timeFilter} onClick={handleTimeFilterClick} />
            </div>
            <TimeSeriesChart
              data={chartData}
              series={[{ accessor: "v", label: "Price" }]}
              yUnits={store.config.tokenSymbol}
            />
          </div>
          <RedeemAllButton
            marketStores={positions.map((p) => p.marketStore)}
            onSuccess={() => incrementUpdateNum()}
          />
          <div className="mb-ztg-50  ">
            {positions.map((position, index) => (
              <PortfolioCard key={index} position={position} />
            ))}
          </div> */}
    </>
  );
});

const dateOneWeekAgo = new Date(
  new Date().getTime() - DAY_SECONDS * 28 * 1000,
).toISOString();

export default Portfolio;
