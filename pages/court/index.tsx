import { NextPage } from "next";
import { isRpcSdk } from "@zeitgeistpm/sdk-next";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useNotifications } from "lib/state/notifications";
import JurorsTable from "components/court/JurorsTable";

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
