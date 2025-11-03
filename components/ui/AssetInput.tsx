import React from "react";
import AssetSelect, { AssetOption } from "./AssetSelect";
import Input from "./Input";

type AssetInputProps = {
  options: AssetOption[];
  selectedOption?: AssetOption;
  onAssetChange?: (opt: AssetOption) => void;
  amount?: string;
  onAmountChange?: (amount: string) => void;
  error?: string;
};

const AssetInput: React.FC<AssetInputProps> = ({
  options,
  selectedOption,
  onAssetChange,
  amount = "",
  onAmountChange,
  error,
}) => {
  return (
    <div
      className={
        "relative h-14 w-full rounded-md border-2 transition-colors " +
        (error
          ? "border-ztg-red-500"
          : "border-white/10 hover:border-white/20") +
        " bg-white/10 backdrop-blur-md"
      }
    >
      <AssetSelect
        options={options}
        selectedOption={selectedOption}
        onChange={(option) => {
          onAssetChange?.(option);
        }}
      />
      <Input
        type="number"
        step="any"
        value={amount}
        onChange={(e) => {
          onAmountChange?.(e.target.value);
        }}
        className="absolute right-4 top-[50%] translate-y-[-50%] bg-transparent !px-3 text-right text-lg text-white placeholder:text-white/50"
      />
      {error && (
        <div className="text-right text-sm text-ztg-red-400 mt-1">{error}</div>
      )}
    </div>
  );
};

export default AssetInput;
