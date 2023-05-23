import {
  ChainTime,
  blockDate,
  dateBlock,
} from "@zeitgeistpm/utility/dist/time";
import {
  PeriodOption,
  PeriodPresetOption,
} from "lib/state/market-creation/types/form";
import { DeepReadonly } from "lib/types/deep-readonly";
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
    PeriodPresetOption | { type: "custom-duration" } | { type: "custom-date" }
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
          type: "custom-date",
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
          type: "custom-date",
          block: dateBlock(chainTime, new Date(event.target.value)),
        },
      },
    });
  };

  return (
    <div className="md:flex justify-center items-center gap-3">
      <div className="flex justify-center gap-3 mb-4 md:mb-0">
        {options.map((option) => (
          <>
            {option.type === "preset" && (
              <button
                type="button"
                className={`flex center rounded-full bg-gray-200 py-3 px-6 ${
                  value?.type === "preset" &&
                  option.label === value.label &&
                  "bg-nyanza-base"
                }`}
                onClick={() => handleOnClickOption(option)}
              >
                {option.label}
              </button>
            )}
          </>
        ))}
      </div>

      <div className="flex justify-center gap-3">
        {Boolean(options.find((o) => o.type === "custom-duration")) && (
          <div>duration input</div>
        )}

        {Boolean(options.find((o) => o.type === "custom-date")) && (
          <DateTimePicker
            name={name}
            className={`min-w-[300px] ${
              value?.type === "custom-date" && "bg-nyanza-base"
            }`}
            placeholder="Set Custom Date"
            isValid={value?.type === "custom-date" && isValid}
            value={
              chainTime && value?.type === "custom-date"
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

export default BlockPeriodPicker;
