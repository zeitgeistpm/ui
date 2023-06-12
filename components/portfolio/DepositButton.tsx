import { Dialog } from "@headlessui/react";
import { ZTG } from "@zeitgeistpm/sdk-next";
import FormTransactionButton from "components/ui/FormTransactionButton";
import Modal from "components/ui/Modal";
import SecondaryButton from "components/ui/SecondaryButton";
import Decimal from "decimal.js";
import { ChainName } from "lib/constants/chains";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useExtrinsicFee } from "lib/hooks/queries/useExtrinsicFee";
import { useCrossChainExtrinsic } from "lib/hooks/useCrossChainExtrinsic";
import { useChain } from "lib/state/cross-chain";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { countDecimals } from "lib/util/count-decimals";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Transfer from "./Transfer";

const DepositButton = ({
  sourceChain,
  tokenSymbol,
  balance,
}: {
  sourceChain: ChainName;
  tokenSymbol: string;
  balance: Decimal;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <SecondaryButton onClick={() => setIsOpen(true)}>Deposit</SecondaryButton>
      <Modal open={isOpen} onClose={() => setIsOpen(false)}>
        <DepositModal
          sourceChain={sourceChain}
          tokenSymbol={tokenSymbol}
          balance={balance}
          onSuccess={() => setIsOpen(false)}
        />
      </Modal>
    </>
  );
};

const DepositModal = ({
  sourceChain,
  tokenSymbol,
  balance,
  onSuccess,
}: {
  sourceChain: ChainName;
  tokenSymbol: string;
  balance: Decimal;
  onSuccess: () => void;
}) => {
  const {
    register,
    handleSubmit,
    getValues,
    formState,
    watch,
    setValue,
    control,
    trigger,
  } = useForm({
    reValidateMode: "onChange",
    mode: "onChange",
  });
  const { data: constants } = useChainConstants();
  const notificationStore = useNotifications();
  const wallet = useWallet();
  const { chain, api } = useChain(sourceChain);

  const { data: fee } = useExtrinsicFee(
    chain.createDepositExtrinsic(
      api,
      wallet.activeAccount.address,
      "10000000000",
      constants.parachainId,
    ),
  );

  const { send: transfer, isLoading } = useCrossChainExtrinsic(
    () => {
      const formValue = getValues();
      const amount = formValue.amount;

      const tx = chain.createDepositExtrinsic(
        api,
        wallet.activeAccount.address,
        new Decimal(amount).mul(ZTG).toFixed(0),
        constants.parachainId,
      );
      return tx;
    },
    sourceChain,
    "Zeitgeist",
    {
      onSourceSuccess: () => {
        notificationStore.pushNotification(
          `Moving ${tokenSymbol} to Zeitgeist`,
          {
            type: "Info",
            autoRemove: true,
          },
        );
      },
      onDestinationSuccess: () => {
        notificationStore.pushNotification(
          `Successfully moved ${tokenSymbol} to Zeitgeist`,
          {
            type: "Success",
          },
        );
        onSuccess();
      },
    },
  );

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      const changedByUser = type != null;

      if (!changedByUser) return;

      //assumes source chain fee is paid in currency that is being transferred
      const maxTransferAmount = balance.minus(fee?.mul(1.01) ?? 0); //add 1% buffer to fee
      if (name === "percentage") {
        setValue(
          "amount",
          maxTransferAmount.mul(value.percentage).div(100).div(ZTG).toNumber(),
        );
        trigger("amount");
      } else if (name === "amount" && value.amount !== "") {
        setValue(
          "percentage",
          new Decimal(value.amount)
            .mul(ZTG)
            .div(maxTransferAmount)
            .mul(100)
            .toString(),
        );
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, balance, fee]);

  const onSubmit = () => {
    transfer();
  };

  return (
    <Dialog.Panel className="w-full max-w-[462px] rounded-[10px] bg-white p-[30px]">
      <h3 className="text-center mb-8">Deposit</h3>
      <div className="flex flex-col w-full items-center gap-8 mt-[20px] text-ztg-18-150 font-semibold">
        <Transfer sourceChain={sourceChain} destinationChain="Zeitgeist" />
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="w-full flex flex-col items-center"
        >
          <div className="h-[56px] bg-anti-flash-white center text-ztg-18-150 relative font-normal w-full">
            <Controller
              render={(val) => {
                const { field } = val;
                return (
                  <input
                    {...field}
                    type="number"
                    className="w-full bg-transparent outline-none !text-center"
                    step="any"
                    value={
                      countDecimals(field.value ? Number(field.value) : 0) > 3
                        ? Number(field.value).toFixed(3)
                        : field.value ?? 0
                    }
                  />
                );
              }}
              control={control}
              name="amount"
              rules={{
                required: {
                  value: true,
                  message: "Value is required",
                },
                validate: (value) => {
                  if (balance.div(ZTG).lessThan(value)) {
                    return `Insufficient balance. Current balance: ${balance
                      .div(ZTG)
                      .toFixed(3)}`;
                  } else if (value <= 0) {
                    return "Value cannot be zero or less";
                  }
                },
              }}
            />
            <div className="mr-[10px] absolute right-0">{tokenSymbol}</div>
          </div>
          <input
            className="mt-[30px] mb-[10px] w-full"
            type="range"
            {...register("percentage", { value: "0" })}
          />
          <div className="text-vermilion text-ztg-12-120 my-[4px] h-[16px]">
            <>{formState.errors["amount"]?.message}</>
          </div>
          <div className="center font-normal text-ztg-12-120 mb-[10px] text-sky-600">
            {sourceChain} fee:
            <span className="text-black ml-1">
              {fee ? fee.div(ZTG).toFixed(3) : 0} {tokenSymbol}
            </span>
          </div>
          <FormTransactionButton
            className="w-full max-w-[250px]"
            disabled={formState.isValid === false || isLoading}
          >
            Confirm Deposit
          </FormTransactionButton>
        </form>
      </div>
    </Dialog.Panel>
  );
};

export default DepositButton;
