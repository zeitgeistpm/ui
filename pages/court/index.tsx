import { useQueryClient } from "@tanstack/react-query";
import { ZTG, isRpcSdk } from "@zeitgeistpm/sdk";
import ManageDelegationButton from "components/court/ManageDelegationButton";
import JoinCourtAsJurorButton from "components/court/JoinCourtAsJurorButton";
import JurorsTable from "components/court/JurorsTable";
import PrepareExitCourtButton from "components/court/PrepareExitCourt";
import InfoPopover from "components/ui/InfoPopover";
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
import { CourtCasesTable } from "components/court/CourtCasesTable";
import Image from "next/image";

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
      <div className="relative rounded-lg overflow-hidden p-6 mb-4">
        <div className="w-full h-full z-10 absolute top-0 left-0">
          <Image
            title="Wizard draped in purple robes holding a flaming crypto key."
            alt="Wizard draped in purple robes holding a flaming crypto key."
            src={"/court_banner.webp"}
            layout="fill"
            objectFit="cover"
            style={{
              objectPosition: "20% 30%",
            }}
          />
        </div>
        <div className="relative z-20">
          <div className="font-bold text-3xl mb-2 text-white drop-shadow-lg">
            Court
          </div>
          <p className="font-light mb-4 text-white drop-shadow-lg md:max-w-[940px]">
            Anyone can participate by joining the court system as a juror or
            delegator. As a juror, you are responsible for supplying the
            truthful outcome of a prediction market by voting and revealing the
            raw vote information. As a delegator, you can delegate your voting
            rights to active jurors.
          </p>

          <div className="">
            <div className="bg-slate-200 bg-opacity-60 w-full md:w-auto rounded-md py-5 px-6 inline-block mb-4 min-w-[260px]">
              <div className="flex">
                <h3 className="mb-2 text-lg flex-1 text-gray-800">My Stake</h3>
                {connectedParticipant && (
                  <div>
                    <div
                      className={`text-sm px-2 py-1 rounded-md text-gray-600 center gap-1`}
                    >
                      {connectedParticipant?.type}
                      <InfoPopover overlay={false} position="top">
                        {connectedParticipant?.type === "Juror"
                          ? "You are participating as a juror. All stake is delegated to your personal juror stake."
                          : "You are participating as a delegator. The probability of one delegator being selected is equally distributed among all delegations."}
                      </InfoPopover>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex  mb-4">
                <div className="flex-1">
                  <div className="font-medium text-lg mb-[0.5]">
                    {formatNumberLocalized(
                      connectedParticipant?.stake.div(ZTG).toNumber() ?? 0,
                    )}{" "}
                    {constants?.tokenSymbol}
                  </div>
                  <div className="font-light text-gray-600">
                    $
                    {ztgPrice &&
                      formatNumberLocalized(
                        ztgPrice
                          .mul(
                            connectedParticipant?.stake.div(ZTG).toNumber() ??
                              0,
                          )
                          .toNumber(),
                      )}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex flex-col md:flex-row gap-4 mb-3">
                  <JoinCourtAsJurorButton className="w-full md:w-auto" />
                  <ManageDelegationButton className="w-full md:w-auto" />

                  {!connectedParticipant?.prepareExit && (
                    <PrepareExitCourtButton className="w-full md:w-auto" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section>
        <h3 className="mb-3 ml-2 text-base">Court Cases</h3>
        <CourtCasesTable />
      </section>
    </div>
  );
};

export default CourtPage;
