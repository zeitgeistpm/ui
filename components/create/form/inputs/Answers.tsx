import { Answers } from "lib/state/market-creation/types";
import { FormEvent } from "../types";

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

  return (
    <>
      <div className="flex center">
        <button
          type="button"
          className={`text-sm rounded-full py-4 px-8 mr-4 ${
            value?.type === "yes/no"
              ? "bg-fog-of-war text-white"
              : "bg-platinum"
          }`}
          onClick={handleSelect("yes/no")}
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
          onClick={handleSelect("categorical")}
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
          onClick={handleSelect("scalar")}
        >
          Scalar
        </button>
        <button
          type="button"
          className={`text-sm rounded-full py-4 px-8 mr-4 ${
            value?.type === "yes/no"
              ? "bg-fog-of-war text-white"
              : "bg-platinum"
          }`}
          onClick={() => {
            onChange({ target: { name, value: undefined }, type: "change" });
          }}
        >
          Clear
        </button>
      </div>
    </>
  );
};
