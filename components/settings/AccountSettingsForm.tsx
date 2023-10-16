import React from "react";
import { useForm } from "react-hook-form";
import { isRpcSdk } from "@zeitgeistpm/sdk";
import FormTransactionButton from "components/ui/FormTransactionButton";
import { identityRootKey } from "lib/hooks/queries/useIdentity";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { queryClient } from "lib/query-client";
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
        queryClient.invalidateQueries([id, identityRootKey, address]);
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
        queryClient.invalidateQueries([id, identityRootKey, address]);
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
      className="flex flex-col"
      onSubmit={(e) => {
        e.preventDefault();
        if (!isValid) return;
        updateIdentity();
      }}
    >
      <label htmlFor="displayName" className="font-bold mb-2">
        Display Name
      </label>
      <input
        type="text"
        id="displayName"
        {...register("displayName", { required: true })}
        className={
          "rounded-md items-center h-14 px-3 outline-none border-1 border-transparent bg-anti-flash-white " +
          (errors?.displayName ? "border-vermilion" : "")
        }
      />

      <label htmlFor="discord" className="font-bold mt-5 mb-2">
        Discord
      </label>

      <input
        type="text"
        id="discord"
        {...register("discord")}
        className={
          "rounded-md items-center h-14 px-3 outline-none border-1 border-transparent bg-anti-flash-white " +
          (errors?.discord ? "border-vermilion" : "")
        }
      />

      <label htmlFor="twitter" className="font-bold mt-5 mb-2">
        Twitter
      </label>

      <input
        type="text"
        id="twitter"
        {...register("twitter")}
        className={
          "rounded-md items-center h-14 px-3 outline-none border-1 border-transparent bg-anti-flash-white mb-5 " +
          (errors?.twitter ? "border-vermilion" : "")
        }
      />

      <div className="rounded-lg p-5 mb-5 bg-provincial-pink text-sm">
        Setting an identity requires a deposit of up to {indetityCost}{" "}
        {constants?.tokenSymbol}. This deposit can be retrieved by clearing your
        identity.
      </div>

      <FormTransactionButton
        disabled={!isDirty || !isValid || isUpdating || isClearing}
      >
        Set Identity
      </FormTransactionButton>
      <button
        type="button"
        className="mt-2 text-sm text-sky-600 focus:outline-none"
        disabled={isUpdating || isClearing || isCleared}
        onClick={() => clearIdentity()}
      >
        Clear Identity
      </button>
    </form>
  );
};

export default AcccountSettingsForm;
