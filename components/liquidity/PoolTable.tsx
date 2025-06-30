import { IOBaseAssetId, parseAssetId, ZTG, isCombinatorialToken } from "@zeitgeistpm/sdk";
import Table, { TableColumn, TableData } from "components/ui/Table";
import Decimal from "decimal.js";
import {
  lookupAssetReserve,
  useAmm2Pool,
} from "lib/hooks/queries/amm2/useAmm2Pool";
import { useAccountPoolAssetBalances } from "lib/hooks/queries/useAccountPoolAssetBalances";
import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import { useAssetUsdPrice } from "lib/hooks/queries/useAssetUsdPrice";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useMarketSpotPrices } from "lib/hooks/queries/useMarketSpotPrices";
import { usePool } from "lib/hooks/queries/usePool";
import { usePoolBaseBalance } from "lib/hooks/queries/usePoolBaseBalance";
import { calcMarketColors } from "lib/util/color-calc";
import { parseAssetIdString } from "lib/util/parse-asset-id";
import { FullMarketFragment, ScoringRule } from "@zeitgeistpm/indexer";

const poolTableColums: TableColumn[] = [
  {
    header: "Token",
    accessor: "token",
    type: "token",
  },
  {
    header: "Pool Balance",
    accessor: "poolBalance",
    type: "currency",
  },
];

const PoolTable = ({
  poolId,
  marketId,
  marketData,
}: {
  poolId?: number;
  marketId: number;
  marketData?: any; // The complete pool data from combo markets
}) => {
  console.log()
  // Only fetch data if marketData is not provided
  const { data: pool } = usePool(!marketData && poolId != null ? { poolId } : undefined);
  const { data: market } = useMarket(!marketData ? { marketId } : undefined);
  
  // Use marketData if available, otherwise use fetched data
  const activeMarket = marketData || market;
  const activePool = marketData?.neoPool || pool;

  const baseAssetId = activePool?.baseAsset
    ? parseAssetId(JSON.stringify(activePool.baseAsset)).unrightOr(undefined)
    : undefined;
  const { data: metadata } = useAssetMetadata(baseAssetId);

  const { data: balances } = useAccountPoolAssetBalances(
    !marketData ? activePool?.account?.accountId : undefined,
    !marketData ? activePool : undefined,
  );
  const { data: basePoolBalance } = usePoolBaseBalance(!marketData ? poolId : undefined);
  const { data: baseAssetUsdPrice } = useAssetUsdPrice(baseAssetId);
  const { data: spotPrices } = useMarketSpotPrices(marketId);
  
  // Only fetch amm2Pool if we don't have marketData
  const { data: amm2Pool } = useAmm2Pool(
    !marketData ? (poolId ? 0 : marketId) : undefined, 
    !marketData ? (poolId ? poolId : activeMarket?.neoPool?.poolId) : undefined
  );

  // Get asset IDs from the appropriate source
  const assetIds = marketData 
    ? marketData.neoPool?.assetIds
    : activeMarket?.scoringRule === ScoringRule.Cpmm
      ? pool?.weights?.map((weight) => parseAssetIdString(weight?.assetId))
      : amm2Pool?.assetIds;

  // Get categories from marketData if available
  const categories = marketData?.categories || activeMarket?.categories;

  const tableData: TableData[] =
    assetIds?.map((assetId, index) => {
      let amount: Decimal | undefined;
      let usdValue: Decimal | undefined;
      let category = categories?.[index];

      if (IOBaseAssetId.is(assetId)) {
        // Base asset handling
        amount = basePoolBalance ?? undefined;
        usdValue = basePoolBalance?.mul(baseAssetUsdPrice ?? 0);
        category = { color: "#ffffff", name: metadata?.symbol };
      } else {
        // Outcome asset handling
        if (marketData) {
          // For marketData, distribute liquidity equally among assets as approximation
          const totalAssets = assetIds.length;
          const poolLiquidity = new Decimal(marketData.neoPool?.liquidity || 0);
          amount = poolLiquidity.div(totalAssets);
        } else {
          // Original logic for fetched data
          amount = activeMarket?.scoringRule === ScoringRule.Cpmm
            ? new Decimal(balances?.[index]?.free.toString() ?? 0)
            : lookupAssetReserve(amm2Pool?.reserves, assetId);
        }
        
        usdValue = amount
          ?.mul(spotPrices?.get(index) ?? 0)
          ?.mul(baseAssetUsdPrice ?? 0);
      }

      return {
        token: {
          token: true as const,
          color: category?.color || "#ffffff",
          label: category?.name || `Asset ${index}`,
        },
        poolBalance: {
          value: amount?.div(ZTG).toDecimalPlaces(2).toNumber() ?? 0,
          usdValue: usdValue?.div(ZTG).toDecimalPlaces(2).toNumber(),
        },
        categoryName: category?.name,
      };
    })?.filter(row => row.categoryName)?.map(({ categoryName, ...row }) => row) ?? [];

  return <Table data={tableData} columns={poolTableColums} />;
};

export default PoolTable;
