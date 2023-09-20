import Avatar from "components/ui/Avatar";
import SecondaryButton from "components/ui/SecondaryButton";
import Table, { TableColumn, TableData } from "components/ui/Table";
import { Link } from "react-feather";

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
    header: "",
    accessor: "button",
    type: "component",
    width: "150px",
  },
];

const JurorsTable = () => {
  const jurors = [
    {
      address: "dE2PSbmYGG2jyKACsZk83PydtyCJVrskVHpJdj4eqFY945KJu",
      personalStake: 10,
      totalStake: 10,
      delegators: 2,
    },
  ];
  const tableData: TableData[] | undefined = jurors.map((juror) => {
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
      personalStake: juror.personalStake,
      totalStake: juror.totalStake,
      delegators: juror.delegators,
      button: <SecondaryButton onClick={() => {}}>Delegate</SecondaryButton>,
    };
  });
  return <Table columns={columns} data={tableData} showHighlight={false} />;
};

export default JurorsTable;
