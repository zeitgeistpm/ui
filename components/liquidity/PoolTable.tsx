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
import { ScoringRule } from "@zeitgeistpm/indexer";

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
}: {
  poolId?: number;
  marketId: number;
}) => {
  const { data: pool } = usePool(poolId != null ? { poolId } : undefined);
  const { data: market } = useMarket({ marketId });
  const baseAssetId = pool?.baseAsset
    ? parseAssetId(pool.baseAsset).unrightOr(undefined)
    : undefined;
  const { data: metadata } = useAssetMetadata(baseAssetId);

  const { data: balances } = useAccountPoolAssetBalances(
    pool?.account.accountId,
    pool,
  );
  const { data: basePoolBalance } = usePoolBaseBalance(poolId);
  const { data: baseAssetUsdPrice } = useAssetUsdPrice(baseAssetId);
  const { data: spotPrices } = useMarketSpotPrices(marketId);
  const { data: amm2Pool } = useAmm2Pool(marketId);

  const colors = market?.categories
    ? calcMarketColors(marketId, market.categories.length)
    : [];

  const assetIds =
    market?.scoringRule === ScoringRule.Cpmm
      ? pool?.weights?.map((weight) => parseAssetIdString(weight?.assetId))
      : amm2Pool?.assetIds;

  const tableData: TableData[] =
    assetIds?.map((assetId, index) => {
      let amount: Decimal | undefined;
      let usdValue: Decimal | undefined;
      let category:
        | { color?: string | null; name?: string | null }
        | undefined
        | null;

      if (IOBaseAssetId.is(assetId)) {
        amount = basePoolBalance ?? undefined;
        usdValue = basePoolBalance?.mul(baseAssetUsdPrice ?? 0);
        category = { color: "#ffffff", name: metadata?.symbol };
      } else {
        amount =
          market?.scoringRule === ScoringRule.Cpmm
            ? new Decimal(balances?.[index]?.free.toString() ?? 0)
            : lookupAssetReserve(amm2Pool?.reserves, assetId);
        usdValue = amount
          ?.mul(spotPrices?.get(index) ?? 0)
          ?.mul(baseAssetUsdPrice ?? 0);
        category = market?.categories?.[index];
      }

      return {
        token: {
          token: true,
          color: colors[index] || "#ffffff",
          label: category?.name ?? "",
        },
        poolBalance: {
          value: amount?.div(ZTG).toDecimalPlaces(2).toNumber() ?? 0,
          usdValue: usdValue?.div(ZTG).toDecimalPlaces(2).toNumber(),
        },
      };
    }) ?? [];

  return <Table data={tableData} columns={poolTableColums} />;
};

export default PoolTable;
