import SubScanIcon from "components/icons/SubScanIcon";
import Table, { TableColumn, TableData } from "components/ui/Table";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useMintedInCourt } from "lib/hooks/queries/useMintedInCourt";
import { useZtgPrice } from "lib/hooks/queries/useZtgPrice";
import { formatNumberLocalized } from "lib/util";
import EmptyPortfolio from "./EmptyPortfolio";
import {
  isPayoutEligible,
  useCourtNextPayout,
} from "lib/hooks/queries/useCourtNextPayout";
import { times } from "lodash-es";
import { isNotNull } from "@zeitgeistpm/utility/dist/null";
import InfoPopover from "components/ui/InfoPopover";
import { PiTimerBold } from "react-icons/pi";

const columns: TableColumn[] = [
  {
    header: "Time",
    accessor: "timestamp",
    type: "component",
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

  const { data: courtPayout } = useCourtNextPayout();

  let tableData: TableData[] | undefined = mintedInCourt?.map((mint) => {
    return {
      timestamp: (
        <span>
          {new Intl.DateTimeFormat("default", {
            dateStyle: "medium",
            timeStyle: "medium",
          }).format(new Date(mint?.timestamp))}
        </span>
      ),
      amount: (
        <div>
          <div>
            {formatNumberLocalized(
              new Decimal(mint?.dBalance ?? 0).div(ZTG).toNumber(),
            )}{" "}
            <b>{constants?.tokenSymbol}</b>
          </div>
          <div className="text-white/70">
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

  tableData = [
    isPayoutEligible(courtPayout)
      ? {
          timestamp: (
            <span className="flex items-center gap-2 text-white/70">
              {new Intl.DateTimeFormat("default", {
                dateStyle: "medium",
                timeStyle: "medium",
              }).format(courtPayout.nextRewardDate)}
              <span className="flex items-center gap-1 italic">
                (ETA <PiTimerBold size={18} />)
              </span>
            </span>
          ),
          amount: <div className="text-white/70">--</div>,
          subscan: (
            <div className="center text-center">
              <InfoPopover
                icon={<PiTimerBold className="text-orange-300" size={24} />}
                position={"top-start"}
              >
                Next expected staking reward payout.
              </InfoPopover>
            </div>
          ),
        }
      : null,
    ...(tableData ?? []),
  ].filter(isNotNull);

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
        <div className="rounded-lg border border-ztg-primary-200/30 bg-white/10 shadow-lg backdrop-blur-md">
          <div className="mb-4 flex items-center gap-2 border-b border-ztg-primary-200/20 px-4 pb-3 pt-4">
            <span className="h-1 w-6 rounded-full bg-ztg-green-500"></span>
            <h2 className="text-base font-semibold text-white/90">
              Court Rewards
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

export default CourtRewardsTable;
