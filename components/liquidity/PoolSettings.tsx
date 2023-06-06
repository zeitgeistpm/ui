import React, { ChangeEvent, FC, MouseEvent, ReactNode } from "react";
import { MultipleOutcomeEntry } from "lib/types/create-market";
import Table, { TableColumn, TableData } from "components/ui/Table";
import { ZTG, ZTG_BLUE_COLOR, ZTG_MIN_LIQUIDITY } from "lib/constants";
import { motion } from "framer-motion";
import PoolFeesSelect from "./PoolFeesSelect";
import Decimal from "decimal.js";
import {
  calcPrices,
  calcWeightGivenSpotPrice,
  PriceLock,
} from "lib/util/weight-math";
import { useChainConstants } from "lib/hooks/queries/useChainConstants";
import Image from "next/image";
import { supportedCurrencies } from "lib/constants/supported-currencies";
import InfoPopover from "components/create/editor/InfoPopover";
import { AiOutlineInfoCircle } from "react-icons/ai";

export interface PoolAssetRowData {
  asset: string;
  weight: string;
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
  const baseWeight = 64;

  const numOutcomes = outcomes.length;

  const ratio = 1 / numOutcomes;
  const weight = ratio * baseWeight;

  return [
    ...outcomes.map((outcome) => {
      return {
        asset: outcome.name,
        weight: weight.toFixed(0),
        amount: "100",
        price: {
          price: new Decimal(ratio.toString()),
          locked: false,
        },
        value: `${(amountNum * ratio).toFixed(4)}`,
      };
    }),
    {
      asset: tokenSymbol,
      weight: baseWeight.toString(),
      amount: "100",
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
  return (
    <div className="flex items-center">
      <input
        className={`h-ztg-40 w-[100px] rounded-ztg-5 bg-gray-100 text-right p-ztg-8 focus:outline-none ${
          disabled && "!bg-transparent"
        }`}
        value={price}
        type="number"
        disabled={disabled}
        onChange={handlePriceChange}
      />
      <button
        className="flex items-center justify-center w-[30px] h-[30px] bg-gray-100 rounded-full ml-[20px] flex-grow-0"
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
  onFeeChange?: (data: Decimal) => void;
  noDataMessage?: string | ReactNode;
  baseAssetPrice?: Decimal;
}> = ({ data, onChange, onFeeChange, noDataMessage, baseAssetPrice }) => {
  const changeOutcomeRow = (amount: string) => {
    onChange(
      data.map((row) => {
        const handledAmount = amount && amount.length > 0 ? amount : "0";
        return {
          ...row,
          amount,
          value: row.price.price.mul(handledAmount).toFixed(0),
        };
      }),
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

    priceLocks.pop();

    const prices = calcPrices(priceLocks);

    const ztgWeight = new Decimal(64);
    const tokenAmount = new Decimal(data[0].amount);
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
      value: (prices[index] ?? row.price).price.mul(row.amount).toFixed(4),
    }));

    onChange(newData);
  };

  const tableData: TableData[] = data.map((d, index) => {
    return {
      token: {
        token: true,
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
        value: Number(d.value),
        usdValue: baseAssetPrice?.toNumber(),
      },
      amount: d.amount,
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
    { header: "Amount", accessor: "amount", type: "number", width: "25%" },
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

  const baseAssetRow = data[data.length - 1];

  return (
    <div className="md:min-w-[720px]">
      <div className="mb-8 flex justify-center">
        <div className=" gap-2">
          <h2 className="flex text-base justify-center items-center gap-2 mb-3">
            Base Liquidity
            <InfoPopover
              title={
                <h3 className="flex justify-center items-center mb-4 gap-2">
                  <AiOutlineInfoCircle />
                  Market Base Liquidity
                </h3>
              }
            >
              <p className="text-gray-500 font-light text-sm mb-4">
                This is the amount of liquidity that will be provided to the
                market. Half of this amount will be provided to the base asset
                token and the other half spread across the outcome tokens
                according to weights/prices.
              </p>
              <p className="text-gray-500 font-light text-sm">
                <b className="font-bold">
                  Note that this is the exact amount of {baseAssetRow?.asset}{" "}
                  you will spend on liquidity.
                  <i className="font-normal">
                    This does not include the bond amount or the transaction
                    fees.
                  </i>
                </b>
              </p>
            </InfoPopover>
          </h2>
          <div className="relative inline-block">
            <input
              type="number"
              className="rounded-md bg-gray-100 py-4 pl-5 pr-28 text-right text-base font-base w-64 outline-none"
              value={`${parseFloat(baseAssetRow.amount) * 2}`}
              onChange={(event) => {
                const value = parseFloat(event.target.value) / 2;
                if (!isNaN(value)) {
                  changeOutcomeRow(`${value}`);
                } else {
                  changeOutcomeRow("");
                }
              }}
            />
            <div className="absolute bottom-[50%] center gap-2 text-gray-600 right-0 rounded-r-md border-2 border-gray-100 border-l-0 px-5 bg-white h-full translate-y-[50%] translate-x-[0%] pointer-events-none">
              {baseAssetRow.asset}
              <div className="relative h-4 w-4">
                <Image
                  alt="Currency token logo"
                  fill
                  sizes="100vw"
                  src={
                    supportedCurrencies.find(
                      (currency) => currency.name === baseAssetRow.asset,
                    )?.image
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Table data={tableData} columns={columns} noDataMessage={noDataMessage} />

      {onFeeChange && (
        <div className="mt-[20px] mb-[40px]">
          <div className="text-ztg-16-150 font-bold ">Pool Fees*</div>
          <p className="text-ztg-14-150 mb-[30px] mt-[10px] text-sky-600 ">
            High fees will allow liquidity providers to collect more value from
            a given trade. However, high fees may also reduce market
            participants.
          </p>
          <PoolFeesSelect onFeeChange={handleFeeChange} />
        </div>
      )}
    </div>
  );
};

export default PoolSettings;
