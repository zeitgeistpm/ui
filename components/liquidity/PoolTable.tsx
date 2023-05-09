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
import ManageLiquidityButton from "./ManageLiquidityButton";
import { Unpacked } from "@zeitgeistpm/utility/dist/array";
import { useMemo } from "react";

const tokenColumn = {
  header: "Token",
  accessor: "token" as const,
  type: "token",
} satisfies TableColumn;

const weightsColumn = {
  header: "Weights",
  accessor: "weights" as const,
  type: "percentage",
} satisfies TableColumn;

const poolColumn = {
  header: "Pool Balance",
  accessor: "poolBalance" as const,
  type: "currency",
} satisfies TableColumn;

const manageColumn = {
  header: "",
  accessor: "manage" as const,
  type: "component",
  width: "140px",
} satisfies TableColumn;

const poolTableColums = [tokenColumn, weightsColumn, poolColumn, manageColumn];

export type Accessors = Unpacked<typeof poolTableColums>["accessor"];

const PoolTable = ({
  poolId,
  marketId,
  blacklistFields
}: {
  poolId: number;
  marketId: number;
  blacklistFields?: Accessors[];
}) => {
  const { data: pool } = usePool({ poolId });
  const { data: market } = useMarket({ marketId });
  const baseAssetId = parseAssetId(pool?.baseAsset).unrightOr(null);
  const { data: metadata } = useAssetMetadata(baseAssetId);

  const { data: balances } = useAccountPoolAssetBalances(pool?.accountId, pool);
  const { data: basePoolBalance } = usePoolBaseBalance(poolId);
  const { data: baseAssetUsdPrice } = useAssetUsdPrice(baseAssetId);
  const { data: spotPrices } = useMarketSpotPrices(marketId);

  const columns = useMemo(() => {
    return poolTableColums.filter(
      (column) => !blacklistFields?.includes(column.accessor)
    );
  }, [blacklistFields])

  const tableData: TableData[] = pool?.weights?.map((asset, index) => {
    let amount: Decimal;
    let usdValue: Decimal;
    let category;
    const assetId = parseAssetId(asset.assetId).unrightOr(null);

    if (IOBaseAssetId.is(assetId)) {
      amount = basePoolBalance;
      usdValue = basePoolBalance?.mul(baseAssetUsdPrice ?? 0);
      category = { color: "#ffffff", ticker: metadata?.symbol };
    } else {
      amount = new Decimal(balances[index]?.free.toString() ?? 0);
      usdValue = amount
        .mul(spotPrices?.get(index) ?? 0)
        ?.mul(baseAssetUsdPrice ?? 0);
      category = market?.categories[index];
    }

    return {
      token: {
        color: category?.color || "#ffffff",
        label: category?.ticker,
      },
      weights: new Decimal(asset.weight)
        .div(pool.totalWeight)
        .mul(100)
        .toNumber(),
      poolBalance: {
        value: amount?.div(ZTG).toDecimalPlaces(2).toNumber(),
        usdValue: usdValue?.div(ZTG).toDecimalPlaces(2).toNumber(),
      },
      manage: <ManageLiquidityButton poolId={poolId} />,
    };
  });

  return <Table data={tableData} columns={columns} />;
};

export default PoolTable;
