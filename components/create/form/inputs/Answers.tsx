import {
  Answers,
  CategoricalAnswers,
  ScalarAnswers,
  YesNoAnswers,
} from "lib/state/market-creation/types/form";
import { FormEvent } from "../types";
import { ChangeEvent, ChangeEventHandler, useEffect } from "react";

export type AnswersInputProps = {
  name: string;
  value?: Answers;
  onChange: (event: FormEvent<Answers>) => void;
  onBlur: (event: FormEvent<Answers>) => void;
};

export const AnswersInput = ({
  name,
  value,
  onChange,
  onBlur,
}: AnswersInputProps) => {
  const handleSelectType = (type: Answers["type"]) => () => {
    const newValue: Answers =
      type === "yes/no"
        ? { type: "yes/no", answers: ["Yes", "No"] }
        : type === "categorical"
        ? { type: "categorical", answers: ["A", "B"] }
        : { type: "scalar", answers: [0, 1] };

    onChange({ target: { name, value: newValue }, type: "change" });
  };

  const handleChange = (event: FormEvent<Answers>) => {
    onChange?.(event);
  };

  const handleBlur = (event: FormEvent<Answers>) => {
    onBlur?.(event);
  };

  return (
    <>
      <div className="flex center mb-12">
        <button
          type="button"
          className={`text-sm rounded-full py-4 px-8 mr-4 ${
            value?.type === "yes/no"
              ? "bg-fog-of-war text-white"
              : "bg-platinum"
          }`}
          onClick={handleSelectType("yes/no")}
        >
          Yes/No
        </button>
        <button
          type="button"
          className={`text-sm rounded-full py-4 px-8 mr-4 ${
            value?.type === "categorical"
              ? "bg-fog-of-war text-white"
              : "bg-platinum"
          }`}
          onClick={handleSelectType("categorical")}
        >
          Options
        </button>
        <button
          type="button"
          className={`text-sm rounded-full py-4 px-8 mr-4 ${
            value?.type === "scalar"
              ? "bg-fog-of-war text-white"
              : "bg-platinum"
          }`}
          onClick={handleSelectType("scalar")}
        >
          Scalar
        </button>
        <button
          type="button"
          className={`text-sm rounded-full py-4 px-8 mr-4 `}
          onClick={() => {
            onChange({ target: { name, value: undefined }, type: "change" });
          }}
        >
          Clear
        </button>
      </div>
      <div className="">
        {value?.type === "categorical" && (
          <CategoricalAnswersInput
            value={value}
            onBlur={handleBlur}
            onChange={handleChange}
          />
        )}
        {value?.type === "scalar" && (
          <ScalarAnswersInput
            value={value}
            onBlur={handleBlur}
            onChange={handleChange}
          />
        )}
        {value?.type === "yes/no" && (
          <CategoricalAnswersInput disabled={true} value={value} />
        )}
      </div>
    </>
  );
};

type CategoricalAnswersInputProps = {
  name?: string;
  value?: CategoricalAnswers | YesNoAnswers;
  onChange?: (event: FormEvent<CategoricalAnswers>) => void;
  onBlur?: (event: FormEvent<CategoricalAnswers>) => void;
  disabled?: boolean;
};

const CategoricalAnswersInput = ({
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
          answers: [
            ...(value?.answers ?? []),
            `option ${value?.answers?.length ?? 0 + 1}`,
          ] as string[],
        },
      },
    });
  };

  return (
    <div className="mb-6">
      <div className="mb-6">
        <div className="flex center gap-6">
          {value?.answers.map((answer: string, index: number) => {
            const bg =
              value?.type === "yes/no" && answer === "Yes"
                ? "bg-green-200"
                : value?.type === "yes/no" && answer === "No"
                ? "bg-orange-200"
                : "bg-gray-200";
            return (
              <div>
                <input
                  disabled={disabled}
                  key={index}
                  className={`${bg} rounded-md py-3 px-5`}
                  value={answer}
                  onChange={handleChange(index, onChange)}
                  onBlur={handleChange(index, onBlur)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {!disabled && (
        <div className="flex center">
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

type ScalarAnswersInputProps = {
  name?: string;
  value?: ScalarAnswers;
  onChange?: (event: FormEvent<ScalarAnswers>) => void;
  onBlur?: (event: FormEvent<ScalarAnswers>) => void;
  disabled?: boolean;
};

const ScalarAnswersInput = ({
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
    <div className="flex center gap-6">
      <input
        type="number"
        inputMode="numeric"
        className="bg-gray-200 rounded-md py-3 px-5"
        value={value?.answers[0]}
        onChange={handleChange(0, onChange)}
        onBlur={handleChange(0, onBlur)}
      />
      <input
        type="number"
        inputMode="numeric"
        className="bg-gray-200 rounded-md py-3 px-5"
        value={value?.answers[1]}
        onChange={handleChange(1, onChange)}
        onBlur={handleChange(1, onBlur)}
      />
    </div>
  );
};
