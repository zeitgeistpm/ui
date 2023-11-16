import { Answers } from "lib/state/market-creation/types/form";
import { FormEvent } from "../../types";
import CategoricalAnswersInput from "./Categorical";
import { ScalarAnswersInput } from "./Scalar";
import { FieldState } from "lib/state/market-creation/types/fieldstate";

export type AnswersInputProps = {
  name: string;
  value?: Answers;
  onChange: (event: FormEvent<Answers>) => void;
  onBlur: (event: FormEvent<Answers>) => void;
  fieldState: FieldState;
};

export const AnswersInput = ({
  name,
  value,
  onChange,
  onBlur,
  fieldState,
}: AnswersInputProps) => {
  const handleSelectType = (type: Answers["type"]) => () => {
    const newValue: Answers =
      type === "yes/no"
        ? { type: "yes/no", answers: ["Yes", "No"] }
        : type === "categorical"
          ? { type: "categorical", answers: ["", ""] }
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
      <div className="mb-8 flex items-center justify-center gap-2">
        <button
          type="button"
          className={`rounded-full px-6 py-3 text-sm transition-all active:scale-95 md:px-8 md:py-4  ${
            value?.type === "yes/no" ? "bg-nyanza-base" : "bg-gray-100"
          }`}
          onClick={handleSelectType("yes/no")}
        >
          Yes/No
        </button>

        <button
          type="button"
          className={`rounded-full px-6 py-3 text-sm transition-all active:scale-95 md:px-8 md:py-4 ${
            value?.type === "categorical"
              ? `${
                  fieldState.isTouched && fieldState.isValid
                    ? "bg-nyanza-base"
                    : "bg-fog-of-war text-white"
                }`
              : "bg-gray-100"
          }`}
          onClick={handleSelectType("categorical")}
        >
          Categorical
        </button>

        <button
          type="button"
          className={`rounded-full px-6 py-3 text-sm transition-all active:scale-95 md:px-8 md:py-4 ${
            value?.type === "scalar"
              ? `${
                  fieldState.isTouched && fieldState.isValid
                    ? "bg-nyanza-base"
                    : "bg-fog-of-war text-white"
                }`
              : "bg-gray-100"
          }`}
          onClick={handleSelectType("scalar")}
        >
          Scalar
        </button>
      </div>

      <div>
        {value?.type === "categorical" && (
          <CategoricalAnswersInput
            name="categorical-answers"
            value={value}
            onBlur={handleBlur}
            onChange={handleChange}
          />
        )}
        {value?.type === "scalar" && (
          <div className="mb-3">
            <ScalarAnswersInput
              name="scalar-answers"
              value={value}
              onBlur={handleBlur}
              onChange={handleChange}
            />
          </div>
        )}
        {value?.type === "yes/no" && (
          <CategoricalAnswersInput
            name="categorical-answers"
            disabled={true}
            value={value}
          />
        )}
      </div>
    </>
  );
};
