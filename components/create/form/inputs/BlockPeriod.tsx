import {
  ChainTime,
  blockDate,
  dateBlock,
} from "@zeitgeistpm/utility/dist/time";
import {
  PeriodDurationOption,
  PeriodOption,
} from "lib/state/market-creation/types/form";
import { DeepReadonly } from "lib/types/deep-readonly";
import { ChangeEventHandler, FocusEventHandler } from "react";
import { FormEvent } from "../types";
import DateTimePicker from "./DateTime";

export type BlockPeriodPickerProps = {
  name: string;
  value?: PeriodOption;
  options: BlockPeriodPickerOptions;
  onChange: (event: FormEvent<PeriodOption>) => void;
  onBlur: (event: FormEvent<PeriodOption>) => void;
  isValid?: boolean;
  chainTime: ChainTime;
};

export type BlockPeriodPickerOptions = DeepReadonly<
  Array<
    PeriodDurationOption | { type: "custom-duration" } | { type: "custom-date" }
  >
>;

export const BlockPeriodPicker: React.FC<BlockPeriodPickerProps> = ({
  name,
  value,
  onChange,
  onBlur,
  options,
  chainTime,
  isValid,
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
    onChange?.({
      type: "change",
      target: {
        name,
        value: {
          type: "date",
          block: dateBlock(chainTime, new Date(event.target.value)),
        },
      },
    });
  };

  const handleDateBlur = (event: FormEvent<string>) => {
    onBlur?.({
      type: "blur",
      target: {
        name,
        value: {
          type: "date",
          block: dateBlock(chainTime, new Date(event.target.value)),
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
          preset: undefined,
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
          preset: undefined,
        },
      },
    });
  };

  return (
    <div className="md:flex justify-center items-center gap-3">
      <div className="flex justify-center gap-3 mb-4 md:mb-0">
        {options.map((option) => (
          <>
            {option.type === "duration" && option.preset && (
              <button
                type="button"
                className={`flex center rounded-full bg-gray-200 py-3 px-6 ${
                  value?.type === "duration" &&
                  value?.preset === option.preset &&
                  "bg-nyanza-base"
                }`}
                onClick={() => handleOnClickOption(option)}
              >
                {option.preset}
              </button>
            )}
          </>
        ))}
      </div>

      <div className="flex justify-center gap-3">
        {hasCustomDurationOption && (
          <DurationInput
            className="rounded-full overflow-hidden md:w-72"
            value={value?.type === "duration" ? value : undefined}
            onChange={handleDurationChange}
            onBlur={handleDurationBlur}
            isSelected={value?.type === "duration" && !value?.preset}
          />
        )}

        {hasCustomDateOption && (
          <DateTimePicker
            name={name}
            className={`min-w-[300px] ${
              value?.type === "date" && "bg-nyanza-base"
            }`}
            placeholder="Set Custom Date"
            isValid={value?.type === "date" && isValid}
            value={
              chainTime && value?.type === "date"
                ? blockDate(chainTime, value.block).toISOString()
                : undefined
            }
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
  value?: DurationValue;
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
        className={`flex flex-1 relative flex-shrink rounded-md transition-all duration-200 ${
          isSelected ? "bg-nyanza-base" : "bg-gray-200"
        }`}
      >
        <input
          type="number"
          className={`flex-2 rounded-l-md py-3 px-6 text-right bg-transparent outline-none w-full`}
          value={value?.value}
          onChange={handleValueChange}
          onBlur={handleValueBlur}
        />

        <div
          className={`flex-1 py-3 px-6 rounded-r-md flex justify-center items-center gap-2 transition-all duration-200
          ${isSelected ? "bg-gray-100 bg-opacity-50" : "bg-gray-100"}
        `}
        >
          <select
            className="outline-none bg-transparent min-w-[70px]"
            onChange={handleUnitChange}
            value={value?.unit}
          >
            {["days", "hours"].map((unit) => (
              <option className="text-right py-2 px-4" value={unit}>
                {value?.value <= 1 ? unit.replace("s", "") : unit}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default BlockPeriodPicker;
