import Avatar from "components/ui/Avatar";
import Table, { TableColumn, TableData } from "components/ui/Table";
import Link from "next/link";
import DelegateButton from "./DelegateButton";
import { useCourtParticipants } from "lib/hooks/queries/court/useCourtParticipants";
import Decimal from "decimal.js";
import { ZTG } from "@zeitgeistpm/sdk";

const columns: TableColumn[] = [
  {
    header: "Address",
    accessor: "address",
    type: "component",
  },
  {
    header: "Personal Stake",
    accessor: "personalStake",
    type: "text",
  },
  {
    header: "Total Stake",
    accessor: "totalStake",
    type: "text",
  },
  {
    header: "Delegators",
    accessor: "delegators",
    type: "text",
  },
  {
    header: "Status",
    accessor: "status",
    type: "text",
  },
  {
    header: "",
    accessor: "button",
    type: "component",
    width: "150px",
  },
];

const JurorsTable = () => {
  const { data: participants } = useCourtParticipants();

  const tableData: TableData[] | undefined = participants
    ?.filter((p) => p.type === "Juror")
    .map((juror) => {
      const delegators = participants.filter(
        (participant) =>
          participant.delegations?.some((d) => d === juror.address),
      );

      const delegatorStake = delegators.reduce<Decimal>(
        (total, delegator) => total.plus(delegator.stake),
        new Decimal(0),
      );

      return {
        address: (
          <Link
            href={`/portfolio/${juror.address}`}
            className="flex items-center gap-2 text-xs"
          >
            <Avatar address={juror.address} />
            <span>{juror.address}</span>
          </Link>
        ),
        personalStake: juror.stake.div(ZTG).toNumber(),
        totalStake: juror.stake.plus(delegatorStake).div(ZTG).toNumber(),
        status: juror.prepareExit ? "Exiting" : "Active",
        delegators: delegators.length,
        button: <DelegateButton address={juror.address} />,
      };
    });
  return <Table columns={columns} data={tableData} showHighlight={false} />;
};

export default JurorsTable;
