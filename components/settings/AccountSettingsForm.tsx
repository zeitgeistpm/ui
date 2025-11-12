import React from "react";
import { useForm } from "react-hook-form";
import { isRpcSdk } from "@zeitgeistpm/sdk";
import FormTransactionButton from "components/ui/FormTransactionButton";
import { identityRootKey } from "lib/hooks/queries/useIdentity";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { appQueryClient } from "lib/query-client";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { UserIdentity } from "lib/types/user-identity";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { useExtrinsicFee } from "lib/hooks/queries/useExtrinsicFee";

export type AcccountSettingsFormProps = {
  identity: UserIdentity;
};

const AcccountSettingsForm: React.FC<AcccountSettingsFormProps> = ({
  identity,
}) => {
  const {
    register,
    reset,
    formState: { isValid, errors, isDirty },
    watch,
  } = useForm<{
    displayName: string;
    discord: string;
    twitter: string;
  }>({
    defaultValues: {
      displayName: identity.displayName ?? "",
      discord: identity.discord ?? "",
      twitter: identity.twitter ?? "",
    },
    mode: "all",
    reValidateMode: "onChange",
  });

  const wallet = useWallet();
  const address = wallet.activeAccount?.address;
  const [sdk, id] = useSdkv2();

  const notificationStore = useNotifications();

  const discordHandle = watch("discord");
  const twitterHandle = watch("twitter");
  const displayName = watch("displayName");

  const { data: constants } = useChainConstants();

  const indetityCost =
    constants?.identity?.basicDeposit ??
    0 + (constants?.identity?.fieldDeposit ?? 0);

  const isCleared =
    !identity?.displayName && !identity?.discord && !identity?.twitter;

  const { send: updateIdentity, isLoading: isUpdating } = useExtrinsic(
    () => {
      if (isRpcSdk(sdk)) {
        return sdk.api.tx.identity.setIdentity({
          additional: [[{ Raw: "discord" }, { Raw: discordHandle }]],
          display: { Raw: displayName },
          twitter: { Raw: twitterHandle },
        });
      }
    },
    {
      onSuccess: () => {
        appQueryClient.invalidateQueries([id, identityRootKey, address]);
        notificationStore.pushNotification("Successfully set Identity", {
          type: "Success",
        });
        reset({ displayName, discord: discordHandle, twitter: twitterHandle });
      },
    },
  );

  const { send: clearIdentity, isLoading: isClearing } = useExtrinsic(
    () => {
      if (isRpcSdk(sdk)) {
        return sdk.api.tx.identity.clearIdentity();
      }
    },
    {
      onSuccess: () => {
        appQueryClient.invalidateQueries([id, identityRootKey, address]);
        notificationStore.pushNotification("Successfully cleared Identity", {
          type: "Success",
        });
        reset({
          displayName: "",
          discord: "",
          twitter: "",
        });
      },
    },
  );
  return (
    <form
      className="flex flex-col gap-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!isValid) return;
        updateIdentity();
      }}
    >
      <div className="flex flex-col gap-y-2">
        <label
          htmlFor="displayName"
          className="text-sm font-semibold text-white/90"
        >
          Display Name
        </label>
        <input
          type="text"
          id="displayName"
          {...register("displayName", { required: true })}
          className={
            "h-10 rounded-md px-3 text-sm text-white/90 outline-none backdrop-blur-sm transition-all placeholder:text-white/90/60 focus:bg-white/15 " +
            (errors?.displayName
              ? "bg-red-500/20"
              : "bg-white/10 hover:bg-white/15")
          }
        />
      </div>

      <div className="flex flex-col gap-y-2">
        <label
          htmlFor="discord"
          className="text-sm font-semibold text-white/90"
        >
          Discord
        </label>
        <input
          type="text"
          id="discord"
          {...register("discord")}
          className={
            "h-10 rounded-md px-3 text-sm text-white/90 outline-none backdrop-blur-sm transition-all placeholder:text-white/90/60 focus:bg-white/15 " +
            (errors?.discord ? "bg-red-500/20" : "bg-white/10 hover:bg-white/15")
          }
        />
      </div>

      <div className="flex flex-col gap-y-2">
        <label
          htmlFor="twitter"
          className="text-sm font-semibold text-white/90"
        >
          Twitter
        </label>
        <input
          type="text"
          id="twitter"
          {...register("twitter")}
          className={
            "h-10 rounded-md px-3 text-sm text-white/90 outline-none backdrop-blur-sm transition-all placeholder:text-white/90/60 focus:bg-white/15 " +
            (errors?.twitter ? "bg-red-500/20" : "bg-white/10 hover:bg-white/15")
          }
        />
      </div>

      <div className="rounded-md bg-white/10 p-3 text-xs text-white/90 backdrop-blur-md">
        Setting an identity requires a deposit of up to {indetityCost}{" "}
        {constants?.tokenSymbol}. This deposit can be retrieved by clearing your
        identity.
      </div>

      <FormTransactionButton
        loading={isUpdating}
        className="!h-10 !text-sm !font-medium"
        disabled={!isDirty || !isValid || isUpdating || isClearing}
      >
        Set Identity
      </FormTransactionButton>
      <button
        type="button"
        className="mt-2 text-sm text-white/90 transition-colors hover:text-ztg-green-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        disabled={isUpdating || isClearing || isCleared}
        onClick={() => clearIdentity()}
      >
        Clear Identity
      </button>
    </form>
  );
};

export default AcccountSettingsForm;
