import { Answers, CategoricalAnswers, ScalarAnswers, YesNoAnswers } from "lib/state/market-creation/types";
import { FormEvent } from "../types";
import { ChangeEventHandler, useEffect } from "react";

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
  const handleSelect = (type: Answers["type"]) => () => {
    const newValue: Answers =
      type === "yes/no"
        ? { type: "yes/no", answers: ["Yes", "No"] }
        : type === "categorical"
          ? { type: "categorical", answers: ["A", "B"] }
          : { type: "scalar", answers: [0, 1] };

    onChange({ target: { name, value: newValue }, type: "change" });
  };

  const handleChange = (event: FormEvent<Answers>) => {
    onChange(event)
  }

  return (
    <>
      <div className="flex center mb-12">
        <button
          type="button"
          className={`text-sm rounded-full py-4 px-8 mr-4 ${value?.type === "yes/no"
            ? "bg-fog-of-war text-white"
            : "bg-platinum"
            }`}
          onClick={handleSelect("yes/no")}
        >
          Yes/No
        </button>
        <button
          type="button"
          className={`text-sm rounded-full py-4 px-8 mr-4 ${value?.type === "categorical"
            ? "bg-fog-of-war text-white"
            : "bg-platinum"
            }`}
          onClick={handleSelect("categorical")}
        >
          Options
        </button>
        <button
          type="button"
          className={`text-sm rounded-full py-4 px-8 mr-4 ${value?.type === "scalar"
            ? "bg-fog-of-war text-white"
            : "bg-platinum"
            }`}
          onClick={handleSelect("scalar")}
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
        {value?.type === "categorical" && <CategoricalAnswersInput onBlur={handleChange} onChange={handleChange} value={value} />}
        {value?.type === "scalar" && <ScalarAnswersInput value={value} />}
        {value?.type === "yes/no" && <CategoricalAnswersInput disabled={true} value={value} />}
      </div>
    </>
  );
};

type CategoricalAnswersInputProps = {
  name?: string
  value?: CategoricalAnswers | YesNoAnswers
  onChange?: (event: FormEvent<CategoricalAnswers>) => void;
  onBlur?: (event: FormEvent<CategoricalAnswers>) => void;
  disabled?: boolean
}

const CategoricalAnswersInput = ({ name, value, onChange, disabled }: CategoricalAnswersInputProps) => {

  const handleChange = (index: number): ChangeEventHandler<HTMLInputElement> => (event) => {
    onChange?.({
      type: "change",
      target: {
        name,
        value: {
          type: "categorical",
          answers: value?.answers.map((v, i) => i === index ? event.target.value : v) ?? []
        }
      }
    })
  }



  return <div className="flex center gap-6">
    {
      value?.answers.map((answer: string, index: number) => {
        const bg =
          value?.type === "yes/no" && answer === "Yes" ? "bg-green-200" :
            value?.type === "yes/no" && answer === "No" ? "bg-orange-200"
              : "bg-gray-200"
        return <div>
          <input disabled={disabled} key={index} className={`${bg} rounded-md py-3 px-5`} value={answer} onChange={handleChange(index)} />
        </div>
      })
    }
  </div>
}

type ScalarAnswersInputProps = {
  value?: ScalarAnswers
}

const ScalarAnswersInput = ({ value }: ScalarAnswersInputProps) => {
  return <div className="flex center gap-6">
    <input type="number" className="bg-gray-200 rounded-md py-3 px-5" value={value?.answers[0]} />
    <input type="number" className="bg-gray-200 rounded-md py-3 px-5" value={value?.answers[1]} />
  </div>
}
