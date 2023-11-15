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
        "relative mb-5 h-14 w-full rounded-md border-1 border-transparent bg-anti-flash-white " +
        (error ? "border-vermilion" : "")
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
        className="absolute right-4 top-[50%] translate-y-[-50%] bg-transparent !px-0 text-right text-lg"
        style={{ width: "calc(100% - 155px)" }}
      />
      {error && (
        <div className="text-right text-sm text-vermilion">{error}</div>
      )}
    </div>
  );
};

export default AssetInput;
