import { IOBaseAssetId, parseAssetId, ZTG } from "@zeitgeistpm/sdk-next";
import Table, { TableColumn, TableData } from "components/ui/Table";
import Decimal from "decimal.js";
import { useAccountPoolAssetBalances } from "lib/hooks/queries/useAccountPoolAssetBalances";
import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import { useAssetUsdPrice } from "lib/hooks/queries/useAssetUsdPrice";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useMarketSpotPrices } from "lib/hooks/queries/useMarketSpotPrices";
import { usePool } from "lib/hooks/queries/usePool";
import { usePoolBaseBalance } from "lib/hooks/queries/usePoolBaseBalance";

const poolTableColums: TableColumn[] = [
  {
    header: "Token",
    accessor: "token",
    type: "token",
  },
  {
    header: "Weights",
    accessor: "weights",
    type: "percentage",
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
  poolId: number;
  marketId: number;
}) => {
  const { data: pool } = usePool({ poolId });
  const { data: market } = useMarket({ marketId });
  const baseAssetId = parseAssetId(pool?.baseAsset).unrightOr(null);
  const { data: metadata } = useAssetMetadata(baseAssetId);

  const { data: balances } = useAccountPoolAssetBalances(pool?.accountId, pool);
  const { data: basePoolBalance } = usePoolBaseBalance(poolId);
  const { data: baseAssetUsdPrice } = useAssetUsdPrice(baseAssetId);
  const { data: spotPrices } = useMarketSpotPrices(marketId);

  const tableData: TableData[] = pool?.weights?.map((asset, index) => {
    let amount: Decimal;
    let usdValue: Decimal;
    let category: { color?: string; name?: string };
    const assetId = parseAssetId(asset.assetId).unrightOr(null);

    if (IOBaseAssetId.is(assetId)) {
      amount = basePoolBalance;
      usdValue = basePoolBalance?.mul(baseAssetUsdPrice ?? 0);
      category = { color: "#ffffff", name: metadata?.symbol };
    } else {
      amount = new Decimal(balances[index]?.free.toString() ?? 0);
      usdValue = amount
        .mul(spotPrices?.get(index) ?? 0)
        ?.mul(baseAssetUsdPrice ?? 0);
      category = market?.categories[index];
    }

    return {
      token: {
        token: true,
        color: category?.color || "#ffffff",
        label: category?.name,
      },
      weights: new Decimal(asset.weight)
        .div(pool.totalWeight)
        .mul(100)
        .toNumber(),
      poolBalance: {
        value: amount?.div(ZTG).toDecimalPlaces(2).toNumber(),
        usdValue: usdValue?.div(ZTG).toDecimalPlaces(2).toNumber(),
      },
    };
  });

  return <Table data={tableData} columns={poolTableColums} />;
};

export default PoolTable;
