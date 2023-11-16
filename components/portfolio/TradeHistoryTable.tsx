import Table, { TableColumn, TableData } from "components/ui/Table";
import Link from "next/link";
import EmptyPortfolio from "./EmptyPortfolio";
import { useTradeHistory } from "lib/hooks/queries/useTradeHistory";
import { formatNumberLocalized } from "lib/util";
import { ZTG } from "lib/constants";
import SubScanIcon from "components/icons/SubScanIcon";

const columns: TableColumn[] = [
  {
    header: "Market",
    accessor: "question",
    type: "component",
  },
  {
    header: "Bought",
    accessor: "bought",
    type: "text",
  },
  {
    header: "Sold",
    accessor: "sold",
    type: "text",
  },
  {
    header: "Price",
    accessor: "price",
    type: "text",
    width: "100px",
  },
  {
    header: "Time",
    accessor: "time",
    type: "text",
  },
  {
    header: "Links",
    accessor: "links",
    type: "component",
  },
];

const TradeHistoryTable = ({ address }: { address: string }) => {
  const { data: tradeHistory, isLoading } = useTradeHistory(address);

  const tableData: TableData[] | undefined = tradeHistory?.map((trade) => {
    return {
      question: (
        <Link
          href={`/markets/${trade?.marketId}`}
          className="line-clamp-1 text-[14px]"
        >
          {trade?.question}
        </Link>
      ),
      bought: `${formatNumberLocalized(
        trade?.assetAmountOut.div(ZTG).toNumber() ?? 0,
      )} ${trade?.assetOut}`,
      sold: `${formatNumberLocalized(
        trade?.assetAmountIn.div(ZTG).toNumber() ?? 0,
      )} ${trade?.assetIn}`,
      price: `${formatNumberLocalized(
        trade?.price.toNumber() ?? 0,
      )} ${trade?.baseAssetName}`,
      time: new Intl.DateTimeFormat("default", {
        dateStyle: "medium",
        timeStyle: "medium",
      }).format(new Date(trade?.time)),
      links: (
        <div className="center">
          <a
            className="center"
            target="_blank"
            referrerPolicy="no-referrer"
            rel="noopener"
            href={`https://zeitgeist.subscan.io/extrinsic/${trade?.extrinsic?.hash}`}
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
      (tradeHistory == null || tradeHistory?.length === 0) ? (
        <EmptyPortfolio
          headerText="No Trades"
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

export default TradeHistoryTable;
