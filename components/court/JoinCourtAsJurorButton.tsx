import { Dialog } from "@headlessui/react";
import { useQueryClient } from "@tanstack/react-query";
import { isRpcSdk, ZTG } from "@zeitgeistpm/sdk";
import FormTransactionButton from "components/ui/FormTransactionButton";
import InfoPopover from "components/ui/InfoPopover";
import Input from "components/ui/Input";
import Modal from "components/ui/Modal";
import Decimal from "decimal.js";
import { useConnectedCourtParticipant } from "lib/hooks/queries/court/useConnectedCourtParticipant";
import { courtParticipantsRootKey } from "lib/hooks/queries/court/useCourtParticipants";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useZtgBalance } from "lib/hooks/queries/useZtgBalance";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { IoIosInformation, IoIosWarning } from "react-icons/io";

const JoinCourtAsJurorButton = ({ className }: { className?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { data: constants } = useChainConstants();
  const {
    register,
    handleSubmit,
    getValues,
    formState,
    watch,
    setValue,
    trigger,
  } = useForm({
    reValidateMode: "onChange",
    mode: "onChange",
  });
  const [sdk, id] = useSdkv2();
  const notificationStore = useNotifications();
  const wallet = useWallet();
  const { data: freeZtgBalance } = useZtgBalance(wallet.realAddress);
  const connectedParticipant = useConnectedCourtParticipant();
  const queryClient = useQueryClient();

  const balance = useMemo(() => {
    return new Decimal(freeZtgBalance ?? 0).plus(
      connectedParticipant?.stake ?? 0,
    );
  }, [freeZtgBalance, connectedParticipant?.stake]);

  const { isLoading, send, fee } = useExtrinsic(
    () => {
      const amount = getValues("amount");
      if (!isRpcSdk(sdk) || !amount) return;

      return sdk.api.tx.court.joinCourt(
        new Decimal(amount).mul(ZTG).toFixed(0),
      );
    },
    {
      onSuccess: () => {
        notificationStore.pushNotification(
          "Successfully joined court as juror.",
          {
            type: "Success",
          },
        );
        queryClient.invalidateQueries([id, courtParticipantsRootKey]);
        setIsOpen(false);
      },
    },
  );

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      const changedByUser = type != null;

      if (!changedByUser || !balance) return;

      if (name === "percentage") {
        setValue(
          "amount",
          balance.mul(value.percentage).div(100).div(ZTG).toNumber(),
        );
      } else if (name === "amount" && value.amount !== "") {
        setValue(
          "percentage",
          new Decimal(value.amount).mul(ZTG).div(balance).mul(100).toString(),
        );
      }
      trigger("amount");
    });
    return () => subscription.unsubscribe();
  }, [watch, balance]);

  const onSubmit = () => {
    send();
  };

  return (
    <>
      <div className="relative">
        <button
          disabled={isLoading}
          className={`rounded-md bg-[#670031] px-4 py-2 text-white transition-all  ${
            connectedParticipant?.type === "Delegator" &&
            "ring-2 ring-orange-500"
          } ${className}`}
          onClick={() => setIsOpen(true)}
        >
          {connectedParticipant?.type === "Juror"
            ? "Set Personal Stake"
            : "Become a Juror"}
        </button>
        {connectedParticipant?.type === "Delegator" && (
          <div className="absolute right-0 top-0 translate-x-[50%] translate-y-[-50%] rounded-full bg-orange-500 p-[0.5]">
            <InfoPopover
              overlay={false}
              position="top-end"
              popoverCss="-ml-12"
              icon={<IoIosInformation className="text-white" />}
            >
              You are currently delegating to other jurors. If you join the
              court as a juror, your delegations will be removed and delegated
              to your personal juror stake.
            </InfoPopover>
          </div>
        )}
      </div>

      <Modal open={isOpen} onClose={() => setIsOpen(false)}>
        <Dialog.Panel className="w-full max-w-[462px] rounded-[10px] bg-white p-[30px]">
          <h3 className="mb-4">
            {connectedParticipant?.type === "Juror"
              ? "Set Personal Stake"
              : "Become a Juror"}
          </h3>

          <div className="mt-[20px] flex w-full flex-col items-center gap-8 text-ztg-18-150 font-semibold">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="flex w-full flex-col items-center"
            >
              <div className="center relative h-[56px] w-full bg-anti-flash-white text-ztg-18-150 font-normal">
                <Input
                  type="number"
                  className="w-full bg-transparent !text-center outline-none"
                  step="any"
                  {...register("amount", {
                    value: 0,
                    required: {
                      value: true,
                      message: "Value is required",
                    },
                    validate: (value) => {
                      if (value > (balance?.div(ZTG).toNumber() ?? 0)) {
                        return `Insufficient balance. Current balance: ${balance
                          ?.div(ZTG)
                          .toFixed(3)}`;
                      } else if (value <= 0) {
                        return "Value cannot be zero or less";
                      } else if (
                        constants?.court.minJurorStake &&
                        value < constants?.court.minJurorStake
                      ) {
                        return `Stake cannot be less than ${constants?.court.minJurorStake} ${constants.tokenSymbol}`;
                      } else if (
                        connectedParticipant?.stake &&
                        connectedParticipant?.stake.div(ZTG).greaterThan(value)
                      ) {
                        return `Stake must exceed your current stake of ${connectedParticipant?.stake
                          .div(ZTG)
                          .toNumber()
                          .toFixed(3)} ${constants?.tokenSymbol}`;
                      }
                    },
                  })}
                />
                <div className="absolute right-0 mr-[10px]">
                  {constants?.tokenSymbol}
                </div>
              </div>

              <input
                className="mb-[10px] mt-[30px] w-full"
                type="range"
                disabled={!balance || balance.lessThanOrEqualTo(0)}
                {...register("percentage", { value: "0" })}
              />

              {connectedParticipant?.type === "Juror" && (
                <div className="relative mb-5 mt-4 w-full rounded-lg bg-provincial-pink p-5 text-sm font-normal">
                  This will set the new staked amount.
                </div>
              )}

              <div className="my-[4px] mb-5 h-[16px] text-center text-ztg-12-120 text-vermilion">
                <>{formState.errors["amount"]?.message}</>
              </div>

              {connectedParticipant?.type === "Delegator" && (
                <div className="relative mb-5 w-full rounded-lg bg-provincial-pink p-5 text-sm font-normal">
                  You are currently delegating to other jurors. If you join the
                  court as a juror, your delegations will be removed and stake
                  will be moved to your personal stake.
                  <IoIosWarning
                    size={24}
                    className="absolute left-[50%] top-0 translate-x-[-50%] translate-y-[-50%] text-orange-700"
                  />
                </div>
              )}

              <div className="center mb-[10px] text-ztg-12-120 font-normal text-sky-600">
                <span className="ml-1 text-black">
                  Network Fee: {fee ? fee.amount.div(ZTG).toFixed(3) : 0}{" "}
                  {fee?.symbol}
                </span>
              </div>

              <FormTransactionButton
                className="w-full max-w-[250px]"
                disabled={formState.isValid === false || isLoading}
              >
                {connectedParticipant?.type === "Juror"
                  ? "Set Stake"
                  : "Join as Juror"}
              </FormTransactionButton>
            </form>
          </div>
        </Dialog.Panel>
      </Modal>
    </>
  );
};

export default JoinCourtAsJurorButton;
