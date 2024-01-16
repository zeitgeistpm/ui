import InfoPopover from "components/ui/InfoPopover";
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
import { AiOutlineInfoCircle } from "react-icons/ai";
import PoolFeesSelect from "./PoolFeesSelect";
import Input from "components/ui/Input";
import { calculatePoolAmounts } from "lib/util/amm2";

export interface PoolAssetRowData {
  asset: string;
  // weight: string;
  amount: string;
  price: PriceLock;
  // value: string;
}

export const poolRowDataFromOutcomes = (
  outcomes: MultipleOutcomeEntry[],
  tokenSymbol: string,
  initialAmount: string = "100",
): PoolAssetRowData[] => {
  const amountNum = +initialAmount;
  // const baseWeight = 64;

  const numOutcomes = outcomes.length;

  const ratio = 1 / numOutcomes;
  // const weight = ratio * baseWeight;

  return [
    ...outcomes.map((outcome) => {
      return {
        asset: outcome.name,
        // weight: weight.toFixed(0),
        amount: "100",
        price: {
          price: new Decimal(ratio.toString()),
          locked: false,
        },
        value: `${(amountNum * ratio).toFixed(4)}`,
      };
    }),
    // {
    //   asset: tokenSymbol,
    //   weight: baseWeight.toString(),
    //   amount: "100",
    //   price: {
    //     price: new Decimal(1),
    //     locked: true,
    //   },
    //   value: "100",
    // },
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
      <Input
        className={`h-ztg-40 w-[100px] rounded-ztg-5 bg-gray-100 p-ztg-8 text-right focus:outline-none ${
          disabled && "!bg-transparent"
        }`}
        value={price}
        type="number"
        disabled={disabled}
        onChange={handlePriceChange}
      />
      <button
        className="ml-[20px] flex h-[30px] w-[30px] flex-grow-0 items-center justify-center rounded-full bg-gray-100"
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
      priceLocks.map((p) => p.price),
    );

    console.log(amounts);
    ["NaN", "0", "0"];
    const newData = data.map((row, index) => ({
      ...row,
      // weight: weights[index]?.toString() ?? row.weight,
      price: prices[index] ?? row.price,
      // value: (prices[index] ?? row.price).price.mul(row.amount).toFixed(4),
      amount: amounts[index].toString(),
    }));

    onChange(newData, baseAssetAmount);
  };

  const tableData: TableData[] = data.map((d, index) => {
    return {
      token: {
        token: true,
        label: d.asset,
      },
      // weights: d.weight,
      price: (
        <PriceSetter
          price={d.price.price.toString()}
          isLocked={d.price.locked}
          disabled={false}
          onChange={(priceInfo) => onPriceChange(priceInfo, index)}
        />
      ),
      // total: {
      //   value: Number(d.value),
      //   usdValue: new Decimal(d.value ?? 0).mul(baseAssetPrice ?? 0).toNumber(),
      // },
      amount: d.amount,
    };
  });

  const columns: TableColumn[] = [
    {
      header: "Token",
      accessor: "token",
      type: "token",
    },
    // {
    //   header: "Weights",
    //   accessor: "weights",
    //   type: "number",
    //   width: "10%",
    // },
    { header: "Amount", accessor: "amount", type: "number", width: "25%" },
    {
      header: "Price",
      accessor: "price",
      type: "component",
    },
    // {
    //   header: "Total Value",
    //   accessor: "total",
    //   type: "currency",
    // },
  ];

  const handleFeeChange = (fee: Decimal) => {
    onFeeChange?.(fee.div(100).mul(ZTG));
  };

  const currencyImage = supportedCurrencies.find(
    (currency) => currency.name === baseAssetSymbol,
  )?.image;

  return (
    <div className="md:min-w-[720px]">
      <div className="mb-8 flex justify-center">
        <div className=" gap-2">
          <h2 className="mb-3 flex items-center justify-center gap-2 text-base">
            Base Liquidity
            <InfoPopover
              title={
                <h3 className="mb-4 flex items-center justify-center gap-2">
                  <AiOutlineInfoCircle />
                  Market Base Liquidity
                </h3>
              }
            >
              <p className="mb-4 font-light">
                This is the amount of liquidity that will be provided to the
                market. Half of this amount will be provided to the base asset
                token and the other half spread across the outcome tokens
                according to weights/prices.
              </p>
              <p className="font-light">
                <b className="font-bold">
                  Note that this is the exact amount of {baseAssetSymbol} you
                  will spend on liquidity.
                  <i className="font-normal">
                    This does not include the bond amount or the transaction
                    fees.
                  </i>
                </b>
              </p>
            </InfoPopover>
          </h2>
          <div className="relative inline-block">
            <Input
              type="number"
              className="font-base w-64 rounded-md bg-gray-100 py-4 pl-5 pr-28 text-right text-base outline-none"
              value={`${parseFloat(baseAssetAmount)}`}
              onChange={(event) => {
                console.log(event.target.value);

                const value = parseFloat(event.target.value);
                if (!isNaN(value)) {
                  handleBaseAmountChange(`${value}`);
                } else {
                  handleBaseAmountChange("");
                }
              }}
            />
            <div className="center pointer-events-none absolute bottom-[50%] right-0 h-full translate-x-[0%] translate-y-[50%] gap-2 rounded-r-md border-2 border-l-0 border-gray-100 bg-white px-5 text-gray-600">
              {baseAssetSymbol}
              <div className="relative h-4 w-4">
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
      </div>

      <div className="scale-[80%] md:scale-100">
        <Table
          data={tableData}
          columns={columns}
          noDataMessage={noDataMessage}
        />
      </div>

      {onFeeChange && (
        <div className="mb-[40px] mt-[20px]">
          <div className="text-ztg-16-150 font-bold ">Pool Fees*</div>
          <p className="mb-[30px] mt-[10px] text-ztg-14-150 text-sky-600 ">
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
