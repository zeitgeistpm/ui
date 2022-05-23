import Table, { TableColumn, TableData } from "components/ui/Table";
import MarketStore from "lib/stores/MarketStore";
import { observer } from "mobx-react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ExternalLink } from "react-feather";

export interface Position {
  marketId: string;
  marketEndTimeStamp: number;
  marketTitle: string;
  marketStore: MarketStore;
  tableData: TableData[];
}

const PortfolioCard = observer(({ position }) => {
  const router = useRouter();

  const handleRowClick = (data: TableData) => {
    router.push({
      pathname: "/asset",
      query: {
        marketId: data.marketId.toString(),
        assetId: JSON.stringify(data.assetId),
      },
    });
  };
  const columns: TableColumn[] = [
    {
      header: "Token",
      accessor: "token",
      type: "token",
      onClick: (row) => {
        handleRowClick(row);
      },
      width: "130px",
    },
    {
      header: "Amount",
      accessor: "amount",
      type: "number",
    },
    {
      header: "Price Per Share",
      accessor: "sharePrice",
      type: "currency",
    },
    {
      header: "Total Value",
      accessor: "total",
      type: "currency",
    },
    {
      header: "Graph",
      accessor: "history",
      type: "graph",
    },
    {
      header: "24Hrs",
      accessor: "change",
      type: "change",
    },
    {
      header: "",
      accessor: "buttons",
      type: "component",
      width: "140px",
    },
  ];

  const handleMarketLinkClick = (marketId: string) => {
    //todo: update left drawer
    router.push(`/markets/${marketId}`);
  };

  return (
    <div className="rounded-ztg-10 bg-sky-100 dark:bg-black">
      <div className="flex mt-ztg-20 items-center px-ztg-15 py-ztg-5 bg-sky-300 dark:bg-sky-700 rounded-t-ztg-10">
        <span className="font-bold text-ztg-10-150 uppercase ">
          {position.marketTitle}
        </span>
        <span className="ml-auto font-bold text-ztg-10-150 mr-ztg-16">
          {new Date().getTime() < position.marketEndTimeStamp
            ? "Ends: "
            : "Ended: "}
          {new Intl.DateTimeFormat("en-US", {
            dateStyle: "medium",
            timeStyle: "long",
          }).format(new Date(position.marketEndTimeStamp))}
        </span>
        {new Date().getTime() < position.marketEndTimeStamp ? (
          <span className="bg-black text-white rounded-ztg-100 text-ztg-10-150 font-medium h-ztg-20 w-ztg-69 text-center pt-ztg-2 mr-ztg-16">
            Active
          </span>
        ) : (
          <span className="bg-black text-white rounded-ztg-100 text-ztg-10-150 font-medium h-ztg-20 w-ztg-69 text-center pt-ztg-2 mr-ztg-16">
            Inactive
          </span>
        )}
        <Link href={`/markets/${position.marketId}`}>
          <a>
            <ExternalLink size={24} className="cursor-pointer text-sky-600" />
          </a>
        </Link>
      </div>
      <Table columns={columns} data={position.tableData} rowHeightPx={50} />
    </div>
  );
});

export default PortfolioCard;
