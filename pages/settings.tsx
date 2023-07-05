import { useQueryClient } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk-next";
import { tryCatch } from "@zeitgeistpm/utility/dist/option";
import { Input } from "components/ui/inputs";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import { identityRootKey, useIdentity } from "lib/hooks/queries/useIdentity";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { ProxyConfig, useWallet } from "lib/state/wallet";
import { NextPage } from "next";
import { encodeAddress } from "@polkadot/util-crypto";

import {
  ChangeEventHandler,
  FC,
  MouseEventHandler,
  PropsWithChildren,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AlertTriangle } from "react-feather";
import { useForm } from "react-hook-form";
import { useAccountProxies } from "lib/hooks/queries/useAccountProxies";
import { poll } from "@zeitgeistpm/avatara-util";

const SubmitButton: FC<
  PropsWithChildren<{
    onClick?: MouseEventHandler<HTMLButtonElement>;
    disabled?: boolean;
  }>
> = ({ onClick = () => {}, disabled = false, children }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-row p-ztg-8 w-ztg-266 h-ztg-37 bg-ztg-blue rounded-ztg-100 cursor-pointer disabled:cursor-default disabled:opacity-20 focus:outline-none"
    >
      <div className="text-ztg-14-150 font-medium text-white flex flex-grow justify-center items-center">
        {children ?? "Submit"}
      </div>
    </button>
  );
};

const IdentitySettings = () => {
  const wallet = useWallet();
  const notificationStore = useNotifications();

  const [displayName, setDisplayName] = useState("");
  const [discordHandle, setDiscordHandle] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const queryClient = useQueryClient();

  const address = wallet.activeAccount?.address;
  const [sdk, id] = useSdkv2();

  const { data: identity } = useIdentity(address);

  const { data: constants } = useChainConstants();

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
      },
    },
  );

  const transactionPending = isClearing || isUpdating;

  useEffect(() => {
    if (!identity) {
      setDisplayName("");
      setDiscordHandle("");
      setTwitterHandle("");
    } else {
      setDisplayName(identity.displayName ?? "");
      setDiscordHandle(identity.discord ?? "");
      setTwitterHandle(identity.twitter ?? "");
    }
  }, [identity]);

  const handleDisplayNameChange = (value: string) => {
    if (getBytesCount(value) <= 32) {
      setDisplayName(value);
    }
  };

  const handleDiscordChange = (value: string) => {
    if (getBytesCount(value) <= 32) {
      setDiscordHandle(value);
    }
  };
  const handleTwitterChange = (value: string) => {
    if (getBytesCount(value) <= 32) {
      setTwitterHandle(value);
    }
  };

  const getBytesCount = (string: string) => {
    return new TextEncoder().encode(string).length;
  };

  const submitDisabled =
    (identity?.discord === discordHandle &&
      identity.displayName === displayName &&
      identity.twitter === twitterHandle) ||
    transactionPending ||
    !wallet.connected;

  const indetityCost =
    constants?.identity?.basicDeposit ??
    0 + (constants?.identity?.fieldDeposit ?? 0);

  return (
    <>
      <h6 className="font-bold mb-5" data-test="displayNameLabel">
        Display Name
      </h6>
      <Input
        data-test="display-name"
        type="text"
        className="w-1/2 mb-5 bg-sky-200 dark:bg-sky-1000 text-sky-600"
        onChange={(e) => handleDisplayNameChange(e.target.value)}
        value={displayName}
        disabled={!wallet.connected}
      />
      <div className="flex flex-row mb-5">
        <div className="w-full mr-ztg-27">
          <h6 className="font-bold mb-5" data-test="discordLabel">
            Discord
          </h6>
          <Input
            data-test="discord"
            type="text"
            className=" bg-sky-200 dark:bg-sky-1000 text-sky-600 "
            onChange={(e) => handleDiscordChange(e.target.value)}
            value={discordHandle}
            disabled={!wallet.connected}
          />
        </div>
        <div className="w-full ">
          <h6 className="font-bold mb-5" data-test="twitterLabel">
            Twitter
          </h6>
          <Input
            data-test="twitter"
            type="text"
            className=" bg-sky-200 dark:bg-sky-1000 text-sky-600"
            onChange={(e) => handleTwitterChange(e.target.value)}
            value={twitterHandle}
            disabled={!wallet.connected}
          />
        </div>
      </div>
      <div className="flex items-center border border-sky-600 rounded-ztg-5 my-5 p-5 text-sky-600">
        <AlertTriangle size={20} className="mr-5" />
        <div className="text-ztg-14-120 font-normal">
          Setting an identity requires a deposit of up to {indetityCost}{" "}
          {constants?.tokenSymbol}. This deposit can be retrieved by clearing
          your identity.
        </div>
      </div>
      <div className="flex mb-5" data-test="createMarketButton">
        <SubmitButton onClick={updateIdentity} disabled={submitDisabled}>
          Set Identity
        </SubmitButton>
        <button
          className="ml-5 text-ztg-14-120 text-sky-600 focus:outline-none"
          onClick={clearIdentity}
        >
          Clear Identity
        </button>
      </div>
    </>
  );
};

