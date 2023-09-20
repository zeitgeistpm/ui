import { NextPage } from "next";
import { isRpcSdk } from "@zeitgeistpm/sdk-next";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useNotifications } from "lib/state/notifications";
import Table, { TableColumn, TableData } from "components/ui/Table";
import Link from "next/link";
import Avatar from "components/ui/Avatar";
import SecondaryButton from "components/ui/SecondaryButton";

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
const JurorHeader = () => {
  const [sdk] = useSdkv2();
  const notificationStore = useNotifications();
  const { isLoading, isSuccess, send } = useExtrinsic(
    () => {
      if (!isRpcSdk(sdk)) return;

      return sdk.api.tx.court.exitCourt();
    },
    {
      onSuccess: () => {
        notificationStore.pushNotification("Successfully joined court", {
          type: "Success",
        });
      },
    },
  );

  return (
    <div>
      <button>Leave Court</button>
      <div>Stake size</div>
      <div>Count down till next vote/reveal period</div>
      <div>My Cases</div>
    </div>
  );
};
const NonJurorHeader = () => {
  const [sdk] = useSdkv2();
  const notificationStore = useNotifications();
  const { isLoading, isSuccess, send } = useExtrinsic(
    () => {
      if (!isRpcSdk(sdk)) return;

      return sdk.api.tx.court.joinCourt();
    },
    {
      onSuccess: () => {
        notificationStore.pushNotification("Successfully joined court", {
          type: "Success",
        });
      },
    },
  );

  return (
    <div>
      <button>Leave Court</button>
      <div>Stake size</div>
      <div>Count down till next vote/reveal period</div>
    </div>
  );
};

const CourtPage: NextPage = () => {
  return (
    <div className="flex flex-col">
      <div>Court</div>
      <JurorsTable />
    </div>
  );
};

export default CourtPage;
