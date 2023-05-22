import { Answers } from "lib/state/market-creation/types/form";
import { FormEvent } from "../../types";
import CategoricalAnswersInput from "./Categorical";
import { ScalarAnswersInput } from "./Scalar";

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
        : { type: "scalar", numberType: "number", answers: [0, 1] };

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
      <div className="flex justify-center items-center mb-12 gap-2">
        <button
          type="button"
          className={`text-sm rounded-full py-3 px-6 md:py-4 md:px-8  ${
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
          className={`text-sm rounded-full py-3 px-6 md:py-4 md:px-8 ${
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
          className={`text-sm rounded-full py-3 px-6 md:py-4 md:px-8 ${
            value?.type === "scalar"
              ? "bg-fog-of-war text-white"
              : "bg-platinum"
          }`}
          onClick={handleSelectType("scalar")}
        >
          Scalar
        </button>
      </div>

      <div className="flex justify-center">
        {value?.type === "categorical" && (
          <CategoricalAnswersInput
            value={value}
            onBlur={handleBlur}
            onChange={handleChange}
          />
        )}
        {value?.type === "scalar" && (
          <div className="mb-3">
            <ScalarAnswersInput
              value={value}
              onBlur={handleBlur}
              onChange={handleChange}
            />
          </div>
        )}
        {value?.type === "yes/no" && (
          <CategoricalAnswersInput disabled={true} value={value} />
        )}
      </div>
    </>
  );
};
