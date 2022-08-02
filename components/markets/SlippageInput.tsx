import MobxReactForm from "mobx-react-form";
import { observer } from "mobx-react";
import React, { FC, useRef, useState } from "react";
import { Check, Settings } from "react-feather";
import { AmountInput } from "../ui/inputs";

export type SlippageInputProps = {
  value?: string;
  label?: string;
  onChange: (value: string) => void;
  className?: string;
  form?: MobxReactForm;
  name?: string;
};

const SlippageSettingInput: FC<SlippageInputProps> = observer(
  ({ value, onChange, className = "", form, name = "slippage", label }) => {
    const [editMode, setEditMode] = useState(false);
    const [valHolder, setValHolder] = useState<string>(value);
    const changeValHolder = (val: string) => {
      setValHolder(val);
    };
    const submit = () => {
      onChange(valHolder);
      setEditMode(false);
    };

    const inputRef = useRef();

    const baseClassName =
      "flex items-center h-ztg-24 text-sky-600 text-ztg-12-150";
    return (
      <div className={baseClassName + " " + className}>
        {editMode ? (
          <>
            <AmountInput
              value={valHolder}
              onChange={changeValHolder}
              max="50"
              min="1"
              form={form}
              name={name}
              ref={inputRef}
              showErrorMessage={false}
              containerClass="h-ztg-24 max-w-ztg-68"
              className="h-ztg-24"
            />
            <Check
              size={20}
              className="ml-ztg-15 cursor-pointer"
              onClick={() => submit()}
            />
          </>
        ) : (
          <div className="flex items-center h-full">
            {label && <div className="pr-ztg-10">{label}</div>}
            <div className="mr-ztg-15">{value}%</div>
            <Settings
              size={16}
              className="cursor-pointer"
              onClick={() => setEditMode(true)}
            />
          </div>
        )}
      </div>
    );
  },
);

export default SlippageSettingInput;
