import { observer } from "mobx-react";
import React, { ChangeEvent, FC, MouseEvent } from "react";
import { useStore } from "lib/stores/Store";
import { MultipleOutcomeEntry } from "lib/types/create-market";
import Table, { TableColumn, TableData } from "components/ui/Table";
import { ZTG, ZTG_BLUE_COLOR } from "lib/constants";
import { motion } from "framer-motion";
import PoolFeesSelect from "./PoolFeesSelect";
import Decimal from "decimal.js";
import {
  calcPrices,
  calcWeightGivenSpotPrice,
  PriceLock,
} from "lib/util/weight-math";
import { AmountInput } from "components/ui/inputs";

export interface PoolAssetRowData {
  assetColor: string;
  asset: string;
  weight: string;
  percent: string;
  amount: string;
  price: PriceLock;
  value: string;
}

export const poolRowDataFromOutcomes = (
  outcomes: MultipleOutcomeEntry[],
  tokenSymbol: string,
  initialAmount: string = "100",
): PoolAssetRowData[] => {
  const amountNum = +initialAmount;

  const numOutcomes = outcomes.length;

  const ratio = 1 / numOutcomes;
  const weight = ratio * 100;

  return [
    ...outcomes.map((outcome) => {
      return {
        assetColor: outcome.color,
        asset: outcome.ticker,
        weight: weight.toFixed(2),
        percent: `${weight.toFixed(2)}%`,
        amount: "100",
        price: {
          price: new Decimal(ratio.toString()),
          locked: false,
        },
        value: `${(amountNum * ratio).toFixed(4)}`,
      };
    }),
    {
      assetColor: ZTG_BLUE_COLOR,
      asset: tokenSymbol,
      weight: "100",
      amount: "100",
      percent: "100.00",
      price: {
        price: new Decimal(1),
        locked: true,
      },
      value: "100",
    },
  ];
};

type PriceInfo = { price: string; locked: boolean };

type PriceSetterProps = {
  price: string;
  isLocked: boolean;
  disabled: boolean;
  onChange?: (priceLock: PriceInfo) => void;
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
  return (
    <div className="flex items-center">
      <input
        className="h-ztg-40 w-[100px] rounded-ztg-5 bg-sky-200 text-right !pr-ztg-8"
        value={price}
        type="number"
        disabled={disabled}
        onChange={handlePriceChange}
      />
      {/* <AmountInput
        className="h-ztg-40 w-full rounded-ztg-5 bg-sky-200 text-right !pr-ztg-8"
        value={price.toString()}
        onChange={handlePriceChange}
      /> */}
      <button
        className="flex items-center justify-center w-[30px] h-[30px] bg-sky-200 rounded-full ml-[20px] flex-grow-0"
        onClick={handleLockClick}
        disabled={disabled}
      >
        {isLocked === true ? (
          <img src="/icons/lock.svg" alt="Locked" />
        ) : (
          <img src="/icons/unlock.svg" alt="Unlocked" />
        )}
      </button>
    </div>
  );
};

const PoolSettings: FC<{
  data: PoolAssetRowData[];
  onChange: (data: PoolAssetRowData[]) => void;
  onFeeChange: (data: Decimal) => void;
}> = observer(({ data, onChange, onFeeChange }) => {
  const store = useStore();

  const changeOutcomeRow = (amount: string) => {
    onChange(
      data.map((row) => ({
        ...row,
        amount,
        value: row.price.price.mul(amount).toFixed(0),
      })),
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

    const ztgPriceRow = priceLocks.pop();

    const prices = calcPrices(priceLocks);
    prices.forEach((p) => console.log(p.price.toString()));

    const ztgWeight = new Decimal(100);
    const tokenAmount = new Decimal(data[0].amount);
    //todo: can weight be ""?
    const weights = prices.map((price) =>
      calcWeightGivenSpotPrice(
        tokenAmount,
        ztgWeight,
        tokenAmount,
        price.price,
      ),
    );

    const newData = data.map((row, index) => ({
      ...row,
      weight: weights[index]?.toString() ?? row.weight,
      price: prices[index] ?? row.price,
    }));

    console.log(newData);

    onChange(newData);
  };

  const tableData: TableData[] = data.map((d, index) => {
    return {
      token: {
        color: d.assetColor,
        label: d.asset,
      },
      weights: d.weight,
      price: (
        <PriceSetter
          price={d.price.price.toString()}
          isLocked={d.price.locked}
          disabled={index === data.length - 1}
          onChange={(priceInfo) => onPriceChange(priceInfo, index)}
        />
      ),
      total: {
        value: d.value,
        usdValue: 0,
      },
      amount: {
        value: d.amount,
        min: store.config?.swaps.minLiquidity.toString(),
        onChange: (amount: string) => {
          changeOutcomeRow(amount);
        },
      },
    };
  });

  const columns: TableColumn[] = [
    {
      header: "Token",
      accessor: "token",
      type: "token",
    },
    {
      header: "Weights",
      accessor: "weights",
      type: "number",
      width: "10%",
    },
    { header: "Amount", accessor: "amount", type: "amountInput", width: "25%" },
    {
      header: "Price",
      accessor: "price",
      type: "component",
    },
    {
      header: "Total Value",
      accessor: "total",
      type: "currency",
    },
  ];

  const handleFeeChange = (fee: Decimal) => {
    onFeeChange(fee.div(100).mul(ZTG));
  };

  return (
    <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
      <Table data={tableData} columns={columns} />
      <div className="mt-[20px] mb-[40px]">
        <div className="text-ztg-16-150 font-bold font-lato">Pool Fees*</div>
        <p className="text-ztg-14-150 mb-[30px] mt-[10px] text-sky-600 font-lato">
          High fees will allow liquidity providers to collect more value from a
          given trade. However, high fees may also reduce market participants.
        </p>
        <PoolFeesSelect onFeeChange={handleFeeChange} />
      </div>
    </motion.div>
  );
});

export default PoolSettings;
