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
      className={`flex flex-wrap items-center justify-start gap-2 transition-opacity ${
        disabled && "pointer-events-none !cursor-default opacity-60"
      }`}
    >
      {durationPresets.map((option, index) => (
        <button
          key={index}
          type="button"
          className={`rounded-md border px-3 py-1.5 text-xs font-medium backdrop-blur-md transition-all active:scale-95 ${
            value?.type === "duration" && value?.preset === option.preset
              ? "border-sky-600/50 bg-sky-600/90 text-white shadow-sm"
              : "border-sky-200/30 bg-white/80 text-sky-900 hover:bg-sky-100/80"
          }`}
          onClick={() => handleOnClickOption(option)}
        >
          {option.preset}
        </button>
      ))}

      {hasCustomDurationOption && value?.type === "duration" && (
        <DurationInput
          className="min-w-[200px] flex-1"
          value={value}
          onChange={handleDurationChange}
          onBlur={handleDurationBlur}
          isSelected={isValid && value?.type === "duration" && !value?.preset}
        />
      )}

      {hasCustomDateOption && (
        <DateTimePicker
          timezone={timezone}
          name={name}
          className={`${
            value?.type === "date"
              ? "border-sky-600/50 !bg-sky-600/90 !text-white shadow-sm"
              : ""
          }`}
          placeholder="Custom Date"
          isValid={value?.type === "date" && isValid}
          value={chainTime && value?.type === "date" ? value.date : undefined}
          onChange={handleDateChange}
          onBlur={handleDateBlur}
        />
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
    <div className={`flex ${className}`}>
      <div
        className={`relative flex flex-1 overflow-hidden rounded-md border backdrop-blur-md transition-all ${
          isSelected
            ? "border-sky-600/50 bg-sky-600/90 shadow-sm"
            : "border-sky-200/30 bg-white/80"
        }`}
      >
        <Input
          type="number"
          className={`w-full border-0 bg-transparent px-3 py-1.5 text-right text-xs outline-none ${
            isSelected
              ? "text-white placeholder:text-white/60"
              : "text-sky-900 placeholder:text-sky-400"
          }`}
          value={value?.value}
          onChange={handleValueChange}
          onBlur={handleValueBlur}
        />

        <div
          className={`flex items-center justify-center gap-1 border-l px-3 transition-all ${
            isSelected
              ? "border-white/20 bg-white/10"
              : "border-sky-200/30 bg-sky-50/50"
          }`}
        >
          <select
            className={`min-w-[60px] bg-transparent text-xs outline-none ${
              isSelected ? "text-white" : "text-sky-900"
            }`}
            onChange={handleUnitChange}
            value={value?.unit}
          >
            {["days", "hours"].map((unit) => (
              <option key={unit} className="bg-white text-sky-900" value={unit}>
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
