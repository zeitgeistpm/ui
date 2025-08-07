import Table, { TableColumn, TableData } from "components/ui/Table";
import Link from "next/link";
import { formatNumberLocalized } from "lib/util";
import { useLatestTrades } from "lib/hooks/queries/useLatestTrades";
import { ZTG } from "@zeitgeistpm/sdk";
import moment from "moment";
import Avatar from "components/ui/Avatar";
import { CombinatorialToken } from "lib/types/combinatorial";

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
  const { data: trades } = useLatestTrades({ 
    limit, 
    marketId, 
    outcomeAssets,
    outcomeNames,
    marketQuestion
  });
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
      cost: `${formatNumberLocalized(trade.cost.div(ZTG).toNumber())} ${
        trade.costSymbol
      }`,
      price: formatNumberLocalized(trade.outcomePrice.toNumber()),
      time: `${moment.duration(now.diff(trade.time)).humanize()} ago`,
    };
  });

  return (
    <div className="">
      <div className="rounded-xl shadow-lg">
        <Table
          columns={columns}
          data={tableData}
          noDataMessage="No trades"
          loadingNumber={limit}
        />
      </div>
    </div>
  );
};

export default LatestTrades;
