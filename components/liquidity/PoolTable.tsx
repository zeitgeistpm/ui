import { IOBaseAssetId, parseAssetId, ZTG } from "@zeitgeistpm/sdk";
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
  const { data: amm2Pool, isLoading: isAmm2PoolLoading } = useAmm2Pool(
    !marketData ? marketId : activeMarket?.neoPool?.poolId ?? 0, 
    !marketData ? poolId ?? null : null,
    activeMarket,
  );    

  // Get categories from marketData if available
  const categories = marketData?.categories || activeMarket?.categories;

  // Build table data based on data source
  const tableData: TableData[] = [];
  
  if (marketData?.neoPool?.account?.balances) {
    // Use marketData balances (includes correct asset IDs and balances)
    const balances = marketData.neoPool.account.balances;
    
    // Sort the balances to match market.outcomeAssets order
    const sortedBalances = [...balances].sort((a, b) => {
      // Skip base assets (ZTG) in sorting
      if (a.assetId === "Ztg" || b.assetId === "Ztg") return 0;
      
      try {
        const aAsset = JSON.parse(a.assetId);
        const bAsset = JSON.parse(b.assetId);
        
        if (!aAsset.combinatorialToken || !bAsset.combinatorialToken) return 0;
        
        const aIndex = activeMarket?.outcomeAssets?.findIndex((marketAsset: any) => {
          if (typeof marketAsset === 'string' && marketAsset.includes(aAsset.combinatorialToken)) {
            return true;
          }
          return JSON.stringify(marketAsset).includes(aAsset.combinatorialToken);
        }) ?? -1;
        
        const bIndex = activeMarket?.outcomeAssets?.findIndex((marketAsset: any) => {
          if (typeof marketAsset === 'string' && marketAsset.includes(bAsset.combinatorialToken)) {
            return true;
          }
          return JSON.stringify(marketAsset).includes(bAsset.combinatorialToken);
        }) ?? -1;
        
        return aIndex - bIndex;
      } catch {
        return 0;
      }
    });
    
    let outcomeIndex = 0;
    
    sortedBalances.forEach((balanceEntry) => {
      // Skip base asset
      if (balanceEntry.assetId === "Ztg") return;
      
      const category = categories?.[outcomeIndex];
      if (!category?.name) {
        outcomeIndex++;
        return;
      }
      
      const amount = new Decimal(balanceEntry.balance);
      const usdValue = amount
        ?.mul(spotPrices?.get(outcomeIndex) ?? 0)
        ?.mul(baseAssetUsdPrice ?? 0);
      
      tableData.push({
        token: {
          token: true as const,
          label: category?.name,
        },
        poolBalance: {
          value: amount?.div(ZTG).toDecimalPlaces(2).toNumber() ?? 0,
          usdValue: usdValue?.div(ZTG).toDecimalPlaces(2).toNumber(),
        },
      });
      
      outcomeIndex++;
    });
  } else {
    // Fallback to original logic for non-marketData sources
    const assetIds = activeMarket?.scoringRule === ScoringRule.Cpmm
      ? pool?.weights?.map((weight) => parseAssetIdString(weight?.assetId))
      : amm2Pool?.assetIds;
      
    let outcomeIndex = 0;
    
    assetIds?.forEach((assetId, assetIndex) => {
      // Skip base assets
      if (IOBaseAssetId.is(assetId)) return;
      
      const category = categories?.[outcomeIndex];
      if (!category?.name) {
        outcomeIndex++;
        return;
      }
      
      const amount = activeMarket?.scoringRule === ScoringRule.Cpmm
        ? new Decimal(balances?.[assetIndex]?.free.toString() ?? 0)
        : lookupAssetReserve(amm2Pool?.reserves, assetId);
      
      const usdValue = amount
        ?.mul(spotPrices?.get(outcomeIndex) ?? 0)
        ?.mul(baseAssetUsdPrice ?? 0);
      
      tableData.push({
        token: {
          token: true as const,
          label: category.name,
        },
        poolBalance: {
          value: amount?.div(ZTG).toDecimalPlaces(2).toNumber() ?? 0,
          usdValue: usdValue?.div(ZTG).toDecimalPlaces(2).toNumber(),
        },
      });
      
      outcomeIndex++;
    });
  }

  return <Table data={tableData} columns={poolTableColums} />;
};

export default PoolTable;
