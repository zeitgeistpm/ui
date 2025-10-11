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
    <div className="flex flex-wrap flex-col md:flex-row items-center gap-2">
      {/* Toggle */}
      <div className="flex flex-shrink-0 items-center gap-1.5 rounded-full border border-sky-200/30 bg-white/80 px-3 py-1.5 shadow-sm backdrop-blur-md">
        <div className="text-xs font-medium text-sky-900">Numbers</div>
        <Toggle
          checked={value?.numberType === "date"}
          activeClassName="bg-sky-600"
          onChange={handleNumberTypeChange}
        />
        <div className="text-xs font-medium text-sky-900">Dates</div>
      </div>

      {/* Range Inputs - Column on mobile, Row on desktop */}
      <div className="flex min-w-0 flex-1 flex-col items-stretch gap-2 md:flex-row md:items-center">
        <div className="flex w-full flex-1 items-center gap-1.5 md:min-w-[120px]">
          <span className="flex-shrink-0 text-xs font-medium text-sky-700">Short:</span>
          {value?.numberType === "date" ? (
            <DateTimePicker
              name="lower-bound"
              className="flex-1 rounded-lg border border-sky-200/30 bg-white/80 shadow-sm backdrop-blur-md"
              value={new Date(value?.answers[0]).toString()}
              onChange={handleDateChange(0, onChange)}
              onBlur={handleDateChange(0, onBlur)}
            />
          ) : (
            <Input
              type="number"
              inputMode="numeric"
              className="w-full flex-1 rounded-lg border border-sky-200/30 bg-white/80 px-3 py-1.5 text-sm text-sky-900 shadow-sm outline-none backdrop-blur-md transition-shadow focus:shadow-md"
              value={value?.answers[0]}
              onChange={handleNumberChange(0, onChange)}
              onBlur={handleNumberChange(0, onBlur)}
            />
          )}
        </div>
        <div className="flex w-full flex-1 items-center gap-1.5 md:min-w-[120px]">
          <span className="flex-shrink-0 text-xs font-medium text-sky-700">Long:</span>
          {value?.numberType === "date" ? (
            <DateTimePicker
              className="flex-1 rounded-lg border border-sky-200/30 bg-white/80 shadow-sm backdrop-blur-md"
              name="upper-bound"
              value={new Date(value?.answers[1]).toString()}
              onChange={handleDateChange(1, onChange)}
              onBlur={handleDateChange(1, onBlur)}
            />
          ) : (
            <Input
              type="number"
              inputMode="numeric"
              className="w-full flex-1 rounded-lg border border-sky-200/30 bg-white/80 px-3 py-1.5 text-sm text-sky-900 shadow-sm outline-none backdrop-blur-md transition-shadow focus:shadow-md"
              value={value?.answers[1]}
              onChange={handleNumberChange(1, onChange)}
              onBlur={handleNumberChange(1, onBlur)}
            />
          )}
        </div>
      </div>
    </div>
  );
};
