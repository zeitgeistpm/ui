import { observer } from "mobx-react";
import MobxReactForm from "mobx-react-form";
import { NextPage } from "next";
import { ChangeEvent, FC, useEffect, useState } from "react";
import { when } from "mobx";
import Loader from "react-spinners/PulseLoader";
import { Input } from "components/ui/inputs";
import Select from "components/ui/Select";
import { useStore } from "lib/stores/Store";
import { useUserStore } from "lib/stores/UserStore";
import {
  EndpointOption,
  isCustomEndpointOption,
  SupportedParachain,
  supportedParachainToString
} from "lib/types";
import { endpoints, gqlEndpoints } from "lib/constants";
import { getEndpointOption, getGqlEndpointOption } from "lib/util";
import { extrinsicCallback, signAndSend } from "lib/util/tx";
import { useNotificationStore } from "lib/stores/NotificationStore";
import { ExtSigner } from "@zeitgeistpm/sdk/dist/types";
import { AlertTriangle } from "react-feather";
import { groupBy } from "lodash";
import { defaultOptions, defaultPlugins } from "lib/form";

const SubmitButton: FC<{ onClick?: () => void; disabled?: boolean }> = ({
  onClick = () => {},
  disabled = false,
  children
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
      twitter: { Raw: twitterHandle }
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
              type: "Success"
            });
          },
          failCallback: ({ index, error }) => {
            setTransactionPending(false);
            notificationStore.pushNotification(
              store.getTransactionError(index, error),
              { type: "Error" }
            );
          }
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
            type: "Success"
          });
        },
        failCallback: ({ index, error }) => {
          notificationStore.pushNotification(
            store.getTransactionError(index, error),
            { type: "Error" }
          );
        }
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
    bottomText: "≈ $10,000,000"
  },
  {
    header: "Total Value",
    text: "176,780,870 ZGT",
    bottomText: "≈ $10,000,000"
  },
  {
    header: "Total Value",
    text: "176,780,870 ZGT",
    bottomText: "≈ $10,000,000"
  }
];

export const getCorrespondingGqlIndex = (
  rpcEndpoint: EndpointOption
): number => {
  const { parachain } = rpcEndpoint;
  return gqlEndpoints.findIndex((item) => item.parachain === parachain);
};

const EndpointSelect = observer(
  ({
    options,
    selectedOption,
    onChange
  }: {
    options: EndpointOption[];
    selectedOption: EndpointOption;
    onChange: (opt: EndpointOption) => void;
  }) => {
    return (
      <Select
        className="w-1/3 mr-ztg-3"
        onChange={onChange}
        value={selectedOption}
        options={Object.entries(groupBy(options, "parachain")).map(
          ([parachain, endpoints]) => ({
            label: supportedParachainToString(parachain as SupportedParachain),
            options: endpoints
          })
        )}
      />
    );
  }
);

type EndpointType = "rpc" | "gql";

const EndpointsSettings = observer(() => {
  const userStore = useUserStore();
  const notificationStore = useNotificationStore();
  const store = useStore();

  const [isConnectingSdk, setIsConnectingSdk] = useState<boolean>(false);

  const [endpointSelection, setEndpointSelection] = useState<EndpointOption>(
    () => {
      return getEndpointOption(userStore.endpoint);
    }
  );

  const gqlEndpointOption = () => {
    return gqlEndpoints[getCorrespondingGqlIndex(endpointSelection)];
  }

  const getCustomRpcEndpoint = () => {
    return endpointSelection.parachain === SupportedParachain.CUSTOM
      ? endpointSelection.value
      : "";
  };

  const getCustomGqlEndpoint = () => {
    const opt = gqlEndpointOption();
    return opt.parachain === SupportedParachain.CUSTOM
      ? opt.value
      : "";
  };

  const [customRpcUrl, setCustomRpcUrl] = useState<string>(() => getCustomRpcEndpoint());
  const [customGqlUrl, setCustomGqlUrl] = useState<string>(() => getCustomGqlEndpoint());

  const isCustomEndpoint = Boolean(isCustomEndpointOption(endpointSelection));

  const changeEndpoint = (opt: EndpointOption) => {
    setEndpointSelection(opt);
  }

  const selectionChanged =
    endpointSelection.value !== userStore.endpoint ||
    gqlEndpointOption().value !== userStore.gqlEndpoint;

  const customValuesChanged =
    isCustomEndpoint &&
    (customRpcUrl !== userStore.endpoint ||
      customGqlUrl !== userStore.gqlEndpoint);

  const endpointSubmitDisabled = () => {
    return isConnectingSdk || !(selectionChanged || customValuesChanged);
  };

  const connect = async (rpcUrl: string, gqlUrl: string) => {
    try {
      await store.connectNewSDK(rpcUrl, gqlUrl);
      await when(() => store.initialized === true);
      setIsConnectingSdk(false);
      notificationStore.pushNotification(
        "Connected to chain and indexer",
        {
          autoRemove: true,
          lifetime: 4,
          type: "Success"
        }
      );
      userStore.setEndpoint(rpcUrl);
      userStore.setGqlEndpoint(gqlUrl);
      const opt = getEndpointOption(rpcUrl);
      setEndpointSelection(opt);
    } catch (error) {
      notificationStore.pushNotification("Unable to connect. Using last known configuration to reconnect.", {
        autoRemove: true,
        lifetime: 8,
        type: "Error"
      });
      setTimeout(() => {
        connect(userStore.endpoint, userStore.gqlEndpoint);
      }, 5000)
    }
  }

  const submitEndpoints = () => {
    setIsConnectingSdk(true);

    const rpcUrl = isCustomEndpoint ? customRpcUrl : endpointSelection.value;
    const gqlUrl = isCustomEndpoint
      ? customGqlUrl
      : gqlEndpointOption().value;

    connect(rpcUrl, gqlUrl);
  };

  useEffect(() => {
    setCustomRpcUrl(getCustomRpcEndpoint());
    setCustomGqlUrl(getCustomGqlEndpoint());
  }, [endpointSelection])

  return (
    <div className="text-ztg-16-150">
      <div className="mb-ztg-20">
        RPC Node Endpoint
        <div className="flex flex-wrap mt-ztg-20 mb-ztg-20">
          <EndpointSelect
            options={endpoints}
            selectedOption={endpointSelection}
            onChange={(opt) => changeEndpoint(opt)}
          />
          {isCustomEndpoint && (
            <Input
              type="text"
              placeholder="Custom endpoint"
              className="w-1/3 ml-ztg-26 bg-sky-200 dark:bg-sky-1000 text-sky-600"
              value={customRpcUrl}
              disabled={isConnectingSdk}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setCustomRpcUrl(e.target.value);
              }}
            />
          )}
        </div>
        {isCustomEndpoint && (
          <>
            Subsquid Endpoint
            <div className="flex flex-wrap mt-ztg-20">
              <Input
                type="text"
                placeholder="Custom endpoint"
                className="w-1/3 bg-sky-200 dark:bg-sky-1000 text-sky-600"
                value={customGqlUrl}
                disabled={isConnectingSdk}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  setCustomGqlUrl(e.target.value);
                }}
              />
            </div>
          </>
        )}
      </div>
      <div className="flex items-center">
        <SubmitButton
          onClick={submitEndpoints}
          disabled={endpointSubmitDisabled()}
        />
        {isConnectingSdk && (
          <div className="ml-4">
            <Loader size={8} />
          </div>
        )}
      </div>
    </div>
  );
});


const Settings: NextPage = observer(() => {
  const userStore = useUserStore();

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
        <EndpointsSettings />
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
