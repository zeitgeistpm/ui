import SubScanIcon from "components/icons/SubScanIcon";
import Table, { TableColumn, TableData } from "components/ui/Table";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useMintedInCourt } from "lib/hooks/queries/useMintedInCourt";
import { useZtgPrice } from "lib/hooks/queries/useZtgPrice";
import { formatNumberLocalized } from "lib/util";
import EmptyPortfolio from "./EmptyPortfolio";

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
