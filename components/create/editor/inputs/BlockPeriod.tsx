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
      className={`items-center justify-center gap-3 transition-opacity md:flex ${
        disabled && "pointer-events-none !cursor-default opacity-60"
      }`}
    >
      <div className="mb-4 flex justify-center gap-3 md:mb-0">
        {durationPresets.map((option, index) => (
          <button
            key={index}
            type="button"
            className={`center flex rounded-full bg-gray-100 px-6 py-3 transition-all active:scale-95 ${
              value?.type === "duration" &&
              value?.preset === option.preset &&
              "bg-nyanza-base"
            }`}
            onClick={() => handleOnClickOption(option)}
          >
            {option.preset}
          </button>
        ))}
      </div>

      <div className="flex justify-center gap-3">
        {hasCustomDurationOption && value?.type === "duration" && (
          <DurationInput
            className="overflow-hidden rounded-full md:w-72"
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
            className={`min-w-[300px] ${
              value?.type === "date" && "bg-nyanza-base"
            }`}
            placeholder="Set Custom Date"
            isValid={value?.type === "date" && isValid}
            value={chainTime && value?.type === "date" ? value.date : undefined}
            onChange={handleDateChange}
            onBlur={handleDateBlur}
          />
        )}
      </div>
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
        className={`relative flex flex-1 flex-shrink rounded-md transition-all duration-200 ${
          isSelected ? "bg-nyanza-base" : "bg-gray-100"
        }`}
      >
        <Input
          type="number"
          className={`flex-2 w-full rounded-l-md bg-transparent px-6 py-3 text-right outline-none`}
          value={value?.value}
          onChange={handleValueChange}
          onBlur={handleValueBlur}
        />

        <div
          className={`flex flex-1 items-center justify-center gap-2 rounded-full rounded-r-md px-6 py-3 transition-all duration-200
          ${
            isSelected
              ? "bg-gray-100 bg-opacity-50"
              : "bg-black bg-opacity-[3%]"
          }
        `}
        >
          <select
            className="min-w-[70px] bg-transparent text-center outline-none"
            onChange={handleUnitChange}
            value={value?.unit}
          >
            {["days", "hours"].map((unit) => (
              <option key={unit} className="px-4 py-2" value={unit}>
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
