import { observer } from "mobx-react";
import { NextPage } from "next";
import { ChangeEvent, FC, MouseEventHandler, useEffect, useState } from "react";
import { when } from "mobx";

import { Input } from "components/ui/inputs";
import Select from "components/ui/Select";

import { useStore } from "lib/stores/Store";
import { useUserStore } from "lib/stores/UserStore";
import { EndpointOption, isCustomEndpointOption } from "lib/types";
import { endpoints, gqlEndpoints } from "lib/constants";
import { getEndpointOption, getGqlEndpointOption } from "lib/util";
import { extrinsicCallback, signAndSend } from "lib/util/tx";
import { useNotificationStore } from "lib/stores/NotificationStore";
import { ExtSigner } from "@zeitgeistpm/sdk/dist/types";
import { AlertTriangle } from "react-feather";

const SubmitButton: FC<{ onClick?: () => void; disabled?: boolean }> = ({
  onClick = () => {},
  disabled = false,
  children,
}) => {
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
  const { wallets } = store;
  const { identity, loadIdentity } = useUserStore();
  const notificationStore = useNotificationStore();

  const [displayName, setDisplayName] = useState("");
  const [discordHandle, setDiscordHandle] = useState("");
  const [twitterHandle, setTwitterHandle] = useState("");
  const [transactionPending, setTransactionPending] = useState(false);
  useEffect(() => {
    if (!identity) return;
    setDisplayName(identity.displayName ?? "");
    setDiscordHandle(identity.discord ?? "");
    setTwitterHandle(identity.twitter ?? "");
  }, [identity]);

  const handleSubmit = async () => {
    setTransactionPending(true);
    const signer = wallets.getActiveSigner() as ExtSigner;
    const tx = store.sdk.api.tx.identity.setIdentity({
      additional: [[{ Raw: "discord" }, { Raw: discordHandle }]],
      display: { Raw: displayName },
      twitter: { Raw: twitterHandle },
    });
    try {
      await signAndSend(
        tx,
        signer,
        extrinsicCallback({
          notificationStore,
          successCallback: async () => {
            await loadIdentity(wallets.activeAccount.address);
            setTransactionPending(false);
            notificationStore.pushNotification("Successfully set Identity", {
              type: "Success",
            });
          },
          failCallback: ({ index, error }) => {
            setTransactionPending(false);
            notificationStore.pushNotification(
              store.getTransactionError(index, error),
              { type: "Error" }
            );
          },
        })
      );
    } catch (err) {
      setTransactionPending(false);
    }
  };

  const handleClear = async () => {
    const signer = store.wallets.getActiveSigner() as ExtSigner;
    const tx = store.sdk.api.tx.identity.clearIdentity();
    signAndSend(
      tx,
      signer,
      extrinsicCallback({
        notificationStore,
        successCallback: async () => {
          await loadIdentity(wallets.activeAccount.address);
          notificationStore.pushNotification("Successfully cleared Identity", {
            type: "Success",
          });
        },
        failCallback: ({ index, error }) => {
          notificationStore.pushNotification(
            store.getTransactionError(index, error),
            { type: "Error" }
          );
        },
      })
    );
  };

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
    transactionPending;

  return (
    <>
      <div className="text-ztg-16-150  mb-ztg-20" data-test="displayNameLabel">
        Display Name
      </div>
      <Input
        data-test="display-name"
        type="text"
        className="w-1/2 mb-ztg-20 bg-sky-200 dark:bg-sky-1000 text-sky-600"
        onChange={(e) => handleDisplayNameChange(e.target.value)}
        value={displayName}
      />
      <div className="flex flex-row mb-ztg-20">
        <div className="w-full mr-ztg-27">
          <div className="text-ztg-16-150 mb-ztg-20" data-test="discordLabel">
            Discord
          </div>
          <Input
            data-test="discord"
            type="text"
            className=" bg-sky-200 dark:bg-sky-1000 text-sky-600 "
            onChange={(e) => handleDiscordChange(e.target.value)}
            value={discordHandle}
          />
        </div>
        <div className="w-full ">
          <div className="text-ztg-16-150 mb-ztg-20" data-test="twitterLabel">
            Twitter
          </div>
          <Input
            data-test="twitter"
            type="text"
            className=" bg-sky-200 dark:bg-sky-1000 text-sky-600"
            onChange={(e) => handleTwitterChange(e.target.value)}
            value={twitterHandle}
          />
        </div>
      </div>
      <div className="flex items-center border border-sky-600 rounded-ztg-5 my-ztg-20 p-ztg-20 text-sky-600">
        <AlertTriangle size={20} className="mr-ztg-20" />
        <div className="text-ztg-14-120 font-normal">
          Setting an identity requires a deposit of up to 11{" "}
          {store.config.tokenSymbol}. This deposit can be retrieved by clearing
          your identity.
        </div>
      </div>
      <div className="flex mb-ztg-20" data-test="createMarketButton">
        <SubmitButton onClick={handleSubmit} disabled={submitDisabled}>
          Set Identity
        </SubmitButton>
        <button
          className="ml-ztg-20 text-ztg-14-120 text-sky-600 focus:outline-none"
          onClick={handleClear}
        >
          Clear Identity
        </button>
      </div>
    </>
  );
});

