import {
  AssetId,
  CategoricalAssetId,
  MarketOutcomeAssetId,
  ScalarAssetId,
} from "@zeitgeistpm/sdk";
import AssetActionButtons from "components/assets/AssetActionButtons";
import Table, { TableColumn, TableData } from "components/ui/Table";
import Decimal from "decimal.js";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useMarket24hrPriceChanges } from "lib/hooks/queries/useMarket24hrPriceChanges";
import { useMarketSpotPrices } from "lib/hooks/queries/useMarketSpotPrices";

import { useAssetUsdPrice } from "lib/hooks/queries/useAssetUsdPrice";
import { parseAssetIdString } from "lib/util/parse-asset-id";
import dynamic from "next/dynamic";

const columns: TableColumn[] = [
  { header: "Outcome", accessor: "outcome", type: "text" },
  {
    header: "Implied %",
    accessor: "pre",
    type: "percentage",
    collapseOrder: 1,
  },
  { header: "Price", accessor: "totalValue", type: "currency" },
  {
    header: "24Hr Change",
    accessor: "change",
    type: "change",
    width: "120px",
    collapseOrder: 2,
  },
];

const MarketAssetDetails = ({
  marketId,
  categories,
}: {
  marketId: number;
  categories?: {
    name: string;
  }[];
}) => {
  const { data: market } = useMarket({ marketId });
  const baseAsset = parseAssetIdString(market?.baseAsset);
  const { data: usdPrice } = useAssetUsdPrice(baseAsset);

  const { data: spotPrices } = useMarketSpotPrices(marketId);
  const { data: priceChanges } = useMarket24hrPriceChanges(marketId);

  const totalAssetPrice = spotPrices
    ? Array.from(spotPrices.values()).reduce(
        (val, cur) => val.plus(cur),
        new Decimal(0),
      )
    : new Decimal(0);

  const tableData: TableData[] | undefined = (
    categories ?? market?.assets
  )?.map((asset, index) => {
    const outcomeName = asset.name;
    //todo: lookup without index
    const currentPrice = spotPrices?.get(index)?.toNumber();
    const priceChange = priceChanges?.get(index);

    return {
      assetId: asset.assetId,
      id: index,
      outcome: outcomeName,
      totalValue: {
        value: currentPrice ?? 0,
        usdValue: new Decimal(
          currentPrice ? usdPrice?.mul(currentPrice) ?? 0 : 0,
        ).toNumber(),
      },
      pre:
        currentPrice != null
          ? Math.round((currentPrice / totalAssetPrice.toNumber()) * 100)
          : null,
      change: priceChange,
    };
  });

  return <Table columns={columns} data={tableData} />;
};

export default dynamic(() => Promise.resolve(MarketAssetDetails), {
  ssr: false,
});
