import Avatar from "components/ui/Avatar";
import Table, { TableColumn, TableData } from "components/ui/Table";
import Link from "next/link";
import DelegateButton from "./DelegateJuror";
import { useJurors } from "lib/hooks/queries/court/useJurors";
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
  // {
  //   header: "Total Stake",
  //   accessor: "totalStake",
  //   type: "text",
  // },
  {
    header: "Delegators",
    accessor: "delegators",
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
  const { data: jurors } = useJurors();

  const tableData: TableData[] | undefined = jurors?.map((juror) => {
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
      personalStake: new Decimal(juror.stake ?? 0).div(ZTG).toNumber(),
      // totalStake: juror.totalStake,
      delegators: juror.delegations,
      button: <DelegateButton address={juror.address} />,
    };
  });
  return <Table columns={columns} data={tableData} showHighlight={false} />;
};

export default JurorsTable;
