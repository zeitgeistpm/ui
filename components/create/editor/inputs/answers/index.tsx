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
    <div className="flex flex-wrap items-center gap-3">
      {/* Type Selector - Horizontal Row */}
      <div className="flex flex-shrink-0 items-center gap-2">
        <button
          type="button"
          className={`rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-md transition-all active:scale-95 ${
            value?.type === "yes/no"
              ? "border-2 border-sky-600/50 bg-sky-600/90 text-white shadow-md"
              : "border-2 border-sky-200/30 bg-white/80 text-sky-900 hover:bg-sky-100/80"
          }`}
          onClick={handleSelectType("yes/no")}
        >
          Yes/No
        </button>

        <button
          type="button"
          className={`rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-md transition-all active:scale-95 ${
            value?.type === "categorical"
              ? "border-2 border-sky-600/50 bg-sky-600/90 text-white shadow-md"
              : "border-2 border-sky-200/30 bg-white/80 text-sky-900 hover:bg-sky-100/80"
          }`}
          onClick={handleSelectType("categorical")}
        >
          Categorical
        </button>

        <button
          type="button"
          className={`rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-md transition-all active:scale-95 ${
            value?.type === "scalar"
              ? "border-2 border-sky-600/50 bg-sky-600/90 text-white shadow-md"
              : "border-2 border-sky-200/30 bg-white/80 text-sky-900 hover:bg-sky-100/80"
          }`}
          onClick={handleSelectType("scalar")}
        >
          Scalar
        </button>
      </div>

      {/* Vertical Divider */}
      <div className="h-8 w-px flex-shrink-0 bg-gradient-to-b from-transparent via-sky-200/50 to-transparent" />

      {/* Answer Inputs - Inline on same row */}
      <div className="min-w-0 flex-1">
        {value?.type === "categorical" && (
          <CategoricalAnswersInput
            name="categorical-answers"
            value={value}
            onBlur={handleBlur}
            onChange={handleChange}
          />
        )}
        {value?.type === "scalar" && (
          <ScalarAnswersInput
            name="scalar-answers"
            value={value}
            onBlur={handleBlur}
            onChange={handleChange}
          />
        )}
        {value?.type === "yes/no" && (
          <CategoricalAnswersInput
            name="categorical-answers"
            disabled={true}
            value={value}
          />
        )}
      </div>
    </div>
  );
};
