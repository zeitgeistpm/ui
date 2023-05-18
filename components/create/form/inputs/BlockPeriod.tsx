import { BlockPeriodOption } from "lib/state/market-creation/types/form";
import { FormEvent } from "../types";
import DateTimePicker from "./DateTime";

export type BlockPeriodPickerProps = {
  name: string;
  value?: BlockPeriodOption;
  options: Array<BlockPeriodOption>;
  onChange: (event: FormEvent<BlockPeriodOption>) => void;
  onBlur: (event: FormEvent<BlockPeriodOption>) => void;
  isValid?: boolean;
};

export const BlockPeriodPicker: React.FC<BlockPeriodPickerProps> = ({
  name,
  value,
  onChange,
  onBlur,
  options,
  isValid,
}) => {
  const handleOnClickOption = (option: BlockPeriodOption) => {
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
    <div className="flex center gap-3">
      {options.map((option, index) => (
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
      <div className="">
        <DateTimePicker
          name={name}
          className="min-w-[300px]"
          placeholder="Set Custom Date"
          isValid={value?.type === "date" && isValid}
          value={value?.type === "date" ? value.value : undefined}
          onChange={handleDateChange}
          onBlur={handleDateBlur}
        />
      </div>
    </div>
  );
};

export default BlockPeriodPicker;
