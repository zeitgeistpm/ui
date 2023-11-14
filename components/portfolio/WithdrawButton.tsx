import { Dialog } from "@headlessui/react";
import type { ApiPromise } from "@polkadot/api";
import { isRpcSdk } from "@zeitgeistpm/sdk";
import FormTransactionButton from "components/ui/FormTransactionButton";
import Modal from "components/ui/Modal";
import SecondaryButton from "components/ui/SecondaryButton";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { ChainName } from "lib/constants/chains";
import { useExtrinsicFee } from "lib/hooks/queries/useExtrinsicFee";
import { useCrossChainExtrinsic } from "lib/hooks/useCrossChainExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useChain } from "lib/state/cross-chain";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { countDecimals } from "lib/util/count-decimals";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Transfer from "./Transfer";
import Input from "components/ui/Input";
import { convertDecimals } from "lib/util/convert-decimals";
import { formatNumberCompact } from "lib/util/format-compact";

const WithdrawButton = ({
  toChain,
  tokenSymbol,
  balance,
  foreignAssetId,
  destinationExistentialDeposit,
  destinationTokenBalance,
  assetDecimals,
}: {
  toChain: ChainName;
  tokenSymbol: string;
  balance: Decimal;
  foreignAssetId: number;
  destinationExistentialDeposit: Decimal;
  destinationTokenBalance: Decimal;
  assetDecimals: number;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <SecondaryButton onClick={() => setIsOpen(true)}>
        Withdraw
      </SecondaryButton>
      <Modal open={isOpen} onClose={() => setIsOpen(false)}>
        <WithdrawModal
          toChain={toChain}
          tokenSymbol={tokenSymbol}
          balance={balance}
          foreignAssetId={foreignAssetId}
          destinationExistentialDeposit={destinationExistentialDeposit}
          destinationTokenBalance={destinationTokenBalance}
          assetDecimals={assetDecimals}
          onSuccess={() => setIsOpen(false)}
        />
      </Modal>
    </>
  );
};

const createWithdrawExtrinsic = (
  api: ApiPromise,
  amount: string,
  address: string,
  foreignAssetId: number,
) => {
  const accountId = api.createType("AccountId32", address).toHex();

  const account = {
    parents: 1,
    interior: { X1: { AccountId32: { id: accountId } } },
  };
  const destWeightLimit = { Unlimited: null };

  return api.tx.xTokens.transfer(
    { ForeignAsset: foreignAssetId },
    amount,
    { V3: account },
    // { Limited: "100000000000" },
    destWeightLimit,
  );
};
const WithdrawModal = ({
  toChain,
  tokenSymbol,
  balance,
  foreignAssetId,
  onSuccess,
  destinationExistentialDeposit,
  destinationTokenBalance,
  assetDecimals,
}: {
  toChain: ChainName;
  tokenSymbol: string;
  balance: Decimal;
  foreignAssetId: number;
  destinationExistentialDeposit: Decimal;
  destinationTokenBalance: Decimal;
  assetDecimals: number;
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

  const notificationStore = useNotifications();
  const wallet = useWallet();
  const [sdk] = useSdkv2();
  const { chain } = useChain(toChain);

  const { data: fee } = useExtrinsicFee(
    isRpcSdk(sdk) && wallet.activeAccount
      ? createWithdrawExtrinsic(
          sdk.api,
          "100000000000",
          wallet.activeAccount.address,
          foreignAssetId,
        )
      : undefined,
  );
  const amount = getValues("amount");
  const amountDecimal: Decimal = amount
    ? convertDecimals(new Decimal(amount), 0, assetDecimals)
    : new Decimal(0);

  const { send: transfer, isLoading } = useCrossChainExtrinsic(
    () => {
      if (isRpcSdk(sdk) && wallet.realAddress) {
        const tx = createWithdrawExtrinsic(
          sdk.api,
          amountDecimal.toFixed(0),
          wallet.realAddress,
          foreignAssetId,
        );
        return tx;
      }
    },
    "Zeitgeist",
    toChain,
    {
      onSourceSuccess: () => {
        notificationStore.pushNotification(
          `Moving ${tokenSymbol} to ${toChain}`,
          {
            type: "Info",
            autoRemove: true,
          },
        );
      },
      onDestinationSuccess: () => {
        notificationStore.pushNotification(
          `Successfully moved ${tokenSymbol} to ${toChain}`,
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
  }, [watch]);

  const onSubmit = () => {
    transfer();
  };

  return (
    <Dialog.Panel className="w-full max-w-[462px] rounded-[10px] bg-white p-[30px]">
      <h3 className="mb-8 text-center">Withdraw</h3>
      <div className="mt-[20px] flex w-full flex-col items-center gap-8 text-ztg-18-150 font-semibold">
        <Transfer destinationChain={toChain} sourceChain="Zeitgeist" />
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex w-full flex-col items-center"
        >
          <div className="center relative h-[56px] w-full bg-anti-flash-white text-ztg-18-150 font-normal">
            <Controller
              render={({ field }) => {
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
                //todo: validate transfer where fee is paid in same asset as the one being transferred
                validate: (value) => {
                  if (balance.div(ZTG).lessThan(value)) {
                    return `Insufficient balance. Current balance: ${balance
                      .div(ZTG)
                      .toFixed(3)}`;
                  } else if (value <= 0) {
                    return "Value cannot be zero or less";
                  } else if (
                    destinationTokenBalance
                      .plus(
                        convertDecimals(new Decimal(value), 0, assetDecimals),
                      )
                      .lessThan(destinationExistentialDeposit)
                  ) {
                    return `Balance on ${toChain} must be greater than ${destinationExistentialDeposit.div(
                      ZTG,
                    )} ${tokenSymbol}`;
                  }
                },
              }}
            />
            <div className="absolute right-0 mr-[10px]">{tokenSymbol}</div>
          </div>
          <input
            className="mb-[10px] mt-[30px] w-full"
            type="range"
            {...register("percentage", { value: "0" })}
          />
          <div className="my-[4px] h-[16px] text-ztg-12-120 text-vermilion">
            <>{formState.errors["amount"]?.message}</>
          </div>
          <div className="center mb-[16px] text-ztg-12-120 font-normal text-sky-600">
            Zeitgeist fee:
            {fee && (
              <span className="ml-1 text-black">
                {formatNumberCompact(fee.amount.div(ZTG).toNumber())}{" "}
                {fee.symbol}
              </span>
            )}
          </div>
          <div className="center mb-[10px] text-ztg-12-120 font-normal text-sky-600">
            {toChain} fee:
            <span className="ml-1 text-black">{chain?.withdrawFee}</span>
          </div>
          <FormTransactionButton
            className="w-full max-w-[250px]"
            disabled={formState.isValid === false || isLoading}
          >
            Confirm Withdraw
          </FormTransactionButton>
        </form>
      </div>
    </Dialog.Panel>
  );
};

export default WithdrawButton;
