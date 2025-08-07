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
  
  // For combinatorial markets, fix the price data ordering
  const { orderedCategories, orderedSpotPrices, orderedPriceChanges } = (() => {
    const cats = categories ?? market?.categories;
    if (!cats || !market?.outcomeAssets || !spotPrices) {
      return { orderedCategories: cats, orderedSpotPrices: spotPrices, orderedPriceChanges: priceChanges };
    }
    
    const isCombinatorialMarket = market.outcomeAssets.some((asset: any) => 
      typeof asset === 'string' && asset.includes('combinatorialToken')
    );
    
    if (!isCombinatorialMarket) {
      return { orderedCategories: cats, orderedSpotPrices: spotPrices, orderedPriceChanges: priceChanges };
    }
    
    // For combinatorial markets, swap the price data to match category order
    const newSpotPrices = new Map();
    const newPriceChanges = new Map();
    
    newSpotPrices.set(0, spotPrices.get(1));
    newSpotPrices.set(1, spotPrices.get(0));
    
    if (priceChanges) {
      newPriceChanges.set(0, priceChanges.get(1));
      newPriceChanges.set(1, priceChanges.get(0));
    }
    
    return { 
      orderedCategories: cats,
      orderedSpotPrices: newSpotPrices,
      orderedPriceChanges: priceChanges ? newPriceChanges : priceChanges 
    };
  })();
  

  const totalAssetPrice = spotPrices
    ? Array.from(spotPrices.values()).reduce(
        (val, cur) => val.plus(cur),
        new Decimal(0),
      )
    : new Decimal(0);
  const tableData: TableData[] | undefined = orderedCategories?.map((category, index) => {
    const outcomeName = category?.name;
    const currentPrice = orderedSpotPrices?.get(index)?.toNumber();
    const priceChange = orderedPriceChanges?.get(index);
    const impliedPercent = currentPrice != null
      ? Math.round((currentPrice / totalAssetPrice.toNumber()) * 100)
      : null;

    console.log(tableData)
    return {
      assetId: market?.pool?.weights[index]?.assetId,
      id: index,
      outcome: outcomeName,
      totalValue: {
        value: currentPrice ?? 0,
        usdValue: new Decimal(
          currentPrice ? usdPrice?.mul(currentPrice) ?? 0 : 0,
        ).toNumber(),
      },
      pre: impliedPercent,
      change: priceChange,
    };
  });
  return <Table columns={columns} data={tableData} />;
};

export default dynamic(() => Promise.resolve(MarketAssetDetails), {
  ssr: false,
});
