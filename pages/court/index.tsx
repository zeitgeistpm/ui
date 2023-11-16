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
import { IGetPlaiceholderReturn, getPlaiceholder } from "plaiceholder";

export async function getStaticProps() {
  const [bannerPlaiceholder] = await Promise.all([
    getPlaiceholder(`/court_banner.webp`),
  ]);

  return {
    props: {
      bannerPlaiceholder,
    },
  };
}

const CourtPage: NextPage = ({
  bannerPlaiceholder,
}: {
  bannerPlaiceholder: IGetPlaiceholderReturn;
}) => {
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
    <div className="mt-4 flex flex-col gap-y-4">
      <div className="relative mb-4 overflow-hidden rounded-lg p-6">
        <div className="absolute left-0 top-0 z-10 h-full w-full">
          <Image
            title="Wizard draped in purple robes holding a flaming crypto key."
            alt="Wizard draped in purple robes holding a flaming crypto key."
            src={"/court_banner.webp"}
            priority
            layout="fill"
            objectFit="cover"
            blurDataURL={bannerPlaiceholder.base64}
            placeholder="blur"
            style={{
              objectPosition: "20% 30%",
            }}
          />
        </div>
        <div className="relative z-20">
          <div className="mb-2 text-3xl font-bold text-white drop-shadow-lg">
            Court
          </div>
          <p className="mb-4 font-light text-white drop-shadow-lg md:max-w-[940px]">
            Anyone can participate by joining the court system as a juror or
            delegator. As a juror, you are responsible for supplying the
            truthful outcome of a prediction market by voting and revealing the
            raw vote information. As a delegator, you can delegate your voting
            rights to active jurors.
          </p>

          <div className="mb-4 inline-block w-full min-w-[260px] rounded-md bg-slate-200 bg-opacity-50 px-6 py-5 backdrop-blur-[2px] md:w-auto">
            <div className="flex">
              <h3 className="mb-2 flex-1 text-lg text-gray-800">My Stake</h3>
              {connectedParticipant && (
                <div>
                  <div
                    className={`center gap-1 rounded-md px-2 py-1 text-sm text-gray-600`}
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

            <div className="mb-4  flex">
              <div className="flex-1">
                <div className="mb-[0.5] text-lg font-medium">
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
                          connectedParticipant?.stake.div(ZTG).toNumber() ?? 0,
                        )
                        .toNumber(),
                    )}
                </div>
              </div>
            </div>

            <div>
              <div className="mb-3 flex flex-col gap-4 md:flex-row">
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

      <section>
        <h3 className="mb-3 ml-2 text-base">Court Cases</h3>
        <CourtCasesTable />
      </section>
    </div>
  );
};

export default CourtPage;
