import { Dialog } from "@headlessui/react";
import { useQueryClient } from "@tanstack/react-query";
import { isRpcSdk, ZTG } from "@zeitgeistpm/sdk";
import FormTransactionButton from "components/ui/FormTransactionButton";
import InfoPopover from "components/ui/InfoPopover";
import Input from "components/ui/Input";
import Modal from "components/ui/Modal";
import Decimal from "decimal.js";
import { useConnectedCourtParticipant } from "lib/hooks/queries/court/useConnectedCourtParticipant";
import { participantsRootKey } from "lib/hooks/queries/court/useParticipants";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useZtgBalance } from "lib/hooks/queries/useZtgBalance";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

const JoinCourtAsJurorButton = () => {
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
  const { data: balance } = useZtgBalance(wallet.realAddress);
  const connectedParticipant = useConnectedCourtParticipant();
  const queryClient = useQueryClient();

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
        queryClient.invalidateQueries([id, participantsRootKey]);
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
          className={`bg-[#670031] rounded-md text-white py-2 px-4 transition-all  ${
            connectedParticipant?.type === "Delegator" &&
            "ring-2 ring-orange-500"
          }`}
          onClick={() => setIsOpen(true)}
        >
          {connectedParticipant?.type === "Juror"
            ? "Increase Personal Stake"
            : "Become a Juror"}
        </button>
        {connectedParticipant?.type === "Delegator" && (
          <div className="absolute top-0 right-0 p-[0.5] rounded-full bg-orange-500 translate-x-[50%] translate-y-[-50%]">
            <InfoPopover
              overlay={false}
              className="text-white"
              position="top-end"
              popoverCss="-ml-12"
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
          <h3 className="mb-8">
            {connectedParticipant?.type === "Juror"
              ? "Increase Personal Stake"
              : "Become a Juror"}
          </h3>
          <div className="flex flex-col w-full items-center gap-8 mt-[20px] text-ztg-18-150 font-semibold">
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="w-full flex flex-col items-center"
            >
              <div className="h-[56px] bg-anti-flash-white center text-ztg-18-150 relative font-normal w-full">
                <Input
                  type="number"
                  className="w-full bg-transparent outline-none !text-center"
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

                <div className="mr-[10px] absolute right-0">
                  {constants?.tokenSymbol}
                </div>
              </div>

              <input
                className="mt-[30px] mb-[10px] w-full"
                type="range"
                disabled={!balance || balance.lessThanOrEqualTo(0)}
                {...register("percentage", { value: "0" })}
              />

              <div className="text-vermilion text-center mb-5 text-ztg-12-120 my-[4px] h-[16px]">
                <>{formState.errors["amount"]?.message}</>
              </div>

              <div className="center font-normal text-ztg-12-120 mb-[10px] text-sky-600">
                <span className="text-black ml-1">
                  Network Fee: {fee ? fee.amount.div(ZTG).toFixed(3) : 0}{" "}
                  {fee?.symbol}
                </span>
              </div>

              {connectedParticipant?.type === "Delegator" && (
                <div className="rounded-lg p-5 mb-5 bg-provincial-pink text-sm w-full font-normal">
                  You are currently delegating to other jurors. If you join the
                  court as a juror, your delegations will be removed and stake
                  will be moved to your personal stake.
                </div>
              )}

              <FormTransactionButton
                className="w-full max-w-[250px]"
                disabled={formState.isValid === false || isLoading}
              >
                {connectedParticipant?.type === "Juror"
                  ? "Increase Stake"
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
