import { Dialog } from "@headlessui/react";
import { useQueryClient } from "@tanstack/react-query";
import { isRpcSdk, ZTG } from "@zeitgeistpm/sdk";
import Modal from "components/ui/Modal";
import TransactionButton from "components/ui/TransactionButton";
import { BLOCK_TIME_SECONDS, DAY_SECONDS } from "lib/constants";
import { useConnectedCourtParticipant } from "lib/hooks/queries/court/useConnectedCourtParticipant";
import { participantsRootKey } from "lib/hooks/queries/court/useParticipants";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { useState } from "react";

const PrepareExitCourtButton = ({ className }: { className?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: constants } = useChainConstants();
  const [sdk, id] = useSdkv2();
  const notificationStore = useNotifications();
  const wallet = useWallet();
  const participant = useConnectedCourtParticipant();
  const queryClient = useQueryClient();

  const {
    isLoading: isPrepareLeaveLoading,
    send: prepareLeaveCourt,
    fee,
  } = useExtrinsic(
    () => {
      if (!isRpcSdk(sdk) || !wallet.realAddress) return;

      return sdk.api.tx.court.prepareExitCourt();
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([id, participantsRootKey]);
        notificationStore.pushNotification("Successfully began exit process", {
          type: "Success",
        });
        setIsOpen(false);
      },
    },
  );

  return (
    <>
      <button
        className={`rounded-md bg-[#DC056C] px-4 py-2 text-white ${className}`}
        onClick={() => setIsOpen(true)}
      >
        Prepare Exit Court
      </button>
      <Modal open={isOpen} onClose={() => setIsOpen(false)}>
        <Dialog.Panel className="w-full max-w-[462px] rounded-[10px] bg-white p-[30px]">
          <h3 className="mb-8">Prepare Exit Court</h3>
          <div className="flex flex-col">
            <div className="flex">
              <div className="mr-auto">Stake:</div>
              <div>
                {participant?.stake.div(ZTG).toNumber()}{" "}
                {constants?.tokenSymbol}
              </div>
            </div>
            <div className="flex">
              <div className="mr-auto">Wait time:</div>
              {constants?.court.inflationPeriodBlocks && (
                <div>
                  {(constants?.court.inflationPeriodBlocks *
                    BLOCK_TIME_SECONDS) /
                    DAY_SECONDS}{" "}
                  Days
                </div>
              )}
            </div>
          </div>
          <div className="mt-[20px] flex w-full flex-col items-center gap-8 text-ztg-18-150 font-semibold">
            <div className="center mb-[10px] text-ztg-12-120 font-normal text-sky-600">
              <span className="ml-1 text-black">
                Network Fee: {fee ? fee.amount.div(ZTG).toFixed(3) : 0}{" "}
                {fee?.symbol}
              </span>
            </div>
            <TransactionButton
              className="w-full max-w-[250px]"
              disabled={isPrepareLeaveLoading}
              onClick={() => prepareLeaveCourt()}
            >
              Confirm Leave
            </TransactionButton>
          </div>
        </Dialog.Panel>
      </Modal>
    </>
  );
};

export default PrepareExitCourtButton;
