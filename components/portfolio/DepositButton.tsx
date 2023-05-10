import { Dialog } from "@headlessui/react";
import { ZTG } from "@zeitgeistpm/sdk-next";
import FormTransactionButton from "components/ui/FormTransactionButton";
import Modal from "components/ui/Modal";
import Decimal from "decimal.js";
import { CHAINS } from "lib/constants/chains";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
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
      <button onClick={() => setIsOpen(true)}>Deposit</button>
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
    mode: "all",
  });
  const { apis } = useCrossChainApis();
  const { data: constants } = useChainConstants();
  const notificationStore = useNotifications();
  const wallet = useWallet();

  const { send: transfer, isLoading } = useExtrinsic(
    () => {
      const formValue = getValues();
      const amount = formValue.amount;

      const chain = CHAINS.find((chain) => chain.name === sourceChain);

      const api = apis[chain.name];

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
        notificationStore.pushNotification("Joined pool", {
          type: "Success",
        });
      },
    },
  );

  const onSubmit = () => {
    console.log("submit");

    transfer();
  };
  return (
    <Dialog.Panel className="w-full max-w-[462px] rounded-[10px] bg-white p-[30px]">
      <h3>Deposit</h3>
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
          <div className="text-vermilion text-ztg-12-120 my-[4px] h-[20px]">
            <>{formState.errors["amount"]?.message}</>
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
