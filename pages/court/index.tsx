import { NextPage } from "next";
import { ZTG, isRpcSdk } from "@zeitgeistpm/sdk";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useNotifications } from "lib/state/notifications";
import JurorsTable from "components/court/JurorsTable";
import JoinCourtButton from "components/court/JoinCourt";
import { useWallet } from "lib/state/wallet";
import TransactionButton from "components/ui/TransactionButton";
import { useParticipants } from "lib/hooks/queries/court/useParticipants";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";

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

const CourtPage: NextPage = () => {
  const { data: participants } = useParticipants();
  const wallet = useWallet();
  const { data: constants } = useChainConstants();

  const participant = participants?.find(
    (p) => p.address === wallet.realAddress,
  );

  console.log("me", participant);

  return (
    <div className="flex flex-col mt-4">
      <div className="font-bold text-2xl">Court</div>
      <JoinCourtButton />
      {/* <JurorHeader /> */}
      <div className="flex gap-2">
        <span>My Stake:</span>
        <span>
          {participant?.stake.div(ZTG).toString()} {constants?.tokenSymbol}
        </span>
      </div>
      <div className="flex gap-2">
        <span>Delegations:</span>
        {participant?.delegations?.map((address) => (
          <span>{address}</span>
        ))}
      </div>
      <JurorsTable />
    </div>
  );
};

export default CourtPage;
