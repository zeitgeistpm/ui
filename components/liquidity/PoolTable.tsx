import { ZTG } from "@zeitgeistpm/sdk-next";
import Table, { TableColumn, TableData } from "components/ui/Table";
import { usePool } from "lib/hooks/queries/usePool";
import { useSaturatedPoolsIndex } from "lib/hooks/queries/useSaturatedPoolsIndex";

const columns: TableColumn[] = [
  {
    header: "Token",
    accessor: "token",
    type: "token",
    width: "29%",
  },
  {
    header: "Weights",
    accessor: "weights",
    type: "percentage",
    width: "8%",
  },
  {
    header: "Pool Balance",
    accessor: "poolBalance",
    type: "currency",
    width: "33%",
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
  }));

  return <Table data={tableData} columns={columns} />;
};

export default PoolTable;
