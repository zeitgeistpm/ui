import Table, { TableColumn, TableData } from "components/ui/Table";
import Link from "next/link";
import { formatNumberLocalized } from "lib/util";
import { useLatestTrades } from "lib/hooks/queries/useLatestTrades";
import { ZTG } from "@zeitgeistpm/sdk";
import moment from "moment";
import Avatar from "components/ui/Avatar";
import { CombinatorialToken } from "lib/types/combinatorial";
import { useMemo } from "react";

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

const LatestTrades = ({
  limit = 3,
  marketId,
  outcomeAssets,
  outcomeNames,
  marketQuestion,
}: {
  limit?: number;
  marketId?: number;
  outcomeAssets?: CombinatorialToken[];
  outcomeNames?: string[];
  marketQuestion?: string;
}) => {
  const { data: trades, isLoading } = useLatestTrades({
    limit,
    marketId,
    outcomeAssets,
    outcomeNames,
    marketQuestion,
  });

  const tableData: TableData[] | undefined = useMemo(() => {
    // If still loading, return undefined to show skeleton
    if (isLoading || trades === undefined) return undefined;

    // If no trades, return empty array to show "No trades" message
    if (!trades.length) return [];

    const now = moment();
    return trades.map((trade) => ({
      trader: (
        <Link href={`/portfolio/${trade.traderAddress}`}>
          <Avatar address={trade.traderAddress} />
        </Link>
      ),
      question: (
        <Link href={`/markets/${trade.marketId}`} className="text-[14px]">
          {trade.question}
        </Link>
      ),
      outcome: trade.outcomeName,
      trade: trade.type === "buy" ? "Buy" : "Sell",
      cost: `${formatNumberLocalized(trade.cost.div(ZTG).toNumber())} ${trade.costSymbol}`,
      price: formatNumberLocalized(trade.outcomePrice.toNumber()),
      time: `${moment.duration(now.diff(trade.time)).humanize()} ago`,
    }));
  }, [trades, isLoading]);

  return (
    <div className="rounded-xl shadow-lg">
      <Table
        columns={columns}
        data={tableData}
        noDataMessage="No trades"
        loadingNumber={limit}
      />
    </div>
  );
};

export default LatestTrades;
