import { Dialog } from "@headlessui/react";
import { ZTG } from "@zeitgeistpm/sdk";
import FormTransactionButton from "components/ui/FormTransactionButton";
import Modal from "components/ui/Modal";
import SecondaryButton from "components/ui/SecondaryButton";
import Decimal from "decimal.js";
import { ChainName } from "lib/constants/chains";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useCrossChainExtrinsic } from "lib/hooks/useCrossChainExtrinsic";
import { useChain } from "lib/state/cross-chain";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { countDecimals } from "lib/util/count-decimals";
import { formatNumberCompact } from "lib/util/format-compact";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Transfer from "./Transfer";
import Input from "components/ui/Input";
import { convertDecimals } from "lib/util/convert-decimals";

const DepositButton = ({
  sourceChain,
  tokenSymbol,
  balance,
  sourceExistentialDeposit,
  assetDecimals,
  sourceAssetId,
}: {
  sourceChain: ChainName;
  tokenSymbol: string;
  balance: Decimal;
  sourceExistentialDeposit: Decimal;
  assetDecimals: number;
  sourceAssetId?: number;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <SecondaryButton onClick={() => setIsOpen(true)}>Transfer to Zeitgeist</SecondaryButton>
      <Modal open={isOpen} onClose={() => setIsOpen(false)}>
        <DepositModal
          sourceChain={sourceChain}
          tokenSymbol={tokenSymbol}
          balance={balance}
          assetDecimals={assetDecimals}
          sourceExistentialDeposit={sourceExistentialDeposit}
          onSuccess={() => setIsOpen(false)}
          sourceAssetId={sourceAssetId}
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
  sourceExistentialDeposit,
  assetDecimals,
  sourceAssetId,
}: {
  sourceChain: ChainName;
  tokenSymbol: string;
  balance: Decimal;
  sourceExistentialDeposit: Decimal;
  assetDecimals: number;
  onSuccess: () => void;
  sourceAssetId?: number;
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

  const fee = chain?.depositFee;
  const feeEstimate = fee?.mul(1.01) ?? 0; //add 1% buffer to fee
  //assumes source chain fee is paid in currency that is being transferred
  const maxTransferAmount = balance.minus(feeEstimate);

  const existentialDepositWarningThreshold = 0.1;

  const amount = getValues("amount");
  const amountDecimal: Decimal = amount
    ? convertDecimals(new Decimal(amount), 0, assetDecimals)
    : new Decimal(0);
  const remainingSourceBalance = balance
    .minus(amountDecimal)
    .minus(feeEstimate);

  const { send: transfer, isLoading } = useCrossChainExtrinsic(
    () => {
      if (!chain || !api || !wallet.realAddress || !constants) return;
      const tx = chain.createDepositExtrinsic(
        api,
        wallet.realAddress,
        amountDecimal.toFixed(0),
        constants.parachainId,
        sourceAssetId,
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

      if (name === "percentage") {
        setValue(
          "amount",
          maxTransferAmount.mul(value.percentage).div(100).div(ZTG).toNumber(),
        );
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
      trigger("amount");
    });
    return () => subscription.unsubscribe();
  }, [watch, balance, fee]);

  const onSubmit = () => {
    transfer();
  };

  return (
    <Dialog.Panel className="w-full max-w-[564px] rounded-[10px] bg-white p-[30px]">
      <h3 className="mb-8 text-center">Deposit</h3>
      <div className="mt-[20px] flex w-full flex-col items-center gap-8 text-ztg-18-150 font-semibold">
        <Transfer sourceChain={sourceChain} destinationChain="Zeitgeist" />
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex w-full flex-col items-center"
        >
          <div className="center relative h-[56px] w-full bg-anti-flash-white text-ztg-18-150 font-normal">
            <Controller
              render={(val) => {
                const { field } = val;
                return (
                  <Input
                    {...field}
                    type="number"
                    className="w-full bg-transparent !text-center outline-none"
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
                  if (maxTransferAmount.div(ZTG).lessThan(value)) {
                    return `Insufficient balance. Current balance: ${maxTransferAmount
                      .div(ZTG)
                      .toFixed(5)}`;
                  } else if (value <= 0) {
                    return "Value cannot be zero or less";
                  }
                },
              }}
            />
            <div className="absolute right-0 mr-[10px]">{tokenSymbol}</div>
          </div>
          <input
            className="mb-[10px] mt-[30px] w-full"
            type="range"
            disabled={maxTransferAmount.lessThanOrEqualTo(0)}
            {...register("percentage", { value: "0" })}
          />
          <div className="my-[4px] h-[16px] text-ztg-12-120 text-vermilion">
            <>{formState.errors["amount"]?.message}</>
            {!formState.errors["amount"]?.message &&
              remainingSourceBalance.lessThan(sourceExistentialDeposit) &&
              remainingSourceBalance
                .div(ZTG)
                .greaterThan(existentialDepositWarningThreshold) && (
                <>{`Warning! The remaining ${formatNumberCompact(
                  remainingSourceBalance.div(ZTG).toNumber(),
                )} ${tokenSymbol} on ${sourceChain} will be lost`}</>
              )}
          </div>
          <div className="center mb-[10px] text-ztg-12-120 font-normal text-sky-600">
            {sourceChain} fee:
            <span className="ml-1 text-black">
              {fee ? fee.div(ZTG).toFixed(3) : 0} {tokenSymbol}
            </span>
          </div>
          <FormTransactionButton
            loading={isLoading}
            className="w-full max-w-[250px]"
            disabled={formState.isValid === false || isLoading}
            disableFeeCheck={true}
          >
            Confirm Deposit
          </FormTransactionButton>
        </form>
      </div>
    </Dialog.Panel>
  );
};

export default DepositButton;
