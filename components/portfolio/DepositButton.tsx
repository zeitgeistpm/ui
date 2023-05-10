import { Dialog } from "@headlessui/react";
import { isRpcSdk, sdk, ZTG } from "@zeitgeistpm/sdk-next";
import FormTransactionButton from "components/ui/FormTransactionButton";
import Modal from "components/ui/Modal";
import TransactionButton from "components/ui/TransactionButton";
import Decimal from "decimal.js";
import { CHAINS } from "lib/constants/chains";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useNotifications } from "lib/state/notifications";
import { useState } from "react";
import { ArrowRight } from "react-feather";
import { useForm } from "react-hook-form";

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

  const notificationStore = useNotifications();
  const { send: transfer, isLoading } = useExtrinsic(
    () => {
      if (isRpcSdk(sdk)) {
        const formValue = getValues();
        const amount = formValue.amount;

        const chain = CHAINS.find((chain) => chain.name === sourceChain);
        console.log(chain);
        //todo: lookup chain
        // const tx = chain.createDepositExtrinsic()

        // return sdk.api.tx.xTokens.transfer();
        return sdk.api.tx.utility.batch([]);
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
    console.log(getValues());
  };
  return (
    <Dialog.Panel className="w-full max-w-[462px] rounded-[10px] bg-white p-[30px]">
      <h3>Deposit</h3>
      <div className="flex flex-col w-full items-center gap-8 mt-[20px] text-ztg-18-150 font-semibold">
        <div className="flex gap-4">
          <div>{sourceChain}</div>
          <ArrowRight />
          <div>Zeitgeist</div>
        </div>
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
            Confirm Deposit
          </FormTransactionButton>
        </form>
      </div>
    </Dialog.Panel>
  );
};

export default DepositButton;
