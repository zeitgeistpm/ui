import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import AddressInput, { AddressOption } from "components/ui/AddressInput";
import FormTransactionButton from "components/ui/FormTransactionButton";
import { isRpcSdk } from "@zeitgeistpm/sdk-next";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useWallet } from "lib/state/wallet";
import { isValidPolkadotAddress } from "lib/util";
import InfoPopover from "components/ui/InfoPopover";
import { AiOutlineInfoCircle } from "react-icons/ai";

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
    formState: { isValid, errors, isDirty },
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
        wallet.setProxyFor(wallet.activeAccount.address, {
          address: data.proxyAddress?.value ?? "",
          enabled: data.enableProxy,
        });
        reset(data);
      })}
    >
      <div className="flex items-center mb-2 gap-3">
        <label className="font-bold ">Proxy Account</label>
        <InfoPopover
          title={
            <h3 className="flex justify-center items-center mb-4 gap-2">
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
      </div>
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
