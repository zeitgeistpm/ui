import Tooltip from "components/ui/Tooltip";
import Table, { TableColumn, TableData } from "components/ui/Table";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { supportedCurrencies } from "lib/constants/supported-currencies";
import { MultipleOutcomeEntry } from "lib/types/create-market";
import {
  PriceLock,
  calcPrices,
  calcWeightGivenSpotPrice,
} from "lib/util/weight-math";
import Image from "next/image";
import { ChangeEvent, FC, MouseEvent, ReactNode } from "react";
import Input from "components/ui/Input";
import { calculatePoolAmounts } from "lib/util/amm2";

export interface PoolAssetRowData {
  asset: string;
  amount: string;
  price: PriceLock;
}

export const poolRowDataFromOutcomes = (
  outcomes: MultipleOutcomeEntry[],
  tokenSymbol: string,
  initialAmount: string = "100",
): PoolAssetRowData[] => {
  const amountNum = +initialAmount;
  const numOutcomes = outcomes.length;
  const ratio = 1 / numOutcomes;

  return [
    ...outcomes.map((outcome) => {
      return {
        asset: outcome.name,
        amount: "100",
        price: {
          price: new Decimal(ratio.toString()),
          locked: false,
        },
        value: `${(amountNum * ratio).toFixed(4)}`,
      };
    }),
  ];
};

type PriceInfo = { price: string; locked: boolean };

type PriceSetterProps = {
  price: string;
  isLocked: boolean;
  disabled: boolean;
  onChange: (priceLock: PriceInfo) => void;
};

const PriceSetter = ({
  price,
  isLocked,
  disabled = false,
  onChange,
}: PriceSetterProps) => {
  const handleLockClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    onChange({ price: price, locked: !isLocked });
  };

  const handlePriceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const newPrice = event.target.value;
    onChange({ price: newPrice, locked: true });
  };

  const priceDecimal = new Decimal(price);

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex flex-col">
        <Input
          className={`h-7 w-20 rounded-md bg-sky-50/50 px-2 text-right text-xs focus:outline-none ${
            disabled && "!bg-transparent"
          }`}
          value={price}
          type="number"
          disabled={disabled}
          onChange={handlePriceChange}
        />
        <div className="h-3 text-[9px] text-vermilion">
          {priceDecimal.greaterThanOrEqualTo(0.99) && <>Max 0.99</>}
          {priceDecimal.lessThanOrEqualTo(0.01) && <>Min 0.01</>}
        </div>
      </div>
      <button
        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-sky-50/50 transition-all hover:bg-sky-100/80"
        onClick={handleLockClick}
        disabled={disabled}
      >
        {isLocked === true ? (
          <img src="/icons/lock.svg" alt="Locked" className="h-3 w-3" />
        ) : (
          <img src="/icons/unlock.svg" alt="Unlocked" className="h-3 w-3" />
        )}
      </button>
    </div>
  );
};

const PoolSettings: FC<{
  data: PoolAssetRowData[];
  onChange: (rows: PoolAssetRowData[], amount: string) => void;
  baseAssetSymbol: string;
  baseAssetAmount: string;
  onFeeChange?: (data: Decimal) => void;
  noDataMessage?: string | ReactNode;
  baseAssetPrice?: Decimal;
}> = ({
  data,
  onChange,
  onFeeChange,
  baseAssetAmount,
  baseAssetSymbol,
  noDataMessage,
  baseAssetPrice,
}) => {
  const handleBaseAmountChange = (amount: string) => {
    onChange(
      data.map((row) => {
        const handledAmount = amount && amount.length > 0 ? amount : "0";
        return {
          ...row,
          amount,
          value: row.price.price.mul(handledAmount).toFixed(0),
        };
      }),
      amount,
    );
  };

  const onPriceChange = (priceInfo: PriceInfo, changedIndex: number) => {
    const changedPrice =
      priceInfo.price == null || priceInfo.price === ""
        ? new Decimal(0)
        : new Decimal(priceInfo.price);
    const priceLocks: PriceLock[] = data.map((d, index) => {
      return {
        price: index === changedIndex ? changedPrice : d.price.price,
        locked: index === changedIndex ? priceInfo.locked : d.price.locked,
      };
    });

    const prices = calcPrices(priceLocks);

    const amounts = calculatePoolAmounts(
      new Decimal(baseAssetAmount),
      prices.map((p) => p.price),
    );

    const isInvalid = amounts.some((amount) => amount.isNaN());

    const newData = data.map((row, index) => ({
      ...row,
      price: prices[index] ?? row.price,
      amount: isInvalid ? "0" : amounts[index].toString(),
    }));

    onChange(newData, baseAssetAmount);
  };

  const tableData: TableData[] = data.map((d, index) => {
    return {
      token: {
        token: true,
        label: d.asset,
      },
      price: (
        <PriceSetter
          price={d.price.price.toString()}
          isLocked={d.price.locked}
          disabled={false}
          onChange={(priceInfo) => onPriceChange(priceInfo, index)}
        />
      ),
      amount: d.amount,
    };
  });

  const columns: TableColumn[] = [
    {
      header: "Token",
      accessor: "token",
      type: "token",
      width: "35%",
    },
    { header: "Amount", accessor: "amount", type: "number", width: "30%" },
    {
      header: "Price",
      accessor: "price",
      type: "component",
      width: "35%",
    },
  ];

  const handleFeeChange = (fee: Decimal) => {
    onFeeChange?.(fee.div(100).mul(ZTG));
  };

  const currencyImage = supportedCurrencies.find(
    (currency) => currency.name === baseAssetSymbol,
  )?.image;

  return (
    <div className="w-full">
      <div className="mb-3">
        <label className="mb-1.5 flex items-center gap-1 text-xs font-medium text-sky-900">
          Base Liquidity
          <Tooltip
            content={`Amount of ${baseAssetSymbol} provided for trading. Subject to impermanent loss. Excludes bond & tx fees.`}
          />
        </label>
        <div className="relative w-48">
          <Input
            type="number"
            className="h-9 w-full rounded-md border border-sky-200/30 bg-sky-50/50 py-2 pl-3 pr-20 text-right text-sm outline-none focus:border-sky-400"
            value={`${parseFloat(baseAssetAmount)}`}
            onChange={(event) => {
              const value = parseFloat(event.target.value);
              if (!isNaN(value)) {
                handleBaseAmountChange(`${value}`);
              } else {
                handleBaseAmountChange("");
              }
            }}
          />
          <div className="pointer-events-none absolute right-0 top-0 flex h-9 items-center gap-1.5 rounded-r-md border-l border-sky-200/30 bg-white/80 px-2.5 text-xs text-sky-900">
            {baseAssetSymbol}
            <div className="relative h-3.5 w-3.5">
              {currencyImage && (
                <Image
                  alt="Currency token logo"
                  fill
                  sizes="100vw"
                  src={currencyImage}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <Table
          data={tableData}
          columns={columns}
          noDataMessage={noDataMessage}
        />
      </div>
    </div>
  );
};

export default PoolSettings;