const ProxySettings = () => {
  const [sdk] = useSdkv2();
  const wallet = useWallet();

  const proxy = wallet.proxyFor?.[wallet.activeAccount?.address];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isValid },
    watch,
  } = useForm<ProxyConfig>({
    mode: "all",
    defaultValues: {
      address: proxy?.address ?? "",
      enabled: proxy?.enabled ?? false,
    },
  });

  const onSubmit = (data: ProxyConfig) => {
    wallet.setProxyFor(wallet.activeAccount?.address, data);
    reset(data);
  };

  const address = watch("address");
  const enabled = watch("enabled");

  console.log(errors);

  return (
    <>
      <h6 className="font-bold mb-5" data-test="displayNameLabel">
        Proxy Account
      </h6>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-3">
          <div className="inline-flex gap-2 justify-center items-center">
            <h4 className="text-base">Enable Proxy Execution</h4>
            <input type="checkbox" {...register("enabled")} />
          </div>
        </div>

        <div className={`mb-5 ${!enabled && "opacity-20"}`}>
          <div className="w-full">
            <input
              type="text"
              disabled={!enabled}
              className={`w-full bg-sky-200 px-3 py-2 rounded-md text-sky-600 border-transparent border-1 outline-none ${
                errors.address && " border-vermilion"
              }`}
              {...register("address", {
                validate: async (value) => {
                  if (enabled && tryCatch(() => encodeAddress(value)).isNone())
                    return "Not a valid address";

                  if (isRpcSdk(sdk)) {
                    const proxies = await sdk.api.query.proxy.proxies(value);
                    const isValidProxy = Boolean(
                      proxies?.[0]?.find(
                        (p) =>
                          p.delegate.toString() ===
                          wallet.activeAccount?.address,
                      ),
                    );
                    if (!isValidProxy) {
                      return "You are not a proxy for this account.";
                    }
                  }
                },
                deps: ["enabled"],
              })}
            />
          </div>
          <div className="h-3 text-vermilion text-sm font-light mt-2 pl-5">
            {errors.address && errors.address.message}
          </div>
        </div>

        <button
          type="submit"
          disabled={!isDirty || !isValid}
          className="flex flex-row p-ztg-8 w-ztg-266 h-ztg-37 bg-ztg-blue rounded-ztg-100 cursor-pointer text-white center disabled:cursor-default disabled:opacity-20 focus:outline-none"
        >
          <div className="text-ztg-14-150 font-medium text-white flex flex-grow justify-center items-center">
            Save Proxy Settings
          </div>
        </button>
      </form>
    </>
  );
};

const Settings: NextPage = () => {
  return (
    <>
      <h2
        className="text-5-150 font-bold  mb-ztg-23"
        data-test="accountSettingsHeader"
      >
        Account Settings
      </h2>
      <div className="p-ztg-30 rounded-ztg-10 mb-ztg-32  font-bold bg-sky-100 dark:bg-sky-700">
        <IdentitySettings />
      </div>
      <div className="p-ztg-30 rounded-ztg-10 mb-ztg-32  font-bold bg-sky-100 dark:bg-sky-700">
        <ProxySettings />
      </div>
    </>
  );
};

export default Settings;
