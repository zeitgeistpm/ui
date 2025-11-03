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
              className="font-base w-64 rounded-md bg-white/10 py-4 pl-5 pr-28 text-right text-base text-white/90 placeholder:text-white/60 outline-none backdrop-blur-sm transition-all focus:bg-white/15"
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
            <div className="center pointer-events-none absolute bottom-[50%] right-0 h-full translate-x-[0%] translate-y-[50%] gap-2 rounded-r-md bg-white/10 px-5 text-white/90">
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
        <div className="mb-[40px] mt-[20px]">
          <div className="text-ztg-16-150 font-bold ">Pool Fees*</div>
          <p className="mb-[30px] mt-[10px] text-ztg-14-150 text-ztg-primary-600 ">
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
