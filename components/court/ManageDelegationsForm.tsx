import { useQueryClient } from "@tanstack/react-query";
import { isRpcSdk, ZTG } from "@zeitgeistpm/sdk";
import Avatar from "components/ui/Avatar";
import FormTransactionButton from "components/ui/FormTransactionButton";
import Input from "components/ui/Input";
import Decimal from "decimal.js";
import { useConnectedCourtParticipant } from "lib/hooks/queries/court/useConnectedCourtParticipant";
import {
  participantsRootKey,
  useParticipants,
} from "lib/hooks/queries/court/useParticipants";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useZtgBalance } from "lib/hooks/queries/useZtgBalance";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { shortenAddress } from "lib/util";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

export type ManageDelegationsFormProps = {
  onSuccessfulSubmit?: () => void;
};

//TODO: can restake same amount.
//TODO: max 5 delegations

const ManageDelegationsForm = (props: ManageDelegationsFormProps) => {
  const { data: constants } = useChainConstants();

  const { data: participants } = useParticipants();
  const connectedParticipant = useConnectedCourtParticipant();

  const {
    register,
    handleSubmit,
    getValues,
    formState,
    watch,
    setValue,
    trigger,
    reset,
  } = useForm<{
    amount: number;
    percentage: string;
    delegates: string[];
  }>({
    reValidateMode: "onChange",
    mode: "onChange",
    defaultValues: {
      delegates: connectedParticipant?.delegations,
      amount: connectedParticipant?.stake?.div(ZTG).toNumber(),
    },
  });

  const [sdk, id] = useSdkv2();
  const notificationStore = useNotifications();
  const wallet = useWallet();
  const { data: balance } = useZtgBalance(wallet.realAddress);

  const queryClient = useQueryClient();

  const { isLoading, send, fee } = useExtrinsic(
    () => {
      const amount = getValues("amount");
      const delegates = getValues("delegates");

      if (!isRpcSdk(sdk) || !amount) return;

      return sdk.api.tx.court.delegate(
        new Decimal(amount).mul(ZTG).toFixed(0),
        delegates,
      );
    },
    {
      onSuccess: () => {
        notificationStore.pushNotification(
          "Successfully delegated stake to jurors.",
          {
            type: "Success",
          },
        );
        queryClient.invalidateQueries([id, participantsRootKey]);
        props.onSuccessfulSubmit?.();
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
          balance
            .mul(value.percentage ?? 0)
            .div(100)
            .div(ZTG)
            .toNumber(),
        );
      } else if (name === "amount") {
        setValue(
          "percentage",
          new Decimal(value.amount ?? 0)
            .mul(ZTG)
            .div(balance)
            .mul(100)
            .toString(),
        );
      }
      trigger("amount");
    });
    return () => subscription.unsubscribe();
  }, [watch, balance]);

  const onSubmit = () => {
    send();
  };
  console.log({ participants });
  const jurors = participants?.filter(
    (p) => p.type === "Juror" && p.address !== connectedParticipant?.address,
  );

  return (
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
            valueAsNumber: true,
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
        className="mt-[30px] mb-10 w-full"
        type="range"
        disabled={!balance || balance.lessThanOrEqualTo(0)}
        {...register("percentage", { value: "0" })}
      />

      <div className="w-full max-h-[400px] overflow-y-scroll subtle-scroll-bar">
        <div className="flex mb-2 text-sm items-center">
          <h3 className="flex-1 text-base">Juror</h3>
          <h3 className="text-xs">Delegated</h3>
        </div>
        {jurors &&
          jurors.map((juror) => (
            <div key={juror.address} className="text-left mb-2 flex">
              <div className="flex items-center gap-3 flex-1">
                <Avatar address={juror.address} size={18} />
                <div className="text-sm font-medium">
                  {shortenAddress(juror.address)}
                </div>
              </div>
              <input
                type={"checkbox"}
                {...register("delegates", {
                  validate: (delegates) => {
                    if (delegates?.length === 0) {
                      return "At least one juror must be selected for delegation.";
                    }
                    if (delegates?.length > 5) {
                      return "Maximum of 5 jurors can be selected for delegation.";
                    }
                  },
                })}
                value={juror.address}
              />
            </div>
          ))}
      </div>

      <div className="text-vermilion text-center mb-5 text-ztg-12-120 my-[4px] h-[16px]">
        <>
          {formState.errors["amount"]?.message ||
            formState.errors["delegates"]?.message}
        </>
      </div>

      <div className="center font-normal text-ztg-12-120 mb-[10px] text-sky-600">
        <span className="text-black ml-1">
          Network Fee: {fee ? fee.amount.div(ZTG).toFixed(3) : 0} {fee?.symbol}
        </span>
      </div>

      {connectedParticipant?.type === "Juror" && (
        <div className="rounded-lg p-5 mb-5 bg-provincial-pink text-sm w-full font-normal">
          You are currently a juror. If you delegate to other jurors your stake
          will be removed from your personal stake and delegated evenly across
          your selected jurors. You will not be a juror after this action.
        </div>
      )}

      <FormTransactionButton
        className="w-full max-w-[250px]"
        disabled={formState.isValid === false || isLoading}
      >
        Delegate Stake
      </FormTransactionButton>
    </form>
  );
};

export default ManageDelegationsForm;
