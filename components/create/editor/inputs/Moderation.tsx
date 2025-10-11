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
    description: "Goes live immediately",
  },
  {
    mode: "Advised",
    description: "Requires committee approval",
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
    <div className="flex flex-col gap-2 md:flex-row md:gap-2">
      {options.map((option, index) => (
        <button
          key={index}
          type="button"
          className={`flex h-[72px] flex-1 cursor-pointer flex-col justify-center rounded-md border p-2 text-left backdrop-blur-md transition-all active:scale-95 ${
            value === option.mode
              ? "border-sky-600/50 bg-sky-600/90 text-white shadow-md"
              : "border-sky-200/30 bg-white/80 text-sky-900 hover:bg-sky-100/80"
          }`}
          onClick={handleSelect(option.mode)}
        >
          <h3 className="text-xs font-semibold leading-tight">{option.mode}</h3>
          <p className="mt-0.5 text-[11px] leading-tight opacity-75">
            {option.description} •{" "}
            {option.mode === "Permissionless"
              ? constants?.markets.validityBond
              : constants?.markets.advisoryBond}{" "}
            ZTG
          </p>
        </button>
      ))}
    </div>
  );
};

export default ModerationModeSelect;
