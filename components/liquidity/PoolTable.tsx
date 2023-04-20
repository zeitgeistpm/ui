import { ZTG } from "@zeitgeistpm/sdk-next";
import Table, { TableColumn, TableData } from "components/ui/Table";
import Decimal from "decimal.js";
import { useAccountPoolAssetBalances } from "lib/hooks/queries/useAccountPoolAssetBalances";
import { useAssetUsdPrice } from "lib/hooks/queries/useAssetUsdPrice";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useMarketSpotPrices } from "lib/hooks/queries/useMarketSpotPrices";
import { usePool } from "lib/hooks/queries/usePool";
import { usePoolBaseBalance } from "lib/hooks/queries/usePoolBaseBalance";
import { useSaturatedPoolsIndex } from "lib/hooks/queries/useSaturatedPoolsIndex";
import ManageLiquidityButton from "./ManageLiquidityButton";

const columns: TableColumn[] = [
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
  {
    header: "",
    accessor: "manage",
    type: "component",
    width: "140px",
  },
];

const PoolTable = ({ poolId }: { poolId: number }) => {
  const { data: pool } = usePool({ poolId });
  const { data: market } = useMarket({ poolId });
  const { data: saturatedPoolIndex } = useSaturatedPoolsIndex(
    pool ? [pool] : undefined,
  );
  const saturatedPoolData = saturatedPoolIndex?.[poolId];

  const { data: balances } = useAccountPoolAssetBalances(pool?.accountId, pool);
  const { data: basePoolBalance } = usePoolBaseBalance(poolId);
  // const { data: baseAssetUsdPrice } = useAssetUsdPrice({ ForeignAsset: 0 });
  //todo: remove hardcoding
  const { data: baseAssetUsdPrice } = useAssetUsdPrice({ Ztg: null });
  const { data: spotPrices } = useMarketSpotPrices(market?.marketId);
  console.log(baseAssetUsdPrice?.toString());
  console.log(spotPrices);

  const tableData: TableData[] = saturatedPoolData?.assets?.map(
    (asset, index) => ({
      token: {
        color: asset.category.color || "#ffffff",
        label: asset.category.ticker,
      },
      weights: asset.percentage,
      poolBalance: {
        value: (saturatedPoolData.assets.length - 1 === index
          ? basePoolBalance
          : new Decimal(balances[index]?.free.toString() ?? asset.amount)
        )
          ?.div(ZTG)
          .toDecimalPlaces(2)
          .toNumber(),
        usdValue: (saturatedPoolData.assets.length - 1 === index
          ? basePoolBalance.mul(baseAssetUsdPrice)
          : new Decimal(balances[index]?.free.toString() ?? asset.amount)
              .mul(spotPrices.get(index))
              .mul(baseAssetUsdPrice)
        )
          ?.div(ZTG)
          .toDecimalPlaces(2)
          .toNumber(),
      },
      manage: <ManageLiquidityButton poolId={poolId} />,
    }),
  );

  return <Table data={tableData} columns={columns} />;
};

export default PoolTable;
