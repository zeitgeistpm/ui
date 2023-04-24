import { useTransactionHistory } from "lib/hooks/queries/useTransactionHistory";
import Table, { TableColumn, TableData } from "components/ui/Table";
import Link from "next/link";
import EmptyPortfolio from "./EmptyPortfolio";

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
  const { data: transactionHistory, isLoading } =
    useTransactionHistory(address);

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
        usdValue: null,
      },
      value: {
        value: transaction.value,
        usdValue: null,
      },
      time: new Intl.DateTimeFormat("default", {
        dateStyle: "medium",
        timeStyle: "medium",
      }).format(new Date(transaction.time)),
    };
  });

  return (
    <div>
      {isLoading === false &&
      (transactionHistory == null || transactionHistory?.length === 0) ? (
        <EmptyPortfolio
          headerText="No Transactions"
          bodyText="Browse markets"
          buttonText="View markets"
          buttonLink="/markets"
        />
      ) : (
        <Table columns={columns} data={tableData} />
      )}
    </div>
  );
};

export default TransactionHistoryTable;
