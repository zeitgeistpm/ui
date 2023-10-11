import { NextPage } from "next";
import { isRpcSdk } from "@zeitgeistpm/sdk";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useNotifications } from "lib/state/notifications";
import JurorsTable from "components/court/JurorsTable";
import JoinCourtButton from "components/court/JoinCourt";
import { useWallet } from "lib/state/wallet";
import TransactionButton from "components/ui/TransactionButton";

const JurorHeader = () => {
  const [sdk] = useSdkv2();
  const notificationStore = useNotifications();
  const wallet = useWallet();

  const { isLoading: isLeaveLoading, send: leaveCourt } = useExtrinsic(
    () => {
      if (!isRpcSdk(sdk) || !wallet.realAddress) return;

      return sdk.api.tx.court.exitCourt(wallet.realAddress); //todo: is this correct input?
    },
    {
      onSuccess: () => {
        notificationStore.pushNotification("Successfully exit court", {
          type: "Success",
        });
      },
    },
  );
  const { isLoading: isPrepareLeaveLoading, send: prepareLeaveCourt } =
    useExtrinsic(
      () => {
        if (!isRpcSdk(sdk) || !wallet.realAddress) return;

        return sdk.api.tx.court.prepareExitCourt();
      },
      {
        onSuccess: () => {
          notificationStore.pushNotification("Successfully exit court", {
            type: "Success",
          });
        },
      },
    );

  return (
    <div>
      <TransactionButton onClick={leaveCourt} disabled={isLeaveLoading}>
        Leave Court
      </TransactionButton>
      <TransactionButton
        onClick={prepareLeaveCourt}
        disabled={isPrepareLeaveLoading}
      >
        Prepare Leave Court
      </TransactionButton>
      <div>Stake size</div>
      <div>Count down till next vote/reveal period</div>
      <div>My Cases</div>
    </div>
  );
};

const NonJurorHeader = () => {
  return (
    <div>
      <JoinCourtButton />
      <div>Stake size</div>
      <div>Count down till next vote/reveal period</div>
    </div>
  );
};

const CourtPage: NextPage = () => {
  return (
    <div className="flex flex-col">
      <div>Court</div>
      <NonJurorHeader />
      <JurorHeader />
      <JurorsTable />
    </div>
  );
};

export default CourtPage;
