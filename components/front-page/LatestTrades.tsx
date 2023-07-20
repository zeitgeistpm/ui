import Table, { TableColumn, TableData } from "components/ui/Table";
import Link from "next/link";
import { formatNumberLocalized } from "lib/util";
import { useLatestTrades } from "lib/hooks/queries/useLatestTrades";
import { ZTG } from "@zeitgeistpm/sdk-next";

const columns: TableColumn[] = [
  {
    header: "Market",
    accessor: "question",
    type: "component",
  },
  {
    header: "Outcome",
    accessor: "outcome",
    type: "text",
  },
  {
    header: "Trade",
    accessor: "trade",
    type: "text",
  },
  {
    header: "Cost",
    accessor: "cost",
    type: "text",
  },
  {
    header: "Price",
    accessor: "price",
    type: "text",
  },
  {
    header: "Time",
    accessor: "time",
    type: "text",
  },
];

const TradeHistoryTable = () => {
  const { data: trades } = useLatestTrades();

  const tableData: TableData[] | undefined = trades?.map((trade) => {
    return {
      question: (
        <Link
          href={`/markets/${trade.marketId}`}
          className="text-[14px] line-clamp-1"
        >
          {trade?.question}
        </Link>
      ),
      outcome: trade.outcomeName,
      trade: trade.type === "buy" ? "Buy" : "Sell",
      cost: formatNumberLocalized(trade.cost.div(ZTG).toNumber()),
      price: formatNumberLocalized(trade.outcomePrice.toNumber()),
      time: new Intl.DateTimeFormat("default", {
        dateStyle: "medium",
        timeStyle: "medium",
      }).format(trade.time),
    };
  });

  return (
    <div className="mb-7">
      <h2 className="sm:col-span-2 text-center sm:text-start mb-7">
        Latest Trades
      </h2>
      <Table columns={columns} data={tableData} />
    </div>
  );
};

export default TradeHistoryTable;
