import { Dialog } from "@headlessui/react";
import type { ApiPromise } from "@polkadot/api";
import { isRpcSdk } from "@zeitgeistpm/sdk-next";
import FormTransactionButton from "components/ui/FormTransactionButton";
import Modal from "components/ui/Modal";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Transfer from "./Transfer";

const WithdrawButton = ({ toChain, tokenSymbol, balance, foreignAssetId }) => {
  const [isOpen, setIsOpen] = useState(false);

  const { data: metadata } = useAssetMetadata({ ForeignAsset: foreignAssetId });

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Withdraw</button>
      <Modal open={isOpen} onClose={() => setIsOpen(false)}>
        <WithdrawModal
          toChain={toChain}
          tokenSymbol={tokenSymbol}
          balance={balance}
          foreignAssetId={foreignAssetId}
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
    interior: { X1: { AccountId32: { id: accountId, network: "Any" } } },
  };

  return api.tx.xTokens.transfer(
    { ForeignAsset: foreignAssetId },
    amount,
    { V1: account },
    "100000000000",
  );
};

const WithdrawModal = ({ toChain, tokenSymbol, balance, foreignAssetId }) => {
  const { register, handleSubmit, getValues, formState } = useForm({
    reValidateMode: "onChange",
    mode: "all",
  });

  const notificationStore = useNotifications();
  const wallet = useWallet();

  const [sdk] = useSdkv2();
  const { send: transfer, isLoading } = useExtrinsic(
    () => {
      if (isRpcSdk(sdk)) {
        const formValue = getValues();
        const amount = formValue.amount;

        const tx = createWithdrawExtrinsic(
          sdk.api,
          new Decimal(amount).mul(ZTG).toFixed(0),
          wallet.activeAccount.address,
          foreignAssetId,
        );
        return tx;
      }
    },
    {
      onSuccess: () => {
        notificationStore.pushNotification("Joined pool", {
          type: "Success",
        });
      },
    },
  );

  const onSubmit = () => {
    transfer();
  };

  return (
    <Dialog.Panel className="w-full max-w-[462px] rounded-[10px] bg-white p-[30px]">
      <h3>Withdraw</h3>
      <div className="flex flex-col w-full items-center gap-8 mt-[20px] text-ztg-18-150 font-semibold">
        <Transfer sourceChain="Zeitgeist" destinationChain={toChain} />
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="h-[56px] bg-anti-flash-white center text-ztg-18-150 relative font-normal">
            <input
              {...register("amount", {
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
              })}
              type="number"
              className="w-full bg-transparent outline-none !text-center"
            />
            <div className="mr-[10px] absolute right-0">{tokenSymbol}</div>
          </div>
          <div className="text-vermilion text-ztg-12-120 mt-[4px]">
            <>{formState.errors["amount"]?.message}</>
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
