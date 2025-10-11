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
    <div className="flex flex-wrap items-center gap-1.5">
      {presets.map((preset, index) => (
        <button
          key={index}
          type="button"
          onClick={handleFeePresetChange(preset)}
          className={`rounded-md border px-2.5 py-1 text-xs font-medium backdrop-blur-md transition-all active:scale-95 ${
            value?.type === "preset" && value?.value === preset.value
              ? "border-sky-600/50 bg-sky-600/90 text-white shadow-sm"
              : "border-sky-200/30 bg-white/80 text-sky-900 hover:bg-sky-100/80"
          }`}
        >
          {preset.value}%
        </button>
      ))}
      <div className="flex h-7 overflow-hidden rounded-md border backdrop-blur-md transition-all">
        <Input
          type="number"
          min={0}
          step={0.1}
          className={`w-16 border-0 bg-transparent px-2 text-right text-xs outline-none ${
            value?.type === "custom" && isValid
              ? "border-sky-600/50 bg-sky-600/90 text-white"
              : "border-sky-200/30 bg-white/80 text-sky-900"
          }`}
          value={Number(value?.value).toString()}
          onChange={handleFeeCustomChange}
        />
        <div className="flex items-center border-l border-sky-200/30 bg-sky-50/50 px-2 text-xs text-sky-700">
          {label}
        </div>
      </div>
    </div>
  );
};

export default FeeSelect;
