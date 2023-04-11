import { observer } from "mobx-react";
import { NextPage } from "next";
import {
  FC,
  MouseEventHandler,
  PropsWithChildren,
  useEffect,
  useState,
} from "react";
import { Input } from "components/ui/inputs";
import { useStore } from "lib/stores/Store";
import { useNotifications } from "lib/state/notifications";
import { AlertTriangle } from "react-feather";
import { identityRootKey, useIdentity } from "lib/hooks/queries/useIdentity";
import { useQueryClient } from "@tanstack/react-query";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useWallet } from "lib/stores/wallets";

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

const IdentitySettings = observer(() => {
  const store = useStore();
  const wallet = useWallet();
  const notificationStore = useNotifications();

  const [displayName, setDisplayName] = useState("");
  const [discordHandle, setDiscordHandle] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const queryClient = useQueryClient();
  const [_, id] = useSdkv2();
  const address = store.wallets.activeAccount?.address;

  const { data: identity } = useIdentity(address);

  const { send: updateIdentity, isLoading: isUpdating } = useExtrinsic(
    () =>
      store.sdk.api.tx.identity.setIdentity({
        additional: [[{ Raw: "discord" }, { Raw: discordHandle }]],
        display: { Raw: displayName },
        twitter: { Raw: twitterHandle },
      }),
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
    () => store.sdk.api.tx.identity.clearIdentity(),
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
          Setting an identity requires a deposit of up to{" "}
          {store.config.identity.basicDeposit +
            store.config.identity.fieldDeposit}{" "}
          {store.config.tokenSymbol}. This deposit can be retrieved by clearing
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
});

const Settings: NextPage = observer(() => {
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
        {/* Post beta */}
        {/* <div className="font-bold mb-5">Email Address</div>
        <Input
          type="text"
          placeholder="elite-trader@domain.com"
          className="mb-ztg-25 bg-sky-200 dark:bg-sky-1000 text-sky-600"
          onChange={(e) => console.log(e)}
        /> */}
        {/* Post beta */}
        {/* <label className="block">
          <Checkbox />
          Sign up for app notifications
        </label> */}
        {/* <label className="flex items-center font-medium text-ztg-12-150 mb-ztg-25">
          <Checkbox
            value={mailingListChecked}
            onChange={handleMailingListCheck}
          />
          Subscribe to the newsletter
        </label>
        <SubmitButton onClick={handleEmailAddressSubmit} /> */}
        {/* <div className="font-bold mt-ztg-40">
          Theme
          <div className="flex flex-wrap mt-5">
            <SubmitButton
              onClick={handleResetTheme}
              disabled={userStore.storedTheme === "system"}
            >
              Sync with computer
            </SubmitButton>
          </div>
        </div> */}
        {/* TODO */}
        {/* <div className="p-ztg-15 bg-efefef mx-ztg-17 rounded-ztg-10 flex flex-row">
          <div className="flex flex-col w-full">
            <div className="flex flex-row justify-between font-bold font-medium">
              <div>New York</div>
              <div>6:00pm</div>
            </div>
            <div className="flex flex-row justify-between text-ztg-12-120 font-normal">
              <div>Eastern Time Zone (ET)</div>
              <div>Friday, July 9th, 2021</div>
            </div>
          </div>
        </div> */}
      </div>
    </>
  );
});

export default Settings;
