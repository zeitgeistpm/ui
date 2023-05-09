import { Dialog } from "@headlessui/react";
import { isRpcSdk, sdk } from "@zeitgeistpm/sdk-next";
import FormTransactionButton from "components/ui/FormTransactionButton";
import Modal from "components/ui/Modal";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useNotifications } from "lib/state/notifications";
import { useState } from "react";
import { ArrowRight } from "react-feather";
import { useForm } from "react-hook-form";

const WithdrawButton = ({ toChain, tokenSymbol, balance }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Withdraw</button>
      <Modal open={isOpen} onClose={() => setIsOpen(false)}>
        <WithdrawModal
          toChain={toChain}
          tokenSymbol={tokenSymbol}
          balance={balance}
        />
      </Modal>
    </>
  );
};

const WithdrawModal = ({ toChain, tokenSymbol, balance }) => {
  const { register, handleSubmit, getValues, formState } = useForm({
    reValidateMode: "onChange",
    mode: "all",
  });
  console.log("withdraw");

  const notificationStore = useNotifications();
  const { send: transfer, isLoading } = useExtrinsic(
    () => {
      if (isRpcSdk(sdk)) {
        const formValue = getValues();
        formValue.amount;

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
      <h3>Withdraw</h3>
      <div className="flex flex-col w-full items-center gap-8 mt-[20px] text-ztg-18-150 font-semibold">
        <div className="flex gap-4">
          <div>Zeitgeist</div>
          <ArrowRight />
          <div>{toChain}</div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="h-[56px] bg-anti-flash-white center text-ztg-18-150 relative font-normal">
            <input
              {...register("amount", {
                value: 0,
                required: {
                  value: true,
                  message: "Value is required",
                },
                validate: (value) => {
                  if (value > balance) {
                    return `Insufficient balance. Current balance: ${balance.toFixed(
                      3,
                    )}`;
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
