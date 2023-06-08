import PoolSettings, {
  PoolAssetRowData,
} from "components/liquidity/PoolSettings";
import Toggle from "components/ui/Toggle";
import Decimal from "decimal.js";
import { useAssetUsdPrice } from "lib/hooks/queries/useAssetUsdPrice";
import { FieldState } from "lib/state/market-creation/types/fieldstate";
import { CurrencyTag, Liquidity } from "lib/state/market-creation/types/form";
import { ChangeEventHandler, ReactNode } from "react";
import { LuFileWarning } from "react-icons/lu";
import { FormEvent } from "../types";
import { getMetadataForCurrency } from "lib/constants/supported-currencies";

export type LiquidityInputProps = {
  name: string;
  value: Liquidity;
  onChange: (event: FormEvent<Liquidity>) => void;
  onBlur: (event: FormEvent<Liquidity>) => void;
  errorMessage?: string | ReactNode;
  currency: CurrencyTag;
  fieldState: FieldState;
};

export const LiquidityInput = ({
  name,
  value,
  onChange,
  onBlur,
  errorMessage,
  currency,
  fieldState,
}: LiquidityInputProps) => {
  const handleRowsChange = (data: PoolAssetRowData[]) => {
    onChange({
      type: "change",
      target: {
        name,
        value: {
          ...value,
          rows: transformRows(data),
        },
      },
    });
  };

  const handleDeploymentToggle = (checked: boolean) => {
    onChange({
      type: "change",
      target: {
        name,
        value: {
          ...value,
          deploy: checked,
        },
      },
    });
  };

  const handleSwapFeeChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const swapFee = parseFloat(event.target.value);
    onChange({
      type: "change",
      target: {
        name,
        value: {
          ...value,
          swapFee: isNaN(swapFee) ? 0 : parseFloat(event.target.value),
        },
      },
    });
  };

  const { data: baseAssetPrice } = useAssetUsdPrice(
    getMetadataForCurrency(currency).assetId,
  );

  return (
    <div className="center">
      <div className="md:max-w-4xl">
        <div className="mb-10 flex justify-center">
          <div className="flex flex-col justify-center items-center">
            <div className="font-light text-sm mb-2">Deploy Pool?</div>
            <Toggle
              checked={value?.deploy}
              activeClassName={
                currency === "ZTG" ? "bg-ztg-blue" : "bg-polkadot"
              }
              onChange={handleDeploymentToggle}
            />
          </div>
        </div>

        {!value?.deploy ? (
          <div>
            <div className="mb-4 center text-gray-500">
              <LuFileWarning size={32} />
            </div>
            <p className="text-center md:max-w-lg text-gray-400">
              No liquidity pool will be deployed for the market.
              <b className="inline">
                You can deploy a pool after you create the market
              </b>{" "}
              from the market page.
            </p>
          </div>
        ) : errorMessage ? (
          <div className="text-red-500 text-center">{errorMessage}</div>
        ) : (
          <>
            <div className="mb-4 ">
              <PoolSettings
                baseAssetPrice={baseAssetPrice}
                data={transformRows(value?.rows ?? [])}
                onChange={handleRowsChange}
                noDataMessage={errorMessage}
              />
            </div>
            <div className="relative flex justify-end pr-8 mr-4 md:mr-0">
              <div className="flex items-center gap-2">
                <div className="relative inline-block">
                  <input
                    type="number"
                    min={0}
                    className="rounded-md bg-gray-100 py-3 pl-4 pr-34 text-right w-64 outline-none"
                    value={Number(value.swapFee).toString()}
                    onChange={handleSwapFeeChange}
                  />
                  <div className="absolute bottom-[50%] center text-gray-600 right-0 rounded-r-md border-2 border-gray-100 border-l-0 px-4 bg-white h-full translate-y-[50%] translate-x-[0%] pointer-events-none">
                    % swap fee
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

function transformRows(rows: PoolAssetRowData[]): Liquidity["rows"];
function transformRows(rows: Liquidity["rows"]): PoolAssetRowData[];
function transformRows(
  rows: PoolAssetRowData[] | Liquidity["rows"],
): PoolAssetRowData[] | Liquidity["rows"] {
  return rows?.map((row) => ({
    ...row,
    price: {
      price: Decimal.isDecimal(row.price.price)
        ? row.price.price.toString()
        : new Decimal(row.price.price),
      locked: row.price.locked,
    },
  }));
}
