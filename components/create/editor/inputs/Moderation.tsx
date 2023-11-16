import { Moderation } from "lib/state/market-creation/types/form";
import { FormEvent } from "../types";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";

export type ModerationModeSelectProps = {
  name: string;
  value?: Moderation;
  onChange: (event: FormEvent<Moderation>) => void;
  onBlur: (event: FormEvent<Moderation>) => void;
};

export const options: Array<{
  mode: Moderation;
  description: string;
}> = [
  {
    mode: "Permissionless",
    description: "More expensive, but goes live as soon as you need.",
  },
  {
    mode: "Advised",
    description:
      "Cheaper, but but requires approval from the advisory committee before becoming active.",
  },
];

export const ModerationModeSelect: React.FC<ModerationModeSelectProps> = ({
  name,
  value,
  onChange,
  onBlur,
}) => {
  const { data: constants } = useChainConstants();

  const handleSelect = (mode: Moderation) => () => {
    onChange({ target: { name, value: mode }, type: "change" });
    onBlur({ target: { name, value: mode }, type: "blur" });
  };

  return (
    <div className="flex flex-col gap-4 md:flex-row md:justify-center md:gap-6">
      {options.map((option, index) => (
        <button
          key={index}
          type="button"
          className={`
              flex max-w-sm flex-1 cursor-pointer flex-col rounded-md p-6 transition-all active:scale-95 md:min-h-[230px]
              ${value === option.mode ? "bg-nyanza-base" : "bg-gray-100"}
            `}
          onClick={handleSelect(option.mode)}
        >
          <div className="flex flex-1 flex-row pt-2">
            <div className="flex flex-1 flex-col text-center">
              <h3 className="mb-4 text-2xl">{option.mode}</h3>
              <p className="mx-auto mb-4 flex-1 text-sm md:text-base">
                {option.description}
              </p>
              <p className="">
                <span className="text-xs text-gray-500">Bond Cost: </span>
                <span className="text-xs text-gray-900">
                  {option.mode === "Permissionless"
                    ? constants?.markets.validityBond
                    : constants?.markets.advisoryBond}
                  ZTG
                </span>
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ModerationModeSelect;
