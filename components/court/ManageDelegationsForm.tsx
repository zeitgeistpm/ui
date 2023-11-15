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
import { useLockedBalance } from "lib/hooks/queries/useBalance";
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
  const { data: freeBalance } = useZtgBalance(wallet.realAddress);
  const { data: lockedBalance } = useLockedBalance(wallet.realAddress, {
    Ztg: null,
  });

  const availableDelegationBalance = new Decimal(
    freeBalance?.toString() ?? 0,
  ).add(lockedBalance ?? 0);

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

      if (!changedByUser || !availableDelegationBalance) return;

      if (name === "percentage") {
        setValue(
          "amount",
          availableDelegationBalance
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
            .div(availableDelegationBalance)
            .mul(100)
            .toString(),
        );
      }
      trigger("amount");
    });
    return () => subscription.unsubscribe();
  }, [watch, availableDelegationBalance]);

  const onSubmit = () => {
    send();
  };

  const jurors = participants?.filter(
    (p) => p.type === "Juror" && p.address !== connectedParticipant?.address,
  );

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full flex-col items-center"
    >
      <div className="center relative h-[56px] w-full bg-anti-flash-white text-ztg-18-150 font-normal">
        <Input
          type="number"
          className="w-full bg-transparent !text-center outline-none"
          step="any"
          {...register("amount", {
            value: 0,
            valueAsNumber: true,
            required: {
              value: true,
              message: "Value is required",
            },
            validate: (value) => {
              if (
                value > (availableDelegationBalance?.div(ZTG).toNumber() ?? 0)
              ) {
                return `Insufficient balance. Current balance: ${availableDelegationBalance
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

        <div className="absolute right-0 mr-[10px]">
          {constants?.tokenSymbol}
        </div>
      </div>

      <input
        className="mb-10 mt-[30px] w-full"
        type="range"
        disabled={
          !availableDelegationBalance ||
          availableDelegationBalance.lessThanOrEqualTo(0)
        }
        {...register("percentage", { value: "0" })}
      />

      <div className="subtle-scroll-bar max-h-[400px] w-full overflow-y-scroll">
        <div className="mb-2 flex items-center text-sm">
          <h3 className="flex-1 text-base">Juror</h3>
          <h3 className="text-xs">Delegated</h3>
        </div>
        {jurors &&
          jurors.map((juror) => (
            <div key={juror.address} className="mb-2 flex text-left">
              <div className="flex flex-1 items-center gap-3">
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

      <div className="my-[4px] mb-5 h-[16px] text-center text-ztg-12-120 text-vermilion">
        <>
          {formState.errors["amount"]?.message ||
            formState.errors["delegates"]?.message}
        </>
      </div>

      <div className="center mb-[10px] text-ztg-12-120 font-normal text-sky-600">
        <span className="ml-1 text-black">
          Network Fee: {fee ? fee.amount.div(ZTG).toFixed(3) : 0} {fee?.symbol}
        </span>
      </div>

      {connectedParticipant?.type === "Juror" && (
        <div className="mb-5 w-full rounded-lg bg-provincial-pink p-5 text-sm font-normal">
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
