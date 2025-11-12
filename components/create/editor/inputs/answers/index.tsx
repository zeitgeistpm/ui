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
    <div className="space-y-4">
      {/* Type Selector - Improved Layout */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={`rounded-lg border-2 px-4 py-3 text-sm font-semibold backdrop-blur-sm transition-all active:scale-95 ${
              value?.type === "yes/no"
                ? "border-ztg-green-600/80 bg-ztg-green-600/90 text-white/90 shadow-md hover:border-ztg-green-500 hover:bg-ztg-green-600"
                : "border-white/20 bg-white/10 text-white/90 hover:border-white/30 hover:bg-white/20"
            }`}
            onClick={handleSelectType("yes/no")}
          >
            Yes/No
          </button>

          <button
            type="button"
            className={`rounded-lg border-2 px-4 py-3 text-sm font-semibold backdrop-blur-sm transition-all active:scale-95 ${
              value?.type === "categorical"
                ? "border-ztg-green-600/80 bg-ztg-green-600/90 text-white/90 shadow-md hover:border-ztg-green-500 hover:bg-ztg-green-600"
                : "border-white/20 bg-white/10 text-white/90 hover:border-white/30 hover:bg-white/20"
            }`}
            onClick={handleSelectType("categorical")}
          >
            Categorical
          </button>

          <button
            type="button"
            className={`rounded-lg border-2 px-4 py-3 text-sm font-semibold backdrop-blur-sm transition-all active:scale-95 ${
              value?.type === "scalar"
                ? "border-ztg-green-600/80 bg-ztg-green-600/90 text-white/90 shadow-md hover:border-ztg-green-500 hover:bg-ztg-green-600"
                : "border-white/20 bg-white/10 text-white/90 hover:border-white/30 hover:bg-white/20"
            }`}
            onClick={handleSelectType("scalar")}
          >
            Scalar
          </button>
        </div>
      </div>

      {/* Answer Inputs - Full Width Below */}
      <div className="w-full">
        {value?.type === "categorical" && (
          <div className="space-y-3">
            <CategoricalAnswersInput
              name="categorical-answers"
              value={value}
              onBlur={handleBlur}
              onChange={handleChange}
            />
            {/* Preview of how answers will appear */}
            {value.answers &&
              value.answers.length > 0 &&
              value.answers.some((a) => a.trim() !== "") && (
                <div className="rounded-lg bg-white/5 p-3">
                  <p className="mb-2 text-xs font-medium text-white/70">
                    Preview: How your answers will appear
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {value.answers
                      .filter((a) => a.trim() !== "")
                      .map((answer, idx) => (
                        <div
                          key={idx}
                          className="rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-white/90 backdrop-blur-sm"
                        >
                          {answer}
                        </div>
                      ))}
                  </div>
                </div>
              )}
          </div>
        )}
        {value?.type === "scalar" && (
          <div className="space-y-3">
            <ScalarAnswersInput
              name="scalar-answers"
              value={value}
              onBlur={handleBlur}
              onChange={handleChange}
            />
            {/* Preview for scalar range */}
            {value.answers && value.answers.length >= 2 && (
              <div className="rounded-lg bg-white/5 p-3">
                <p className="mb-2 text-xs font-medium text-white/70">
                  Preview: Range
                </p>
                <div className="flex items-center gap-2 text-sm">
                  <span className="rounded-lg bg-white/10 px-3 py-2 font-medium text-white/90 backdrop-blur-sm">
                    {value.numberType === "date"
                      ? new Date(value.answers[0]).toLocaleDateString()
                      : value.answers[0]}
                  </span>
                  <span className="text-white/70">→</span>
                  <span className="rounded-lg bg-white/10 px-3 py-2 font-medium text-white/90 backdrop-blur-sm">
                    {value.numberType === "date"
                      ? new Date(value.answers[1]).toLocaleDateString()
                      : value.answers[1]}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
        {value?.type === "yes/no" && (
          <div className="space-y-3">
            {/* Preview of how answers will appear */}
            <div className="rounded-lg bg-white/5 p-3">
              <p className="mb-2 text-xs font-medium text-white/70">
                Preview: How your answers will appear
              </p>
              <div className="flex flex-wrap gap-2">
                {value.answers &&
                  value.answers.map((answer, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg bg-white/10 px-3 py-2 text-xs font-medium text-white/90 backdrop-blur-sm"
                    >
                      {answer}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
