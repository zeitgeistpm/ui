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
            className="text-[14px] text-white transition-colors hover:text-ztg-green-400"
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
        <div className="rounded-lg border border-ztg-primary-200/30 bg-white/10 shadow-lg backdrop-blur-md">
          <div className="mb-4 flex items-center gap-2 border-b border-ztg-primary-200/20 px-4 pb-3 pt-4">
            <span className="h-1 w-6 rounded-full bg-ztg-green-500"></span>
            <h2 className="text-base font-semibold text-white">
              Transaction History
            </h2>
          </div>
          <div className="px-4 pb-4">
            <Table columns={columns} data={tableData} />
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistoryTable;
