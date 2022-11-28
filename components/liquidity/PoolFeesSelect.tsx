import { AmountInput } from "components/ui/inputs";
import Decimal from "decimal.js";
import { observer } from "mobx-react";
import { useEffect, useState } from "react";

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
  const handleClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onSelected(value);
  };
  return (
    <button
      className={`flex justify-center items-center w-[100px] h-[40px] border-2 dark bg-sky-200 dark:bg-black rounded-ztg-100
          ${
            selected
              ? "text-black dark:text-white border-black dark:border-white"
              : "dark:border-black text-sky-600"
          }
        `}
      onClick={handleClick}
    >
      <div className={`font-mono text-ztg-14-120`}>{label}</div>
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

const PoolFeesSelect = observer(
  ({ onFeeChange }: { onFeeChange: (fee: Decimal) => void }) => {
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
          className={`flex justify-center items-center w-[100px] h-[40px] border-2 dark bg-sky-200 dark:bg-black rounded-ztg-100
              ${
                inputSelected
                  ? "border-black dark:border-white"
                  : "dark:border-black"
              }
            `}
          onClick={handleInputClick}
        >
          <AmountInput
            min="0"
            max="10"
            placeholder="3%"
            value={inputValue}
            onChange={(value) => handleInputFeeChange(value)}
            className="box-border  m-[15px] p-[5px] w-[80px] h-[20px] !bg-transparent !border-transparent text-black"
          />
        </div>
      </div>
    );
  },
);

export default PoolFeesSelect;
