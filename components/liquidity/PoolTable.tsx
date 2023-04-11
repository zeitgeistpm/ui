import { ZTG } from "@zeitgeistpm/sdk-next";
import Table, { TableColumn, TableData } from "components/ui/Table";
import Decimal from "decimal.js";
import { useAccountPoolAssetBalances } from "lib/hooks/queries/useAccountPoolAssetBalances";
import { usePool } from "lib/hooks/queries/usePool";
import { useSaturatedPoolsIndex } from "lib/hooks/queries/useSaturatedPoolsIndex";
import { useZtgBalance } from "lib/hooks/queries/useZtgBalance";
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
  const { data: saturatedPoolIndex } = useSaturatedPoolsIndex(
    pool ? [pool] : undefined,
  );
  const saturatedPoolData = saturatedPoolIndex?.[poolId];

  const { data: balances } = useAccountPoolAssetBalances(pool?.accountId, pool);
  const { data: basePoolBalance } = useZtgBalance(pool?.accountId);

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
          : new Decimal(balances[index].free.toString())
        )
          .div(ZTG)
          .toDecimalPlaces(2)
          .toNumber(),
        usdValue: 0,
      },
      manage: <ManageLiquidityButton poolId={poolId} />,
    }),
  );

  return <Table data={tableData} columns={columns} />;
};

export default PoolTable;
