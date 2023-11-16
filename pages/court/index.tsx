import { useQueryClient } from "@tanstack/react-query";
import { ZTG, isRpcSdk } from "@zeitgeistpm/sdk";
import JoinCourtButton from "components/court/JoinCourt";
import JurorsTable from "components/court/JurorsTable";
import PrepareExitCourtButton from "components/court/PrepareExitCourt";
import { environment } from "lib/constants";
import { useConnectedCourtParticipant } from "lib/hooks/queries/court/useConnectedCourtParticipant";
import { participantsRootKey } from "lib/hooks/queries/court/useParticipants";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { NextPage } from "next";
import NotFoundPage from "pages/404";

const CourtPage: NextPage = () => {
  if (process.env.NEXT_PUBLIC_SHOW_COURT !== "true") {
    return <NotFoundPage />;
  }

  const { data: constants } = useChainConstants();
  const [sdk, id] = useSdkv2();
  const notificationStore = useNotifications();
  const wallet = useWallet();
  const queryClient = useQueryClient();

  const participant = useConnectedCourtParticipant();

  const { isLoading: isLeaveLoading, send: leaveCourt } = useExtrinsic(
    () => {
      if (!isRpcSdk(sdk) || !wallet.realAddress) return;
      return sdk.api.tx.court.exitCourt(wallet.realAddress); //todo: is this correct input?
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([id, participantsRootKey]);
        notificationStore.pushNotification("Successfully exited court", {
          type: "Success",
        });
      },
    },
  );

  return (
    <div className="mt-4 flex flex-col gap-y-4">
      <div className="text-2xl font-bold">Court</div>
      <div className="flex gap-4">
        <JoinCourtButton />
        {!participant?.prepareExit && <PrepareExitCourtButton />}
        {participant?.prepareExit && (
          <button
            className="rounded-md bg-[#DC056C] px-4 py-2 text-white"
            disabled={isLeaveLoading === true || !participant}
            onClick={() => leaveCourt()}
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
        {participant?.delegations?.map((address) => <span>{address}</span>)}
      </div>
      <JurorsTable />
    </div>
  );
};

export default CourtPage;
