import { Dialog } from "@headlessui/react";
import { ZTG } from "@zeitgeistpm/sdk-next";
import FormTransactionButton from "components/ui/FormTransactionButton";
import Modal from "components/ui/Modal";
import Decimal from "decimal.js";
import { CHAINS } from "lib/constants/chains";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useExtrinsicFee } from "lib/hooks/queries/useExtrinsicFee";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useCrossChainApis } from "lib/state/cross-chain";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { useState } from "react";
import { useForm } from "react-hook-form";
import Transfer from "./Transfer";

const DepositButton = ({
  sourceChain,
  tokenSymbol,
  balance,
}: {
  sourceChain: string;
  tokenSymbol: string;
  balance: Decimal;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        className="border-gray-300 text-sm border-2 rounded-full py-2 w-[110px] mr-2"
        onClick={() => setIsOpen(true)}
      >
        Deposit
      </button>
      <Modal open={isOpen} onClose={() => setIsOpen(false)}>
        <DepositModal
          sourceChain={sourceChain}
          tokenSymbol={tokenSymbol}
          balance={balance}
        />
      </Modal>
    </>
  );
};

const DepositModal = ({
  sourceChain,
  tokenSymbol,
  balance,
}: {
  sourceChain: string;
  tokenSymbol: string;
  balance: Decimal;
}) => {
  const { register, handleSubmit, getValues, formState } = useForm({
    reValidateMode: "onChange",
    mode: "onChange",
  });
  const { apis } = useCrossChainApis();
  const { data: constants } = useChainConstants();
  const notificationStore = useNotifications();
  const wallet = useWallet();
  const chain = CHAINS.find((chain) => chain.name === sourceChain);
  const api = apis[chain.name];
  const { data: fee } = useExtrinsicFee(
    chain.createDepositExtrinsic(
      api,
      wallet.activeAccount.address,
      "10000000000",
      constants.parachainId,
    ),
  );

  const { send: transfer, isLoading } = useExtrinsic(
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
    {
      onSuccess: () => {
        notificationStore.pushNotification(
          `Deposited ${tokenSymbol} to Zeitgeist`,
          {
            type: "Success",
          },
        );
      },
    },
  );

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
          <div className="text-vermilion text-ztg-12-120 my-[4px] h-[16px]">
            <>{formState.errors["amount"]?.message}</>
          </div>
          <div className="center font-normal text-ztg-12-120 mb-[10px] text-sky-600">
            {sourceChain} fee:
            <span className="text-black ml-1">
              {new Decimal(fee?.partialFee.toString() ?? 0).div(ZTG).toFixed(3)}
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
