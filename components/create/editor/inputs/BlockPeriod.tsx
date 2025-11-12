import { ChainTime } from "@zeitgeistpm/utility/dist/time";
import {
  PeriodDurationOption,
  PeriodOption,
} from "lib/state/market-creation/types/form";
import { DeepReadonly } from "lib/types/deep-readonly";
import { ChangeEventHandler, FocusEventHandler } from "react";
import { FormEvent } from "../types";
import DateTimePicker from "./DateTime";
import Input from "components/ui/Input";

export type BlockPeriodPickerProps = {
  name: string;
  timezone?: string;
  value?: PeriodOption;
  options: BlockPeriodPickerOptions;
  onChange: (event: FormEvent<PeriodOption>) => void;
  onBlur: (event: FormEvent<PeriodOption>) => void;
  isValid?: boolean;
  chainTime?: ChainTime | undefined;
  disabled?: boolean;
};

export type BlockPeriodPickerOptions = DeepReadonly<
  Array<
    PeriodDurationOption | { type: "custom-duration" } | { type: "custom-date" }
  >
>;

export const BlockPeriodPicker: React.FC<BlockPeriodPickerProps> = ({
  name,
  timezone,
  value,
  onChange,
  onBlur,
  options,
  chainTime,
  isValid,
  disabled,
}) => {
  const hasCustomDurationOption = Boolean(
    options.find((o) => o.type === "custom-duration"),
  );
  const hasCustomDateOption = Boolean(
    options.find((o) => o.type === "custom-date"),
  );

  const handleOnClickOption = (option: PeriodOption) => {
    onChange?.({
      type: "change",
      target: {
        name,
        value: option,
      },
    });
  };

  const handleDateChange = (event: FormEvent<string>) => {
    if (!chainTime) return;
    onChange?.({
      type: "change",
      target: {
        name,
        value: {
          type: "date",
          date: event.target.value,
        },
      },
    });
  };

  const handleDateBlur = (event: FormEvent<string>) => {
    if (!chainTime) return;
    onBlur?.({
      type: "blur",
      target: {
        name,
        value: {
          type: "date",
          date: event.target.value,
        },
      },
    });
  };

  const handleDurationChange = (event: FormEvent<DurationValue>) => {
    onChange?.({
      type: "change",
      target: {
        name,
        value: {
          ...event.target.value,
          type: "duration",
          preset: "",
        },
      },
    });
  };

  const handleDurationBlur = (event: FormEvent<DurationValue>) => {
    onBlur?.({
      type: "blur",
      target: {
        name,
        value: {
          ...event.target.value,
          type: "duration",
          preset: "",
        },
      },
    });
  };

  const durationPresets: PeriodDurationOption[] = options.filter(
    (o): o is PeriodDurationOption =>
      Boolean(o.type === "duration" && o.preset),
  );

  return (
    <div
      className={`flex items-center justify-start gap-2 transition-opacity ${
        disabled && "pointer-events-none !cursor-default opacity-60"
      }`}
    >
      {durationPresets.map((option, index) => (
        <button
          key={index}
          type="button"
          className={`shrink-0 rounded-lg border-2 px-4 py-3 text-sm font-semibold backdrop-blur-sm transition-all active:scale-95 ${
            value?.type === "duration" && value?.preset === option.preset
              ? "border-ztg-green-600/80 bg-ztg-green-600/90 text-white/90 shadow-md hover:border-ztg-green-500 hover:bg-ztg-green-600"
              : "border-white/20 bg-white/10 text-white/90 hover:border-white/30 hover:bg-white/20"
          }`}
          onClick={() => handleOnClickOption(option)}
        >
          {option.preset}
        </button>
      ))}

      {hasCustomDurationOption && (
        <DurationInput
          className="min-w-[200px] flex-1"
          value={
            value?.type === "duration"
              ? value
              : { value: 1, unit: "days", preset: "" }
          }
          onChange={handleDurationChange}
          onBlur={handleDurationBlur}
          isSelected={isValid && value?.type === "duration" && !value?.preset}
        />
      )}

      {hasCustomDateOption && value?.type === "date" && (
        <div className="w-full">
          <DateTimePicker
            timezone={timezone}
            name={name}
            className={`w-full border-ztg-green-600/80 !bg-ztg-green-600/90 !text-white/90 shadow-md`}
            placeholder="Custom Date"
            isValid={value?.type === "date" && isValid}
            value={chainTime && value?.type === "date" ? value.date : undefined}
            onChange={handleDateChange}
            onBlur={handleDateBlur}
          />
        </div>
      )}
    </div>
  );
};

type DurationValue = Omit<PeriodDurationOption, "type">;

type DurationInputProps = {
  className?: string;
  name?: string;
  value: DurationValue;
  onChange: (event: FormEvent<DurationValue>) => void;
  onBlur: (event: FormEvent<DurationValue>) => void;
  isSelected?: boolean;
};

const DurationInput = ({
  className,
  value,
  onChange,
  onBlur,
  isSelected,
}: DurationInputProps) => {
  const handleUnitChange: ChangeEventHandler<HTMLSelectElement> = (event) => {
    const unit = event.target.value as DurationValue["unit"];
    onChange?.({
      type: "change",
      target: {
        name: "duration",
        value: {
          ...value,
          unit,
        },
      },
    });
  };

  const handleValueChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const newValue = Number(event.target.value);
    onChange?.({
      type: "change",
      target: {
        name: "duration",
        value: {
          ...value,
          value: newValue,
        },
      },
    });
  };

  const handleValueBlur: FocusEventHandler<HTMLInputElement> = (event) => {
    const newValue = Number(event.target.value);
    onBlur?.({
      type: "blur",
      target: {
        name: "duration",
        value: {
          ...value,
          value: newValue,
        },
      },
    });
  };

  return (
    <div className={`flex w-full ${className}`}>
      <div
        className={`relative flex w-full flex-1 overflow-hidden rounded-lg border-2 backdrop-blur-sm transition-all ${
          isSelected
            ? "border-ztg-green-600/80 bg-ztg-green-600/90 shadow-md"
            : "border-white/20 bg-white/10 hover:border-white/30"
        }`}
      >
        <Input
          type="number"
          className={`w-full border-0 bg-transparent px-4 py-3 text-left text-sm text-white/90 outline-none placeholder:text-white/50 ${
            isSelected
              ? "text-white/90 placeholder:text-white/90/60"
              : "text-white/90 placeholder:text-white/50"
          }`}
          value={value?.value}
          onChange={handleValueChange}
          onBlur={handleValueBlur}
        />

        <div
          className={`flex items-center justify-center gap-1 border-l-2 px-4 py-3 transition-all ${
            isSelected
              ? "border-white/20 bg-white/10"
              : "border-white/20 bg-white/5"
          }`}
        >
          <select
            className={`min-w-[70px] bg-transparent text-sm text-white/90 outline-none ${
              isSelected ? "text-white/90" : "text-white/90"
            }`}
            onChange={handleUnitChange}
            value={value?.unit}
          >
            {["days", "hours"].map((unit) => (
              <option
                key={unit}
                className="bg-ztg-primary-600 text-white/90"
                value={unit}
              >
                {value && value?.value <= 1 ? unit.replace("s", "") : unit}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default BlockPeriodPicker;
