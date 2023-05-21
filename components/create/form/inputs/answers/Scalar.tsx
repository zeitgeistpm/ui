import { ScalarAnswers } from "lib/state/market-creation/types/form";
import { ChangeEventHandler } from "react";
import { FormEvent } from "../../types";

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
  const handleChange =
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
            answers: (value?.answers.map((v, i) =>
              i === index ? newValue : v,
            ) ?? []) as [number, number],
          },
        },
      });
    };

  return (
    <div>
      <div className="flex justify-center gap-6">
        <div className="">
          <input
            type="number"
            inputMode="numeric"
            className="w-full flex-1 bg-orange-100 rounded-md py-3 px-5"
            value={value?.answers[0]}
            onChange={handleChange(0, onChange)}
            onBlur={handleChange(0, onBlur)}
          />
          <h4 className="text-xs text-center mt-2 ml-1">Lower bound</h4>
        </div>
        <div className="">
          <input
            type="number"
            inputMode="numeric"
            className=" w-full flex-1 bg-nyanza-base rounded-md py-3 px-5"
            value={value?.answers[1]}
            onChange={handleChange(1, onChange)}
            onBlur={handleChange(1, onBlur)}
          />
          <h4 className="text-xs mt-2 ml-1 text-center">Upper bound</h4>
        </div>
      </div>
    </div>
  );
};
