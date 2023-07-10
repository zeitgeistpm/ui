import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import AddressInput, { AddressOption } from "components/ui/AddressInput";
import FormTransactionButton from "components/ui/FormTransactionButton";
import { isRpcSdk } from "@zeitgeistpm/sdk-next";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useWallet } from "lib/state/wallet";
import { isValidPolkadotAddress } from "lib/util";

export type OtherSettingsFormProps = {};

const OtherSettingsForm: React.FC<OtherSettingsFormProps> = ({}) => {
  const [sdk] = useSdkv2();
  const wallet = useWallet();

  const proxyConfig =
    (wallet.activeAccount &&
      wallet.proxyFor?.[wallet.activeAccount?.address]) ??
    null;

  const {
    register,
    control,
    trigger,
    handleSubmit,
    reset,
    formState: { isValid, errors, touchedFields, isDirty },
    watch,
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
  }, [proxyEnabled]);

  return (
    <form
      className="flex flex-col"
      onSubmit={handleSubmit((data) => {
        if (!wallet.activeAccount?.address) {
          return;
        }
        console.log("handleSubmit", data);
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
      <FormTransactionButton disabled={!isValid || !isDirty} className="mt-5">
        Save
      </FormTransactionButton>
    </form>
  );
};

export default OtherSettingsForm;
