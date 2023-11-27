import Input from "components/ui/Input";
import { ChangeEventHandler } from "react";
import { FormEvent } from "../types";

export type Fee = { type: "preset" | "custom"; value: number };

export type FeeInputProps = {
  name: string;
  value?: Fee;
  onChange: (event: FormEvent<Fee>) => void;
  isValid: boolean;
  presets: Fee[];
  label: string;
};

const FeeSelect = ({
  name,
  value,
  onChange,
  isValid,
  presets,
  label,
}: FeeInputProps) => {
  const handleFeePresetChange = (fee: Fee) => () => {
    onChange({
      type: "change",
      target: {
        name,
        value: fee,
      },
    });
  };

  const handleFeeCustomChange: ChangeEventHandler<HTMLInputElement> = (
    event,
  ) => {
    const fee = parseFloat(event.target.value);
    onChange({
      type: "change",
      target: {
        name,
        value: { value: fee, type: "custom" },
      },
    });
  };

  return (
    <div className="flex items-center gap-2">
      {presets.map((preset, index) => (
        <button
          key={index}
          type="button"
          onClick={handleFeePresetChange(preset)}
          className={`center active:scale-9 flex rounded-full bg-gray-100 px-6 py-3 transition-all ${
            value?.type === "preset" &&
            value?.value === preset.value &&
            "bg-nyanza-base"
          }`}
        >
          {preset.value}%
        </button>
      ))}
      <div className="flex h-[50px]">
        <Input
          type="number"
          min={0}
          className={`w-32 rounded-r-none bg-gray-100 py-3 pl-4 text-right outline-none ${
            value?.type === "custom" && isValid && "bg-nyanza-base"
          }`}
          value={Number(value?.value).toString()}
          onChange={handleFeeCustomChange}
        />
        <div className="center pointer-events-none right-0 h-full rounded-r-md border-2 border-l-0 border-gray-100 bg-white px-4 text-gray-600">
          {label}
        </div>
      </div>
    </div>
  );
};

export default FeeSelect;
