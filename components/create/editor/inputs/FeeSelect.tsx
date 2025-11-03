import Input from "components/ui/Input";
import { ChangeEventHandler } from "react";
import { FormEvent } from "../types";

export type Fee = { type: "preset" | "custom"; value: number };

export type FeeInputProps = {
  name: string;
  value?: Fee;
  onChange: (event: FormEvent<Fee>) => void;
  onBlur?: (event: FormEvent<Fee>) => void;
  isValid: boolean;
  presets: Fee[];
  label: string;
};

const FeeSelect = ({
  name,
  value,
  onChange,
  onBlur,
  isValid,
  presets,
  label,
}: FeeInputProps) => {
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (selectedValue === "custom") {
      // Keep current custom value if exists
      if (value?.type === "custom") {
        return;
      }
      const newValue = { value: 0, type: "custom" as const };
      onChange({
        type: "change",
        target: {
          name,
          value: newValue,
        },
      });
      onBlur?.({
        type: "blur",
        target: {
          name,
          value: newValue,
        },
      });
    } else if (selectedValue === "") {
      // Empty selection - pass undefined
      const newValue = undefined;
      onChange({
        type: "change",
        target: {
          name,
          value: newValue,
        },
      });
      onBlur?.({
        type: "blur",
        target: {
          name,
          value: newValue,
        },
      });
    } else {
      const preset = presets.find(
        (p) => p.value.toString() === selectedValue
      );
      if (preset) {
        onChange({
          type: "change",
          target: {
            name,
            value: preset,
          },
        });
        onBlur?.({
          type: "blur",
          target: {
            name,
            value: preset,
          },
        });
      }
    }
  };

  const handleCustomInputChange: ChangeEventHandler<HTMLInputElement> = (
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

  const displayValue =
    value?.type === "preset"
      ? value.value.toString()
      : value?.type === "custom"
        ? "custom"
        : "";

  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex items-center rounded-lg border-2 border-white/20 backdrop-blur-sm transition-all h-12 bg-white/10 hover:border-white/30 ${value?.type === "custom" ? "flex-1" : "w-full"}`}
      >
        <select
          value={displayValue}
          className="w-full h-full bg-transparent px-4 py-3 text-left text-sm text-white outline-none placeholder:text-white/50"
          onChange={handleSelectChange}
        >
          <option value="" className="bg-ztg-primary-600 text-white">
            Select fee
          </option>
          {presets.map((preset, index) => (
            <option
              key={index}
              value={preset.value.toString()}
              className="bg-ztg-primary-600 text-white"
            >
              {preset.value}%
            </option>
          ))}
          <option value="custom" className="bg-ztg-primary-600 text-white">
            Custom
          </option>
        </select>
      </div>
      {value?.type === "custom" && (
        <div className="flex h-12 overflow-hidden rounded-lg bg-white/10 backdrop-blur-sm transition-all flex-1">
          <Input
            type="number"
            min={0}
            step={0.1}
            className="w-full border-0 bg-transparent px-4 text-right text-sm text-white outline-none placeholder:text-white/50"
            value={Number(value?.value || 0).toString()}
            onChange={handleCustomInputChange}
            onBlur={() => {
              onBlur?.({
                type: "blur",
                target: {
                  name,
                  value: value,
                },
              });
            }}
            placeholder="Enter fee"
          />
          <div className="flex items-center  bg-white/5 px-3 text-xs font-medium text-white/70 shrink-0">
            {label}
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeSelect;
