import { PeriodOption } from "lib/state/market-creation/types/form";
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
};

export type BlockPeriodPickerOptions = DeepReadonly<
  Array<PeriodOption | { type: "custom-duration" } | { type: "custom-date" }>
>;

export const BlockPeriodPicker: React.FC<BlockPeriodPickerProps> = ({
  name,
  value,
  onChange,
  onBlur,
  options,
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
          type: "date",
          value: event.target.value,
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
          value: event.target.value,
        },
      },
    });
  };

  return (
    <div className="md:flex justify-center items-center gap-3">
      <div className="flex justify-center gap-3 mb-4 md:mb-0">
        {options.map((option) => (
          <>
            {option.type === "blocks" && (
              <button
                type="button"
                className={`flex center rounded-full bg-gray-200 py-3 px-6 ${
                  value?.type === "blocks" &&
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
            className="min-w-[300px]"
            placeholder="Set Custom Date"
            isValid={value?.type === "date" && isValid}
            value={value?.type === "date" ? value.value : undefined}
            onChange={handleDateChange}
            onBlur={handleDateBlur}
          />
        )}
      </div>
    </div>
  );
};

export default BlockPeriodPicker;
