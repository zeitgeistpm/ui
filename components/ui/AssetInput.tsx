import React, { useState } from "react";
import AssetSelect, { AssetOption } from "./AssetSelect";

type AssetInputProps = {
  options: AssetOption[];
  selectedOption?: AssetOption;
  setSelectedOption: (opt: AssetOption) => void;
  amount?: string;
  setAmount: (amount: string) => void;
};

const AssetInput: React.FC<AssetInputProps> = ({
  options,
  selectedOption,
  setSelectedOption,
  amount = "",
  setAmount,
}) => {
  return (
    <div className="mb-5 h-14 w-full bg-anti-flash-white rounded-md relative">
      <AssetSelect
        options={options}
        selectedOption={selectedOption}
        onChange={(option) => {
          setSelectedOption(option);
        }}
      />
      <input
        type="number"
        step="any"
        value={amount}
        onChange={(e) => {
          setAmount(e.target.value);
        }}
        className="absolute right-4 top-[50%] translate-y-[-50%] font-mono text-right text-lg outline-none bg-transparent"
      />
    </div>
  );
};

export default AssetInput;
