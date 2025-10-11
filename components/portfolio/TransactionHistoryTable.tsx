import {
  TradeEvent,
  useTransactionHistory,
} from "lib/hooks/queries/useTransactionHistory";
import Table, { TableColumn, TableData } from "components/ui/Table";
import Link from "next/link";
import EmptyPortfolio from "./EmptyPortfolio";
import SubScanIcon from "components/icons/SubScanIcon";

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
    header: "Time",
    accessor: "time",
    type: "text",
  },
  {
    header: "Block",
    accessor: "block",
    type: "text",
  },
  {
    header: "Links",
    accessor: "links",
    type: "component",
  },
];

const TransactionHistoryTable = ({ address }: { address: string }) => {
  const { data: transactionHistory, isLoading } =
    useTransactionHistory(address);

  const tableData: TableData[] | undefined = transactionHistory
    ?.reduce<TradeEvent[]>((transactions, transaction) => {
      //remove duplicate events
      if (
        transactions[transactions.length - 1]?.blockNumber ===
        transaction.blockNumber
      ) {
        return transactions;
      } else {
        return [...transactions, transaction];
      }
    }, [])
    .map((transaction) => {
      return {
        question: (
          <Link
            href={`/markets/${transaction.marketId}`}
            className="text-[14px]"
          >
            {transaction.question}
          </Link>
        ),
        action: transaction.action,
        time: new Intl.DateTimeFormat("default", {
          dateStyle: "medium",
          timeStyle: "medium",
        }).format(new Date(transaction.time)),
        block: transaction.blockNumber,
        links: (
          <div className="center">
            <a
              className="center"
              target="_blank"
              rel="noopener noreferrer"
              href={`https://zeitgeist.subscan.io/extrinsic/${transaction.extrinsic.hash}`}
            >
              <SubScanIcon />
            </a>
          </div>
        ),
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
        <div className="rounded-lg bg-gradient-to-br from-sky-50/30 to-blue-50/30 p-4 shadow-lg">
          <div className="overflow-hidden rounded-lg bg-white/60 backdrop-blur-sm">
            <Table columns={columns} data={tableData} />
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistoryTable;
