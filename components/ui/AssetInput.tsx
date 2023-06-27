import React, { useState } from "react";
import AssetSelect, { AssetOption } from "./AssetSelect";

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
        "mb-5 h-14 w-full bg-anti-flash-white rounded-md relative border-1 border-transparent " +
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
      <input
        type="number"
        step="any"
        value={amount}
        onChange={(e) => {
          onAmountChange?.(e.target.value);
        }}
        className="absolute right-4 top-[50%] translate-y-[-50%] font-mono text-right text-lg outline-none bg-transparent"
      />
      {error && (
        <div className="text-vermilion text-sm text-right">{error}</div>
      )}
    </div>
  );
};

export default AssetInput;
