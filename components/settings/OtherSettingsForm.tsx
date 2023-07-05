import React, { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import AddressInput, { AddressOption } from "components/ui/AddressInput";
import FormTransactionButton from "components/ui/FormTransactionButton";

export type OtherSettingsFormProps = {
  proxyOptions: AddressOption[];
};

const OtherSettingsForm: React.FC<OtherSettingsFormProps> = ({
  proxyOptions,
}) => {
  const {
    register,
    control,
    trigger,
    reset,
    formState: { isValid, errors, touchedFields, isDirty },
    watch,
  } = useForm<{
    proxyAddress: AddressOption | null;
    enableProxy: boolean;
  }>({
    defaultValues: {
      proxyAddress: null,
      enableProxy: false,
    },
    mode: "all",
    reValidateMode: "onChange",
  });

  const isTouched = Object.keys(touchedFields).length > 0;
  const proxyEnabled = watch("enableProxy");

  useEffect(() => {
    trigger();
  }, [proxyEnabled]);

  return (
    <form
      className="flex flex-col"
      onSubmit={(e) => {
        e.preventDefault();
      }}
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
          validate: (v, { enableProxy }) => {
            if (!enableProxy) {
              return true;
            }
            if (enableProxy && !v) {
              return "Proxy address is required";
            }
          },
        }}
        render={({ field: { value, onChange } }) => {
          return (
            <AddressInput
              onChange={onChange}
              options={proxyOptions}
              value={value}
              disabled={!proxyEnabled}
              error={!isValid ? errors.proxyAddress?.message : undefined}
            />
          );
        }}
        control={control}
      />
      <FormTransactionButton disabled={!isValid || !isTouched} className="mt-5">
        Save
      </FormTransactionButton>
    </form>
  );
};

export default OtherSettingsForm;
