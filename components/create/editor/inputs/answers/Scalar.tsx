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
    <div className="space-y-3">
      {/* Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-white/70">Type:</span>
        <div className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-2 backdrop-blur-sm">
          <span className="text-xs font-medium text-white">Numbers</span>
          <Toggle
            checked={value?.numberType === "date"}
            activeClassName="bg-ztg-green-600"
            onChange={handleNumberTypeChange}
          />
          <span className="text-xs font-medium text-white">Dates</span>
        </div>
      </div>

      {/* Range Inputs */}
      <div className="flex flex-col gap-2">
        <div className="flex w-full items-center gap-2">
          <span className="flex-shrink-0 text-xs font-medium text-white/70">
            Short:
          </span>
          {value?.numberType === "date" ? (
            <div className="flex-1">
              <DateTimePicker
                name="lower-bound"
                className="w-full"
                value={new Date(value?.answers[0]).toString()}
                onChange={handleDateChange(0, onChange)}
                onBlur={handleDateChange(0, onBlur)}
              />
            </div>
          ) : (
            <Input
              type="number"
              inputMode="numeric"
              className="flex-1 rounded-lg bg-white/10 px-4 py-3 text-sm text-white outline-none backdrop-blur-sm transition-all placeholder:text-white/50 hover:border-white/30"
              value={value?.answers[0]}
              onChange={handleNumberChange(0, onChange)}
              onBlur={handleNumberChange(0, onBlur)}
              placeholder="Minimum value"
            />
          )}
        </div>
        <div className="flex w-full items-center gap-2">
          <span className="flex-shrink-0 text-xs font-medium text-white/70">
            Long:
          </span>
          {value?.numberType === "date" ? (
            <div className="flex-1">
              <DateTimePicker
                className="w-full"
                name="upper-bound"
                value={new Date(value?.answers[1]).toString()}
                onChange={handleDateChange(1, onChange)}
                onBlur={handleDateChange(1, onBlur)}
              />
            </div>
          ) : (
            <Input
              type="number"
              inputMode="numeric"
              className="flex-1 rounded-lg bg-white/10 px-4 py-3 text-sm text-white outline-none backdrop-blur-sm transition-all placeholder:text-white/50 hover:border-white/30"
              value={value?.answers[1]}
              onChange={handleNumberChange(1, onChange)}
              onBlur={handleNumberChange(1, onBlur)}
              placeholder="Maximum value"
            />
          )}
        </div>
      </div>
    </div>
  );
};
