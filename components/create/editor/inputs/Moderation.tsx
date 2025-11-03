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

  return (
    <div
      className="flex w-full items-center rounded-lg border-2 border-white/20 backdrop-blur-sm transition-all h-12 bg-white/10 hover:border-white/30"
    >
      <select
        value={value || ""}
        className="w-full h-full bg-transparent px-4 py-3 text-left text-sm text-white outline-none placeholder:text-white/50"
        onChange={(e) => {
          const selectedValue = e.target.value || undefined;
          onChange({ target: { name, value: selectedValue as Moderation | undefined }, type: "change" });
          onBlur({ target: { name, value: selectedValue as Moderation | undefined }, type: "blur" });
        }}
      >
        <option value="" className="bg-ztg-primary-600 text-white">
          Select market type
        </option>
        {options.map((option, index) => (
          <option
            key={index}
            value={option.mode}
            className="bg-ztg-primary-600 text-white"
          >
            {option.mode} - {option.description} (
            {option.mode === "Permissionless"
              ? constants?.markets.validityBond
              : constants?.markets.advisoryBond}{" "}
            ZTG)
          </option>
        ))}
      </select>
    </div>
  );
};

export default ModerationModeSelect;
