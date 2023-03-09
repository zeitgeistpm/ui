import { ZTG } from "@zeitgeistpm/sdk-next";
import Table, { TableColumn, TableData } from "components/ui/Table";
import { usePool } from "lib/hooks/queries/usePool";
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
  const { data: saturatedPoolIndex } = useSaturatedPoolsIndex(
    pool ? [pool] : undefined,
  );
  const saturatedPoolData = saturatedPoolIndex?.[poolId];

  const tableData: TableData[] = saturatedPoolData?.assets?.map((asset) => ({
    token: {
      color: asset.category.color || "#ffffff",
      label: asset.category.ticker,
    },
    weights: asset.percentage,
    poolBalance: {
      value: asset.amount.div(ZTG).toFixed(2),
      usdValue: 0,
    },
    manage: <ManageLiquidityButton poolId={poolId} />,
  }));

  return <Table data={tableData} columns={columns} />;
};

export default PoolTable;
