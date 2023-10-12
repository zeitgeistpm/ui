import { ZTG, isRpcSdk } from "@zeitgeistpm/sdk";
import JoinCourtButton from "components/court/JoinCourt";
import JurorsTable from "components/court/JurorsTable";
import PrepareExitCourtButton from "components/court/PrepareExitCourt";
import { useConnectedCourtParticipant } from "lib/hooks/queries/court/useConnectedCourtParticipant";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { NextPage } from "next";

const CourtPage: NextPage = () => {
  const { data: constants } = useChainConstants();
  const [sdk] = useSdkv2();
  const notificationStore = useNotifications();
  const wallet = useWallet();

  const participant = useConnectedCourtParticipant();

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

  return (
    <div className="flex flex-col mt-4 gap-y-4">
      <div className="font-bold text-2xl">Court</div>
      <div className="flex gap-4">
        <JoinCourtButton />
        {!participant?.prepareExit && <PrepareExitCourtButton />}
        {participant?.prepareExit && (
          <button
            className="bg-[#DC056C] rounded-md text-white py-2 px-4"
            disabled={isLeaveLoading === true || !participant}
          >
            Exit Court
          </button>
        )}
      </div>
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
