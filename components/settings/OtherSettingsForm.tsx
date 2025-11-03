import React, { Fragment, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import AddressInput, { AddressOption } from "components/ui/AddressInput";
import FormTransactionButton from "components/ui/FormTransactionButton";
import { isRpcSdk } from "@zeitgeistpm/sdk";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useWallet } from "lib/state/wallet";
import { isValidPolkadotAddress, shortenAddress } from "lib/util";
import InfoPopover from "components/ui/InfoPopover";
import { AiOutlineInfoCircle } from "react-icons/ai";
import { Check } from "react-feather";
import { Transition } from "@headlessui/react";

export type OtherSettingsFormProps = {};

const OtherSettingsForm: React.FC<OtherSettingsFormProps> = ({}) => {
  const [sdk] = useSdkv2();
  const wallet = useWallet();

  const proxyConfig = wallet.getProxyFor(wallet.activeAccount?.address);

  const {
    register,
    control,
    trigger,
    handleSubmit,
    reset,
    getFieldState,
    formState: { isValid, errors, isDirty },
    watch,
    setValue,
  } = useForm<{
    proxyAddress: AddressOption | null;
    enableProxy: boolean;
  }>({
    defaultValues: {
      proxyAddress: proxyConfig
        ? { label: proxyConfig.address, value: proxyConfig.address }
        : null,
      enableProxy: proxyConfig?.enabled ?? false,
    },
    mode: "all",
    reValidateMode: "onChange",
  });

  const proxyEnabled = watch("enableProxy");

  useEffect(() => {
    trigger("proxyAddress");
    if (!proxyEnabled && getFieldState("proxyAddress").error) {
      setValue("proxyAddress", null);
    }
  }, [proxyEnabled]);

  const [showSaved, setShowSaved] = useState(false);

  useEffect(() => {
    const subscription = watch(() => {
      handleSubmit((data) => {
        if (!wallet.activeAccount?.address) {
          return;
        }
        wallet.setProxyFor(wallet.activeAccount.address, {
          address: data.proxyAddress?.value ?? "",
          enabled: data.enableProxy,
        });
        setShowSaved(true);
        setTimeout(() => {
          setShowSaved(false);
        }, 1000);
      })();
    });
    return () => subscription.unsubscribe();
  }, [handleSubmit, watch]);

  const opts = useMemo<AddressOption[]>(() => {
    return wallet.accounts
      .filter((acc) => acc.address !== wallet.activeAccount?.address)
      .map((account) => ({
        label: shortenAddress(account.address, 13, 13),
        value: account.address,
        name: account.name,
      }));
  }, [wallet.accounts]);

  return (
    <form className="flex flex-col" onSubmit={(e) => e.preventDefault()}>
      <div className="mb-4 flex items-center gap-3">
        <label className="font-bold text-white/90">Proxy Account</label>

        <InfoPopover
          title={
            <h3 className="mb-4 flex items-center justify-center gap-2">
              <AiOutlineInfoCircle />
              Proxy Accounts
            </h3>
          }
        >
          <p>
            Proxy accounts can be used to allow wallets to sign transactions on
            behalf of others. This section allows you to tell this application
            to attempt to sign transactions using the connected wallet on behalf
            of another account.
          </p>
        </InfoPopover>
        <Transition
          as={Fragment}
          show={showSaved}
          enter="transition duration-100 ease-out"
          enterFrom="transform scale-95 opacity-0"
          enterTo="transform scale-100 opacity-100"
          leave="transition duration-75 ease-out"
          leaveFrom="transform scale-100 opacity-100"
          leaveTo="transform scale-95 opacity-0"
        >
          <div className="ml-auto flex items-center gap-2 text-white/90">
            <Check size={16} className="text-green-500" />
            <div className="text-sm">Saved</div>
          </div>
        </Transition>
      </div>
      <div className="mb-4 flex flex-row items-center p-2">
        <input
          type="checkbox"
          {...register("enableProxy")}
          id="enableProxy"
          className="cursor-pointer accent-ztg-blue"
        />
        <label
          className="ml-2 cursor-pointer text-white/90"
          htmlFor="enableProxy"
        >
          Enable Proxy Execution
        </label>
      </div>
      <Controller
        name="proxyAddress"
        rules={{
          validate: async (v, { enableProxy }) => {
            if (!enableProxy) {
              return true;
            }
            if (enableProxy && !v?.value) {
              return "Enter an address to proxy";
            }
            if (v && !isValidPolkadotAddress(v.value)) {
              return "Invalid address";
            }
            if (v && isRpcSdk(sdk) && v.value) {
              const proxies = await sdk.api.query.proxy.proxies(v.value);
              const proxyMatch = proxies?.[0]?.find((p) => {
                return p.delegate.toString() === wallet.activeAccount?.address;
              });
              if (!Boolean(proxyMatch)) {
                return "You are not a proxy for this account.";
              }
            }
          },
          deps: ["enableProxy"],
        }}
        render={({ field: { value, onChange } }) => {
          return (
            <AddressInput
              options={opts}
              onChange={onChange}
              value={value}
              disabled={!proxyEnabled}
              error={!isValid ? errors.proxyAddress?.message : undefined}
            />
          );
        }}
        control={control}
      />
    </form>
  );
};

export default OtherSettingsForm;
