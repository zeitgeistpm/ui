import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import AddressInput, { AddressOption } from "components/ui/AddressInput";
import FormTransactionButton from "components/ui/FormTransactionButton";
import { isRpcSdk } from "@zeitgeistpm/sdk-next";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useWallet } from "lib/state/wallet";
import { isValidPolkadotAddress } from "lib/util";
import TimezoneSelect from "components/ui/TimezoneSelect";
import { useAppTimezone } from "lib/state/timezone";
import { isPresent } from "lib/types";

export type OtherSettingsFormProps = {};

const OtherSettingsForm: React.FC<OtherSettingsFormProps> = ({}) => {
  const [sdk] = useSdkv2();
  const wallet = useWallet();

  const { timezone: storedTimezone, setTimezone } = useAppTimezone();

  const proxyConfig = wallet.getProxyFor(wallet.activeAccount?.address);

  const {
    register,
    control,
    trigger,
    handleSubmit,
    reset,
    formState: { isValid, errors, isDirty },
    watch,
  } = useForm<{
    proxyAddress: AddressOption | null;
    enableProxy: boolean;
    timezone: string;
  }>({
    defaultValues: {
      proxyAddress: proxyConfig
        ? { label: proxyConfig.address, value: proxyConfig.address }
        : null,
      enableProxy: proxyConfig?.enabled ?? false,
      timezone: storedTimezone,
    },
    mode: "all",
    reValidateMode: "onChange",
  });

  const proxyEnabled = watch("enableProxy");

  useEffect(() => {
    const sub = watch((data, { name }) => {
      console.log("watch data", data, name);
      if (
        name === "timezone" &&
        isPresent(data.timezone) &&
        data.timezone !== storedTimezone
      ) {
        return setTimezone(data.timezone);
      }
      if (name === "enableProxy") {
        return trigger("proxyAddress");
      }
    });
    return () => sub.unsubscribe();
  }, []);

  return (
    <form
      className="flex flex-col"
      onSubmit={handleSubmit((data) => {
        if (!wallet.activeAccount?.address) {
          return;
        }
        wallet.setProxyFor(wallet.activeAccount.address, {
          address: data.proxyAddress?.value ?? "",
          enabled: data.enableProxy,
        });
        reset(data);
      })}
    >
      <label className="font-bold mb-2">Proxy Account</label>
      <div className="flex flex-row p-2 mb-2">
        <input
          type="checkbox"
          {...register("enableProxy")}
          id="enableProxy"
          className="cursor-pointer accent-ztg-blue"
        />
        <label className="ml-2 cursor-pointer" htmlFor="enableProxy">
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
              onChange={onChange}
              value={value}
              disabled={!proxyEnabled}
              error={!isValid ? errors.proxyAddress?.message : undefined}
            />
          );
        }}
        control={control}
      />
      <label className="font-bold mb-2">Your timezone</label>
      <TimezoneSelect {...register("timezone")} />
      <FormTransactionButton
        disabled={!isValid || !isDirty}
        className="mt-5"
        disableFeeCheck={true}
      >
        Save
      </FormTransactionButton>
    </form>
  );
};

export default OtherSettingsForm;
