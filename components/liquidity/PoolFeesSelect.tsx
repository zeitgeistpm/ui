import Input from "components/ui/Input";
import Decimal from "decimal.js";

import { MouseEventHandler, useEffect, useState } from "react";

const PoolFeeOption = ({
  label,
  value,
  selected,
  onSelected,
}: {
  label: string;
  value: number;
  selected: boolean;
  onSelected: (fee: number) => void;
}) => {
  const handleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onSelected(value);
  };
  return (
    <button
      className={`flex h-[40px] w-[100px] items-center justify-center rounded-full border-2 shadow-sm backdrop-blur-sm transition-all hover:shadow-md
          ${
            selected
              ? "border-ztg-primary-600 bg-gradient-to-r from-ztg-primary-500/80 to-ztg-primary-600/80 font-semibold text-white"
              : "border-ztg-primary-200/30 bg-white/60 text-ztg-primary-700 hover:bg-white/80"
          }
        `}
      onClick={handleClick}
    >
      <div className="text-sm font-semibold">{label}</div>
    </button>
  );
};

const feeOptions = [
  {
    label: "0.1%",
    value: 0.1,
  },
  {
    label: "1%",
    value: 1,
  },
  {
    label: "10%",
    value: 10,
  },
];

const PoolFeesSelect = ({
  onFeeChange,
}: {
  onFeeChange: (fee: Decimal) => void;
}) => {
  const [fee, setFee] = useState(1);
  const [inputSelected, setInputSelected] = useState(false);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    onFeeChange(new Decimal(fee));
  }, []);

  const handleInputFeeChange = (selectedFee: string) => {
    setInputValue(selectedFee);
    if (selectedFee === "" || selectedFee == null) {
      onFeeChange(new Decimal(0));
    } else {
      onFeeChange(new Decimal(selectedFee));
    }
  };

  const handleButtonFeeChange = (selectedFee: number) => {
    setFee(selectedFee);
    setInputSelected(false);
    onFeeChange(new Decimal(selectedFee));
  };

  const handleInputClick = () => {
    setInputSelected(true);
    if (inputValue === "" || inputValue == null) {
      onFeeChange(new Decimal(0));
    } else {
      onFeeChange(new Decimal(inputValue));
    }
  };

  return (
    <div className="flex gap-x-3">
      {feeOptions.map((option) => (
        <PoolFeeOption
          key={option.value}
          label={option.label}
          value={option.value}
          selected={fee === option.value && inputSelected === false}
          onSelected={handleButtonFeeChange}
        />
      ))}
      <div
        className={`flex h-[40px] w-[100px] items-center justify-center rounded-full border-2 shadow-sm backdrop-blur-sm transition-all hover:shadow-md
              ${
                inputSelected
                  ? "border-ztg-primary-600 bg-gradient-to-r from-ztg-primary-500/80 to-ztg-primary-600/80"
                  : "border-ztg-primary-200/30 bg-white/60 hover:bg-white/80"
              }
            `}
        onClick={handleInputClick}
      >
        <Input
          type="number"
          min="0"
          max="10"
          placeholder="3"
          value={inputValue}
          step={0.1}
          className={`text-center text-sm font-semibold outline-none ${
            inputSelected
              ? "bg-transparent text-white placeholder:text-white/60"
              : "bg-transparent text-ztg-primary-700 placeholder:text-ztg-primary-400"
          }`}
          onChange={(e) => handleInputFeeChange(e.target.value)}
          onBlur={() => {
            if (inputValue === "" || inputValue == null) {
              setInputValue("0");
            } else if (parseFloat(inputValue) > 10) {
              setInputValue("10");
            } else if (parseFloat(inputValue) < 0) {
              setInputValue("0");
            }
          }}
        />
      </div>
    </div>
  );
};

export default PoolFeesSelect;
