import {
  CategoricalAnswers,
  YesNoAnswers,
} from "lib/state/market-creation/types/form";
import { ChangeEventHandler } from "react";
import { FormEvent } from "../../types";

export type CategoricalAnswersInputProps = {
  name?: string;
  value?: CategoricalAnswers | YesNoAnswers;
  onChange?: (event: FormEvent<CategoricalAnswers>) => void;
  onBlur?: (event: FormEvent<CategoricalAnswers>) => void;
  disabled?: boolean;
};

export const CategoricalAnswersInput = ({
  name,
  value,
  onChange,
  onBlur,
  disabled,
}: CategoricalAnswersInputProps) => {
  const handleChange =
    (
      index: number,
      cb?:
        | CategoricalAnswersInputProps["onChange"]
        | CategoricalAnswersInputProps["onBlur"],
    ): ChangeEventHandler<HTMLInputElement> =>
    (event) => {
      cb?.({
        type: "change",
        target: {
          name,
          value: {
            type: "categorical",
            answers:
              value?.answers.map((v, i) =>
                i === index ? event.target.value : v,
              ) ?? [],
          },
        },
      });
    };

  const handleAddOptionClick = () => {
    onChange?.({
      type: "change",
      target: {
        name,
        value: {
          type: "categorical",
          answers: [...(value?.answers ?? []), ""] as string[],
        },
      },
    });
  };

  const handleClearClick = (index: number) => () => {
    onChange?.({
      type: "change",
      target: {
        name,
        value: {
          type: "categorical",
          answers: (value?.answers.filter((_, i) => i !== index) ??
            []) as string[],
        },
      },
    });
  };

  return (
    <div>
      <div className="mb-6 md:flex justify-center items-center">
        <div className="flex-1 md:flex justify-center">
          <div>
            {value?.answers.map((answer: string, index: number) => {
              const bg =
                value?.type === "yes/no" && answer === "Yes"
                  ? "bg-nyanza-base"
                  : value?.type === "yes/no" && answer === "No"
                  ? "bg-orange-100"
                  : "bg-gray-200";
              return (
                <div
                  className={`relative flex-1 ${bg} w-full rounded-md md:min-w-[520px] md:max-w-[420px] py-3 px-5 mb-3`}
                >
                  <input
                    disabled={disabled}
                    key={index}
                    className={`h-full w-full bg-transparent outline-none`}
                    value={answer}
                    onChange={handleChange(index, onChange)}
                    onBlur={handleChange(index, onBlur)}
                    placeholder={`Answer ${index + 1}`}
                  />
                  {!disabled && (
                    <div className="absolute flex gap-2 z-10 right-2 top-[50%] translate-y-[-50%] ">
                      <button
                        type="button"
                        className=" bg-white rounded-md py-1 px-2"
                        onClick={handleClearClick(index)}
                      >
                        clear
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {!disabled && (
        <div className="flex center mb-4">
          <button
            type="button"
            className="border-gray-300 text-sm border-2 rounded-full py-4 px-8 transition-all false"
            onClick={handleAddOptionClick}
          >
            +
          </button>
        </div>
      )}
    </div>
  );
};

export default CategoricalAnswersInput;
