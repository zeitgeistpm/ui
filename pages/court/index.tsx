import { useQueryClient } from "@tanstack/react-query";
import { ZTG, isRpcSdk } from "@zeitgeistpm/sdk";
import JoinCourtButton from "components/court/JoinCourt";
import JurorsTable from "components/court/JurorsTable";
import PrepareExitCourtButton from "components/court/PrepareExitCourt";
import { environment } from "lib/constants";
import { useConnectedCourtParticipant } from "lib/hooks/queries/court/useConnectedCourtParticipant";
import { participantsRootKey } from "lib/hooks/queries/court/useParticipants";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useZtgPrice } from "lib/hooks/queries/useZtgPrice";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { formatNumberLocalized } from "lib/util";
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

  const connectedParticipant = useConnectedCourtParticipant();
  const { data: ztgPrice } = useZtgPrice();

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
    <div className="flex flex-col mt-4 gap-y-4">
      <div className="font-bold text-2xl">Court</div>
      <p className="font-light mb-4">
        Some nice court copy that describes the mechanics of the court and how
        it works from a high level.
      </p>

      {connectedParticipant && (
        <div className="">
          <h3 className="mb-2 text-lg">My Stake</h3>
          <div className="bg-slate-200 rounded-md py-5 px-6 inline-block mb-4 min-w-[260px]">
            <div className="font-medium text-lg mb-[0.5]">
              {formatNumberLocalized(
                connectedParticipant?.stake.div(ZTG).toNumber() ?? 0,
              )}{" "}
              {constants?.tokenSymbol}
            </div>
            <div className="font-light text-gray-500 mb-4">
              $
              {ztgPrice &&
                formatNumberLocalized(
                  ztgPrice
                    .mul(connectedParticipant?.stake.div(ZTG).toNumber() ?? 0)
                    .toNumber(),
                )}
            </div>

            <div>
              <div className="flex gap-4 mb-3">
                <JoinCourtButton />
                {!connectedParticipant?.prepareExit && (
                  <PrepareExitCourtButton />
                )}
                {connectedParticipant?.prepareExit && (
                  <button
                    className="bg-[#DC056C] rounded-md text-white py-2 px-4"
                    disabled={isLeaveLoading === true || !connectedParticipant}
                    onClick={() => leaveCourt()}
                  >
                    Exit Court
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <span>Delegations:</span>
        {connectedParticipant?.delegations?.map((address) => (
          <span>{address}</span>
        ))}
      </div>
      <JurorsTable />
    </div>
  );
};

export default CourtPage;
