import Table, { TableColumn, TableData } from "components/ui/Table";
import Link from "next/link";
import { formatNumberLocalized } from "lib/util";
import { useLatestTrades } from "lib/hooks/queries/useLatestTrades";
import { ZTG } from "@zeitgeistpm/sdk-next";
import moment from "moment";
import Avatar from "components/ui/Avatar";

const columns: TableColumn[] = [
  {
    header: "Trader",
    accessor: "trader",
    type: "component",
  },
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
  const now = moment();

  const tableData: TableData[] | undefined = trades?.map((trade) => {
    return {
      trader: (
        <Link href={`/portfolio/${trade.traderAddress}`} className="">
          <Avatar address={trade.traderAddress} />
        </Link>
      ),
      question: (
        <Link href={`/markets/${trade.marketId}`} className="text-[14px]">
          {trade?.question}
        </Link>
      ),
      outcome: trade.outcomeName,
      trade: trade.type === "buy" ? "Buy" : "Sell",
      cost: formatNumberLocalized(trade.cost.div(ZTG).toNumber()),
      price: formatNumberLocalized(trade.outcomePrice.toNumber()),
      time: `${moment.duration(now.diff(trade.time)).humanize()} ago`,
    };
  });

  return (
    <div className="mb-12">
      <h2 className="sm:col-span-2 text-center sm:text-start mb-7">
        Latest Trades
      </h2>
      <Table columns={columns} data={tableData} />
    </div>
  );
};

export default TradeHistoryTable;
