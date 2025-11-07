import { Dialog } from "@headlessui/react";
import { useQueryClient } from "@tanstack/react-query";
import { isRpcSdk, ZTG } from "@zeitgeistpm/sdk";
import { toMs } from "@zeitgeistpm/utility/dist/time";
import Modal from "components/ui/Modal";
import TransactionButton from "components/ui/TransactionButton";
import { useConnectedCourtParticipant } from "lib/hooks/queries/court/useConnectedCourtParticipant";
import { courtParticipantsRootKey } from "lib/hooks/queries/court/useCourtParticipants";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useChainTime } from "lib/state/chaintime";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import moment from "moment";
import { useMemo, useState } from "react";

const CourtExitButton = ({ className }: { className?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: constants } = useChainConstants();
  const [sdk, id] = useSdkv2();
  const notificationStore = useNotifications();
  const wallet = useWallet();
  const participant = useConnectedCourtParticipant();
  const queryClient = useQueryClient();
  const time = useChainTime();

  const {
    isLoading: isLeaveLoading,
    send: leaveCourt,
    fee,
  } = useExtrinsic(
    () => {
      if (!isRpcSdk(sdk) || !wallet.realAddress) return;
      return sdk.api.tx.court.exitCourt(wallet.realAddress);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries([id, courtParticipantsRootKey]);
        notificationStore.pushNotification("Successfully exited court", {
          type: "Success",
        });
      },
    },
  );

  const cooldownTime = useMemo(() => {
    if (time && participant && constants && participant?.prepareExitAt) {
      const preparedExitAt = participant?.prepareExitAt;
      const canExitAt = preparedExitAt + constants?.court.inflationPeriodBlocks;

      return {
        total: toMs(time, {
          start: 0,
          end: constants?.court.inflationPeriodBlocks,
        }),
        left: toMs(time, { start: time?.block, end: canExitAt }),
      };
    }

    return null;
  }, [time, participant, constants]);

  const canExit = !Boolean(cooldownTime?.left && cooldownTime?.left > 0);

  const percentage = cooldownTime
    ? 100 - (cooldownTime?.left / cooldownTime?.total) * 100
    : null;

  return (
    <>
      <button
        className={`rounded-md ${
          canExit ? "bg-[#670031]" : "bg-gray-400"
        }  px-4 py-2 text-white ${className}`}
        onClick={() => setIsOpen(true)}
        disabled={!canExit}
      >
        <div className="flex items-center justify-center gap-1">
          <span>{canExit ? "Exit" : "Preparing to exit"}</span>
          {!canExit && (
            <span className="text-xs text-gray-500">
              ({moment.duration(cooldownTime?.left).humanize()} left)
            </span>
          )}
        </div>
        {!canExit && (
          <div className="mb-1 w-full">
            <div className="h-[3px] w-full rounded-lg bg-gray-100 bg-opacity-25">
              <div
                className={`h-full rounded-lg bg-blue-400 transition-all`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        )}
      </button>
      <Modal open={isOpen} onClose={() => setIsOpen(false)}>
        <Dialog.Panel className="w-full max-w-[564px] rounded-[10px] bg-white p-[30px]">
          <h3 className="mb-8">Exit Court</h3>
          <div className="mb-3 flex flex-col">
            <div className="flex">
              <div className="mr-auto">Stake:</div>
              <div>
                {participant?.stake.div(ZTG).toNumber()}{" "}
                {constants?.tokenSymbol}
              </div>
            </div>
          </div>
          <p className="mb-3 text-center text-sm text-gray-500">
            By confirming exit you will leave the court, your stake will be
            unlocked and moved back to your free balance.
          </p>
          <div className="mt-[20px] flex w-full flex-col items-center gap-8 text-ztg-18-150 font-semibold">
            <div className="center mb-[10px] text-ztg-12-120 font-normal text-ztg-primary-600">
              <span className="ml-1 text-black">
                Network Fee: {fee ? fee.amount.div(ZTG).toFixed(3) : 0}{" "}
                {fee?.symbol}
              </span>
            </div>
            <TransactionButton
              className="w-full max-w-[250px]"
              disabled={isLeaveLoading}
              onClick={() => leaveCourt()}
            >
              Confirm Exit
            </TransactionButton>
          </div>
        </Dialog.Panel>
      </Modal>
    </>
  );
};

export default CourtExitButton;
