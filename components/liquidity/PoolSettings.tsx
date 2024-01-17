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
    <div className="flex items-center">
      <div className="mt-[10px] flex flex-col">
        <Input
          className={`h-ztg-32 w-[100px] rounded-ztg-5 bg-gray-100 p-ztg-8 text-right focus:outline-none ${
            disabled && "!bg-transparent"
          }`}
          value={price}
          type="number"
          disabled={disabled}
          onChange={handlePriceChange}
        />
        <div className="h-[10px] text-[10px] text-vermilion">
          {priceDecimal.greaterThanOrEqualTo(0.99) && (
            <>Price must be less than 0.99</>
          )}
          {priceDecimal.lessThanOrEqualTo(0.01) && (
            <>Price must be greater than 0.01</>
          )}
        </div>
      </div>
      <button
        className="ml-auto flex h-[30px] w-[30px] flex-grow-0 items-center justify-center rounded-full bg-gray-100"
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
    },
    { header: "Amount", accessor: "amount", type: "number", width: "25%" },
    {
      header: "Price",
      accessor: "price",
      type: "component",
      width: "30%",
    },
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
                market. It will be used to facilitate trading and is subject to
                impermanent loss, as compensation you will earn trading fees.
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
