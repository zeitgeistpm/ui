import InfoPopover from "components/ui/InfoPopover";
import Input from "components/ui/Input";
import Table, { TableColumn, TableData } from "components/ui/Table";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { PriceLock } from "lib/util/weight-math";
import Image from "next/image";
import { FC, ReactNode, useState } from "react";
import { AiOutlineInfoCircle } from "react-icons/ai";
import PoolFeesSelect from "./PoolFeesSelect";

export interface PoolAssetRowDataAMM2 {
  asset: string;
  amount: string;
  price: PriceLock;
  value: string;
}
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
  },
  {
    header: "Total Value",
    accessor: "total",
    type: "currency",
  },
];

const PoolSettingsAmm2: FC<{
  onChange: (amount: string) => void;
  onFeeChange?: (data: Decimal) => void;
  noDataMessage?: string | ReactNode;
  baseAssetPrice?: Decimal;
  baseAssetSymbol: string;
  baseAssetImageSrc?: string;
  baseAssetAmount?: string;
}> = ({
  onChange,
  onFeeChange,
  noDataMessage,
  baseAssetPrice,
  baseAssetSymbol,
  baseAssetImageSrc,
  baseAssetAmount,
}) => {
  const handleFeeChange = (fee: Decimal) => {
    onFeeChange?.(fee.div(100).mul(ZTG));
  };

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
              <p className="font-light mb-4">
                This is the amount of liquidity that will be provided to the
                market than will be spread across the outcome tokens.
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
              className="rounded-md bg-gray-100 py-4 pl-5 pr-28 text-right text-base font-base w-64 outline-none"
              value={`${parseFloat(baseAssetAmount ?? "0")}`}
              onChange={(event) => {
                const value = parseFloat(event.target.value);
                if (!isNaN(value)) {
                  onChange(`${value}`);
                } else {
                  onChange("");
                }
              }}
            />
            <div className="absolute bottom-[50%] center gap-2 text-gray-600 right-0 rounded-r-md border-2 border-gray-100 border-l-0 px-5 bg-white h-full translate-y-[50%] translate-x-[0%] pointer-events-none">
              {baseAssetSymbol}
              <div className="relative h-4 w-4">
                {baseAssetImageSrc && (
                  <Image
                    alt="Currency token logo"
                    fill
                    sizes="100vw"
                    src={baseAssetImageSrc}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

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

export default PoolSettingsAmm2;
