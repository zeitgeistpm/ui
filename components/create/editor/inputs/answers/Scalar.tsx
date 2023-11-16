import { ScalarAnswers } from "lib/state/market-creation/types/form";
import { ChangeEventHandler } from "react";
import { FormEvent } from "../../types";
import Toggle from "components/ui/Toggle";
import DateTimePicker from "../DateTime";
import Input from "components/ui/Input";

export type ScalarAnswersInputProps = {
  name: string;
  value?: ScalarAnswers;
  onChange?: (event: FormEvent<ScalarAnswers>) => void;
  onBlur?: (event: FormEvent<ScalarAnswers>) => void;
  disabled?: boolean;
  isValid?: boolean;
};

export const ScalarAnswersInput = ({
  name,
  value,
  onChange,
  onBlur,
  isValid,
}: ScalarAnswersInputProps) => {
  const handleNumberTypeChange = (checked: boolean) => {
    onChange?.({
      type: "change",
      target: {
        name,
        value: {
          type: "scalar",
          numberType: checked ? "date" : "number",
          answers: checked ? [Date.now(), Date.now() + 604800000] : [0, 1],
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
            numberType: value?.numberType ?? "number",
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
            numberType: value?.numberType ?? "number",
            answers: (value?.answers.map((v, i) =>
              i === index ? newValue : v,
            ) ?? []) as [number, number],
          },
        },
      });
    };

  return (
    <div>
      <div className="center mb-6 flex">
        <div className="mr-3 text-sm font-light">Numbers</div>
        <Toggle
          checked={value?.numberType === "date"}
          onChange={handleNumberTypeChange}
        />
        <div className="ml-3 text-sm font-light">Dates</div>
      </div>
      <div className="flex justify-center gap-6">
        <div className="">
          {value?.numberType === "date" ? (
            <DateTimePicker
              name="lower-bound"
              className={`rounded-md bg-gray-100`}
              value={new Date(value?.answers[0]).toString()}
              onChange={handleDateChange(0, onChange)}
              onBlur={handleDateChange(0, onBlur)}
            />
          ) : (
            <Input
              type="number"
              inputMode="numeric"
              className={`w-full flex-1 rounded-md bg-gray-100 px-5 py-3 outline-none`}
              value={value?.answers[0]}
              onChange={handleNumberChange(0, onChange)}
              onBlur={handleNumberChange(0, onBlur)}
            />
          )}

          <h4 className="ml-1 mt-2 text-center text-xs">Short</h4>
        </div>
        <div className="">
          {value?.numberType === "date" ? (
            <DateTimePicker
              className={`rounded-md bg-gray-100`}
              name="upper-bound"
              value={new Date(value?.answers[1]).toString()}
              onChange={handleDateChange(1, onChange)}
              onBlur={handleDateChange(1, onBlur)}
            />
          ) : (
            <Input
              type="number"
              inputMode="numeric"
              className={` w-full flex-1 rounded-md bg-gray-100 px-5 py-3 outline-none`}
              value={value?.answers[1]}
              onChange={handleNumberChange(1, onChange)}
              onBlur={handleNumberChange(1, onBlur)}
            />
          )}
          <h4 className="ml-1 mt-2 text-center text-xs">Long</h4>
        </div>
      </div>
    </div>
  );
};
