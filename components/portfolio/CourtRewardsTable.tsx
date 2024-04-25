import Table, { TableColumn, TableData } from "components/ui/Table";
import Link from "next/link";
import EmptyPortfolio from "./EmptyPortfolio";
import { useTradeHistory } from "lib/hooks/queries/useTradeHistory";
import { formatNumberLocalized } from "lib/util";
import { ZTG } from "lib/constants";
import SubScanIcon from "components/icons/SubScanIcon";
import { useMintedInCourt } from "lib/hooks/queries/useMintedInCourt";
import { useZtgPrice } from "lib/hooks/queries/useZtgPrice";
import Decimal from "decimal.js";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";

const columns: TableColumn[] = [
  {
    header: "Time",
    accessor: "timestamp",
    type: "text",
  },
  {
    header: "Amount",
    accessor: "amount",
    type: "component",
    alignment: "right",
  },
  {
    header: "Subscan",
    accessor: "subscan",
    type: "component",
    width: "100px",
  },
];

const CourtRewardsTable = ({ address }: { address: string }) => {
  const { data: mintedInCourt, isLoading } = useMintedInCourt({
    account: address,
  });
  const { data: ztgPrice } = useZtgPrice();
  const { data: constants } = useChainConstants();

  const tableData: TableData[] | undefined = mintedInCourt?.map((mint) => {
    return {
      timestamp: new Intl.DateTimeFormat("default", {
        dateStyle: "medium",
        timeStyle: "medium",
      }).format(new Date(mint?.timestamp)),
      amount: (
        <div>
          <div>
            {formatNumberLocalized(
              new Decimal(mint?.dBalance ?? 0).div(ZTG).toNumber(),
            )}{" "}
            <b>{constants?.tokenSymbol}</b>
          </div>
          <div className="text-gray-400">
            ${" "}
            {formatNumberLocalized(
              ztgPrice
                ?.mul(mint?.dBalance ?? 0)
                .div(ZTG)
                .toNumber() ?? 0,
            )}
          </div>
        </div>
      ),
      subscan: (
        <a
          className="center text-sm"
          target="_blank"
          referrerPolicy="no-referrer"
          rel="noopener"
          href={`https://zeitgeist.subscan.io/block/${mint?.blockNumber}?tab=event`}
        >
          <div className="">
            <SubScanIcon />
          </div>
        </a>
      ),
      // question: (
      //   <Link
      //     href={`/markets/${trade?.marketId}`}
      //     className="line-clamp-1 text-[14px]"
      //   >
      //     {trade?.question}
      //   </Link>
      // ),
      // bought: `${formatNumberLocalized(
      //   trade?.assetAmountOut.div(ZTG).toNumber() ?? 0,
      // )} ${trade?.assetOut}`,
      // sold: `${formatNumberLocalized(
      //   trade?.assetAmountIn.div(ZTG).toNumber() ?? 0,
      // )} ${trade?.assetIn}`,
      // price: `${formatNumberLocalized(
      //   trade?.price.toNumber() ?? 0,
      // )} ${trade?.baseAssetName}`,
      // time: new Intl.DateTimeFormat("default", {
      //   dateStyle: "medium",
      //   timeStyle: "medium",
      // }).format(new Date(trade?.time)),
      // links: (
      //   <div className="center">
      //     <a
      //       className="center"
      //       target="_blank"
      //       referrerPolicy="no-referrer"
      //       rel="noopener"
      //       href={`https://zeitgeist.subscan.io/extrinsic/${trade?.extrinsic?.hash}`}
      //     >
      //       <SubScanIcon />
      //     </a>
      //   </div>
      // ),
    };
  });

  return (
    <div>
      {isLoading === false &&
      (mintedInCourt == null || mintedInCourt?.length === 0) ? (
        <EmptyPortfolio
          headerText="No Court Rewards"
          bodyText=""
          buttonText="Go To Court"
          buttonLink="/court"
        />
      ) : (
        <Table columns={columns} data={tableData} />
      )}
    </div>
  );
};

export default CourtRewardsTable;
