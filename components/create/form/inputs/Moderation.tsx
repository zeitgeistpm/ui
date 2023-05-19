import { Moderation } from "lib/state/market-creation/types/form";
import { FormEvent } from "../types";

export type ModerationModeSelectProps = {
  name: string;
  value?: Moderation;
  onChange: (event: FormEvent<Moderation>) => void;
  onBlur: (event: FormEvent<Moderation>) => void;
};

export const options: Array<{
  mode: Moderation;
  description: string;
  cost: number;
}> = [
  {
    mode: "Permissionless",
    description: "More expensive, but goes live as soon as you need.",
    cost: 120,
  },
  {
    mode: "Advised",
    description:
      "Cheaper, but but requires approval from the advisory committee before becoming active.",
    cost: 100,
  },
];

export const ModerationModeSelect: React.FC<ModerationModeSelectProps> = ({
  name,
  value,
  onChange,
  onBlur,
}) => {
  const handleSelect = (mode: Moderation) => () => {
    onChange({ target: { name, value: mode }, type: "change" });
    onBlur({ target: { name, value: mode }, type: "blur" });
  };

  return (
    <div className="flex center gap-6">
      {options.map((option, index) => (
        <button
          type="button"
          className={`
              flex flex-col flex-1 max-w-sm rounded-md p-6 min-h-[230px] cursor-pointer transition-all 
              ${value === option.mode ? "bg-nyanza-base" : "bg-gray-200"}
            `}
          onClick={handleSelect(option.mode)}
        >
          <div className="flex flex-1 flex-row pt-2">
            <div className="flex flex-col flex-1 text-center">
              <h3 className="text-2xl mb-4">{option.mode}</h3>
              <p className="flex-1 mx-auto mb-4">{option.description}</p>
              <p className="">
                <span className="text-xs text-gray-500">Bond Cost: </span>
                <span className="text-xs text-gray-900">{option.cost} ZTG</span>
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ModerationModeSelect;