// Temporary for now
const statCardData = [
  {
    header: "Total Value",
    text: "176,780,870 ZGT",
    bottomText: "≈ $10,000,000",
  },
  {
    header: "Total Value",
    text: "176,780,870 ZGT",
    bottomText: "≈ $10,000,000",
  },
  {
    header: "Total Value",
    text: "176,780,870 ZGT",
    bottomText: "≈ $10,000,000",
  },
];

const Settings: NextPage = observer(() => {
  const userStore = useUserStore();
  const store = useStore();
  const [endpointErrors, setEndpointErrors] = useState<string>();
  const [disabledSubsquid, setDisabledSubsquid] = useState(
    () => !userStore.graphQlEnabled
  );
  const [prevDisabledSubsquid, setPrevDisabledSubsquid] =
    useState(disabledSubsquid);

  const [endpointSelection, setEndpointSelection] = useState<EndpointOption>(
    () => {
      return getEndpointOption(userStore.endpoint);
    }
  );

  const [gqlEndpointSelection, setGqlEndpointSelection] =
    useState<EndpointOption>(() => {
      return getGqlEndpointOption(userStore.gqlEndpoint);
    });

  const isCustomEndpoint = Boolean(isCustomEndpointOption(endpointSelection));
  const isCustomGqlEndpoint = Boolean(
    isCustomEndpointOption(gqlEndpointSelection)
  );

  const [customEndpoint, setCustomEndpoint] = useState<string>(() => {
    return endpoints.find((opt) => opt.label === "Custom").value;
  });

  const [customGqlEndpoint, setCustomGqlEndpoint] = useState<string>(() => {
    return gqlEndpoints.find((opt) => opt.label === "Custom").value;
  });

  const endpointHasChanged =
    (isCustomEndpoint && userStore.endpoint !== customEndpoint) ||
    (!isCustomEndpoint && userStore.endpoint !== endpointSelection?.value);

  const gqlEndpointHasChanged = () => {
    if (disabledSubsquid) {
      return false;
    }
    return (
      (isCustomGqlEndpoint && userStore.gqlEndpoint !== customGqlEndpoint) ||
      (!isCustomGqlEndpoint &&
        userStore.gqlEndpoint !== gqlEndpointSelection?.value)
    );
  };

  const disabledSubsquidChanged = () => {
    if (disabledSubsquid === prevDisabledSubsquid) {
      return false;
    }
    return disabledSubsquid && userStore.graphQlEnabled;
  };

  const endpointSubmitDisabled = () => {
    if (!store.initialized) {
      return true;
    }
    return !(
      endpointHasChanged ||
      gqlEndpointHasChanged() ||
      disabledSubsquidChanged()
    );
  };

  const [mailingListChecked, setMailingListChecked] = useState(false);

  const handleEmailAddressSubmit = async () => {
    if (mailingListChecked === false) return;
  };

  const handleMailingListCheck = (value: ChangeEvent<HTMLInputElement>) => {
    setMailingListChecked(value.target.checked);
  };

  const changeEndpoint = (value: EndpointOption) => {
    setEndpointErrors(undefined);
    setEndpointSelection(value);
  };

  const changeCustomEndpoint = (value: string) => {
    setEndpointErrors(undefined);
    setCustomEndpoint(value);
  };

  const changeGqlEndpoint = (value: EndpointOption) => {
    setEndpointErrors(undefined);
    setGqlEndpointSelection(value);
  };

  const changeCustomGqlEndpoint = (value: string) => {
    setEndpointErrors(undefined);
    setCustomGqlEndpoint(value);
  };

  const submitEndpoints = async () => {
    const newEndpoint = isCustomEndpoint
      ? customEndpoint
      : endpointSelection.value;
    const newGqlEndpoint = disabledSubsquid
      ? null
      : isCustomGqlEndpoint
      ? customGqlEndpoint
      : gqlEndpointSelection.value;

    try {
      await store.connectNewSDK(newEndpoint, newGqlEndpoint);
      await when(() => store.initialized === true);
      if (gqlEndpointHasChanged() && !userStore.graphQlEnabled) {
        return setEndpointErrors(
          "Unable to connect to this GQL endpoint. Subsquid remains disabled."
        );
      }
      setEndpointErrors(undefined);
      setPrevDisabledSubsquid(disabledSubsquid);
    } catch (error) {
      setEndpointErrors("Unable to connect to this endpoint");
      setEndpointSelection(getEndpointOption(userStore.endpoint));
    }
  };

  const handleResetTheme = () => {
    userStore.toggleTheme("system");
  };

  return (
    <>
      <h2
        className="text-ztg-20-150 font-bold font-kanit mb-ztg-23"
        data-test="accountSettingsHeader"
      >
        Account Settings
      </h2>
      <div className="p-ztg-30 rounded-ztg-10 mb-ztg-32 font-lato font-bold bg-sky-100 dark:bg-sky-700">
        <IdentitySettings />
        {/* Post beta */}
        {/* <div className="text-ztg-16-150 mb-ztg-20">Email Address</div>
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
        <div className="text-ztg-16-150">
          <div className="mb-ztg-20">
            Endpoint
            <div className="flex flex-wrap mt-ztg-20">
              <Select
                options={endpoints}
                className="w-1/3 mr-ztg-3"
                onChange={changeEndpoint}
                value={endpointSelection}
              />
              {isCustomEndpoint ? (
                <Input
                  type="text"
                  placeholder="Custom endpoint"
                  className="w-1/3 ml-ztg-26 bg-sky-200 dark:bg-sky-1000 text-sky-600"
                  value={customEndpoint}
                  onChange={(e: ChangeEvent<HTMLInputElement>) =>
                    changeCustomEndpoint(e.target.value)
                  }
                />
              ) : (
                <></>
              )}
            </div>
          </div>
          <div className="mb-ztg-20">
            Subsquid Endpoint
            <div className="flex flex-col mt-ztg-20">
              <div>
                <input
                  type="checkbox"
                  id="disableSubsquid"
                  defaultChecked={disabledSubsquid}
                  onChange={() => {
                    const disabled = !disabledSubsquid;
                    setDisabledSubsquid(disabled);
                    setEndpointErrors(undefined);
                  }}
                />
                <label
                  htmlFor="disableSubsquid"
                  className="text-ztg-12-150 ml-ztg-8 cursor-pointer"
                >
                  Disable Subsquid
                </label>
              </div>
              <div className="flex flex-wrap mt-ztg-20">
                {!disabledSubsquid && (
                  <>
                    <Select
                      options={gqlEndpoints}
                      className="w-1/3 mr-ztg-3"
                      onChange={changeGqlEndpoint}
                      value={gqlEndpointSelection}
                    />
                    {isCustomGqlEndpoint && (
                      <Input
                        type="text"
                        placeholder="Custom endpoint"
                        className="w-1/3 ml-ztg-26 bg-sky-200 dark:bg-sky-1000 text-sky-600"
                        value={customGqlEndpoint}
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          changeCustomGqlEndpoint(e.target.value)
                        }
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="mb-ztg-20 text-red-600 font-light">
            {endpointErrors}
          </div>
          <SubmitButton
            onClick={submitEndpoints}
            disabled={endpointSubmitDisabled()}
          />
        </div>
        <div className="text-ztg-16-150 mt-ztg-40">
          Theme
          <div className="flex flex-wrap mt-ztg-20">
            <SubmitButton
              onClick={handleResetTheme}
              disabled={userStore.storedTheme === "system"}
            >
              Reset to system theme
            </SubmitButton>
          </div>
        </div>
        {/* TODO */}
        {/* <div className="p-ztg-15 bg-efefef mx-ztg-17 rounded-ztg-10 flex flex-row">
          <div className="flex flex-col w-full">
            <div className="flex flex-row justify-between text-ztg-16-150 font-medium">
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
