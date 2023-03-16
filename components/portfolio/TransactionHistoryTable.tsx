import { useTransactionHistory } from "lib/hooks/queries/useTransactionHistory";
import Table, { TableColumn, TableData } from "components/ui/Table";
import Link from "next/link";

const columns: TableColumn[] = [
  {
    header: "Market",
    accessor: "question",
    type: "component",
  },
  {
    header: "Action",
    accessor: "action",
    type: "text",
  },
  {
    header: "Price(ZTG)",
    accessor: "price",
    type: "currency",
  },
  {
    header: "Cost(ZTG)",
    accessor: "value",
    type: "currency",
  },
  {
    header: "Time",
    accessor: "time",
    type: "text",
  },
];

const TransactionHistoryTable = ({ address }: { address: string }) => {
  const { data: transactionHistory } = useTransactionHistory(address);

  const tableData: TableData[] = transactionHistory?.map((transaction) => {
    return {
      question: (
        <Link href={`/markets/${transaction.marketId}`} className="text-[14px]">
          {transaction.question}
        </Link>
      ),
      action: transaction.action,
      price: {
        value: transaction.price,
        usdValue: 0,
      },
      value: {
        value: transaction.value,
        usdValue: 0,
      },
      time: new Intl.DateTimeFormat("default", {
        dateStyle: "medium",
        timeStyle: "medium",
      }).format(new Date(transaction.time)),
    };
  });

  return <Table columns={columns} data={tableData} />;
};

export default TransactionHistoryTable;
