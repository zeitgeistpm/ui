import { ScalarAnswers } from "lib/state/market-creation/types/form";
import { ChangeEventHandler } from "react";
import { FormEvent } from "../../types";
import Toggle from "components/ui/Toggle";
import DateTimePicker from "../DateTime";

export type ScalarAnswersInputProps = {
  name?: string;
  value?: ScalarAnswers;
  onChange?: (event: FormEvent<ScalarAnswers>) => void;
  onBlur?: (event: FormEvent<ScalarAnswers>) => void;
  disabled?: boolean;
};

export const ScalarAnswersInput = ({
  name,
  value,
  onChange,
  onBlur,
}: ScalarAnswersInputProps) => {
  const handleNumberTypeChange = (checked: boolean) => {
    onChange?.({
      type: "change",
      target: {
        name,
        value: {
          type: "scalar",
          numberType: checked ? "timestamp" : "number",
          answers: value?.answers ?? [0, 1],
        },
      },
    });
  };

  const handleNumberChange =
    (
      index: number,
      cb?:
        | ScalarAnswersInputProps["onChange"]
        | ScalarAnswersInputProps["onBlur"],
    ): ChangeEventHandler<HTMLInputElement> =>
    (event) => {
      const parsed = parseFloat(event.target.value);
      const newValue = isNaN(parsed) ? undefined : parsed;
      cb?.({
        type: "change",
        target: {
          name,
          value: {
            type: "scalar",
            numberType: value.numberType,
            answers: (value?.answers.map((v, i) =>
              i === index ? newValue : v,
            ) ?? []) as [number, number],
          },
        },
      });
    };

  const handleDateChange =
    (
      index: number,
      cb?:
        | ScalarAnswersInputProps["onChange"]
        | ScalarAnswersInputProps["onBlur"],
    ) =>
    (event: FormEvent<string>) => {
      const parsed = new Date(event.target.value).getTime();
      const newValue = isNaN(parsed) ? undefined : parsed;
      cb?.({
        type: "change",
        target: {
          name,
          value: {
            type: "scalar",
            numberType: value.numberType,
            answers: (value?.answers.map((v, i) =>
              i === index ? newValue : v,
            ) ?? []) as [number, number],
          },
        },
      });
    };

  return (
    <div>
      <div className="flex center mb-6">
        <div className="mr-3 font-light">Numbers</div>
        <Toggle
          checked={value?.numberType === "timestamp"}
          onChange={handleNumberTypeChange}
        />
        <div className="ml-3 font-light">Dates</div>
      </div>
      <div className="flex justify-center gap-6">
        <div className="">
          {value?.numberType === "timestamp" ? (
            <DateTimePicker
              className="rounded-md bg-orange-100 "
              name="lower-bound"
              value={new Date(value?.answers[0]).toString()}
              onChange={handleDateChange(0, onChange)}
              onBlur={handleDateChange(0, onBlur)}
            />
          ) : (
            <input
              type="number"
              inputMode="numeric"
              className="w-full flex-1 bg-orange-100 rounded-md py-3 px-5"
              value={value?.answers[0]}
              onChange={handleNumberChange(0, onChange)}
              onBlur={handleNumberChange(0, onBlur)}
            />
          )}

          <h4 className="text-xs text-center mt-2 ml-1">Lower bound</h4>
        </div>
        <div className="">
          {value?.numberType === "timestamp" ? (
            <DateTimePicker
              className="rounded-md bg-nyanza-base"
              name="upper-bound"
              value={new Date(value?.answers[1]).toString()}
              onChange={handleDateChange(1, onChange)}
              onBlur={handleDateChange(1, onBlur)}
            />
          ) : (
            <input
              type="number"
              inputMode="numeric"
              className=" w-full flex-1 bg-nyanza-base rounded-md py-3 px-5"
              value={value?.answers[1]}
              onChange={handleNumberChange(1, onChange)}
              onBlur={handleNumberChange(1, onBlur)}
            />
          )}
          <h4 className="text-xs mt-2 ml-1 text-center">Upper bound</h4>
        </div>
      </div>
    </div>
  );
};
