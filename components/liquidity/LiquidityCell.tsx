import React, { useEffect, useState } from "react";
import { AmountInput } from "components/ui/inputs";

interface LiquidityCellProps {
  amount: string;
  balance: string;
  asset: string;
  color: string;
  disabled?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onSelected?: () => void;
  onAmountChange?: (amount: number) => void;
}

const LiquidityCell = ({
  amount,
  balance,
  asset,
  color,
  disabled = false,
  selectable = false,
  selected = false,
  onSelected,
  onAmountChange,
}: LiquidityCellProps) => {
  const [amountValue, setAmountValue] = useState<number>(0);

  useEffect(() => {
    setAmountValue(Math.floor(Number(amount) * 100) / 100);
  }, [amount]);

  const formatNumber = (number: string) => {
    //TODO: use language set by user?
    return new Intl.NumberFormat().format(Number(number));
  };

  const handleAmountChange = (amount: string) => {
    onAmountChange(+amount);
  };

  const handleSelectedChange = () => {
    onSelected();
  };

  return (
    <div>
      <div className="flex items-center mt-ztg-24 mb-ztg-8">
        <div
          className="rounded-full w-ztg-20 h-ztg-20 mr-ztg-10 border-sky-600 border-2 "
          style={{ background: color }}
        ></div>
        <div className="font-bold   text-ztg-16-150 uppercase text-black dark:text-white">
          {asset}
        </div>
        <span className="font-mono text-ztg-12-150 font-medium ml-auto ">
          {formatNumber(balance)}
        </span>
      </div>
      <AmountInput
        containerClass="dark:bg-sky-1000"
        className="h-ztg-40 w-full rounded-ztg-5 bg-sky-200 text-gray-dark-3 text-right !pr-ztg-8 !pl-ztg-38 dark:bg-black"
        value={amountValue.toString()}
        onChange={handleAmountChange}
        disabled={disabled}
        min="0"
      />
    </div>
  );
};

export default LiquidityCell;
