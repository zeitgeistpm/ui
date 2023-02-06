import Table, { TableColumn, TableData } from "components/ui/Table";
import { useAccountBonds } from "lib/hooks/queries/useAccountBonds";

const columns: TableColumn[] = [
  {
    header: "Bond type",
    accessor: "type",
    type: "text",
  },
  {
    header: "Value(ZTG)",
    accessor: "value",
    type: "currency",
  },
  {
    header: "Settled",
    accessor: "settled",
    type: "text",
  },
];

const BondsTable = ({ address }: { address: string }) => {
  const { data: bonds } = useAccountBonds(address);

  const tableData: TableData[] = bonds?.map((bond) => {
    return {
      question: bond.question,
      action: bond.type,
      value: {
        value: bond.value,
        usdValue: 0,
      },
      settled: bond.isSettled === true ? "Yes" : "No",
    };
  });

  return <Table columns={columns} data={tableData} />;
};

export default BondsTable;
