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
  const handleSwapFeePresetChange = (fee: Fee) => () => {
    onChange({
      type: "change",
      target: {
        name,
        value: fee,
      },
    });
  };

  const handleSwapFeeCustomChange: ChangeEventHandler<HTMLInputElement> = (
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
    <div className="relative flex justify-end pr-8 mr-4 md:mr-0">
      <div className="flex items-center gap-2">
        {presets.map((preset, index) => (
          <button
            key={index}
            type="button"
            onClick={handleSwapFeePresetChange(preset)}
            className={`flex center rounded-full bg-gray-100 py-3 px-6 transition-all active:scale-9 ${
              value?.type === "preset" &&
              value?.value === preset.value &&
              "bg-nyanza-base"
            }`}
          >
            {preset.value}%
          </button>
        ))}
        <div className="relative inline-block">
          <Input
            type="number"
            min={0}
            className={`rounded-md bg-gray-100 py-3 pl-4 pr-34 text-right w-64 outline-none ${
              value?.type === "custom" && isValid && "bg-nyanza-base"
            }`}
            value={Number(value?.value).toString()}
            onChange={handleSwapFeeCustomChange}
          />
          <div className="absolute bottom-[50%] center text-gray-600 right-0 rounded-r-md border-2 border-gray-100 border-l-0 px-4 bg-white h-full translate-y-[50%] translate-x-[0%] pointer-events-none">
            {label}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeeSelect;
