import PoolSettings, {
  PoolAssetRowData,
} from "components/liquidity/PoolSettings";
import Decimal from "decimal.js";
import { getMetadataForCurrency } from "lib/constants/supported-currencies";
import { useAssetUsdPrice } from "lib/hooks/queries/useAssetUsdPrice";
import { swapFeePresets } from "lib/state/market-creation/constants/swap-fee";
import { FieldState } from "lib/state/market-creation/types/fieldstate";
import { CurrencyTag, Liquidity } from "lib/state/market-creation/types/form";
import { ChangeEventHandler, ReactNode } from "react";
import { FormEvent } from "../types";

export type LiquidityInputProps = {
  name: string;
  value?: Liquidity;
  onChange: (event: FormEvent<Liquidity>) => void;
  onBlur?: (event: FormEvent<Liquidity>) => void;
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
  const currencyMetadata = getMetadataForCurrency(currency);
  const { data: baseAssetPrice } = useAssetUsdPrice(currencyMetadata?.assetId);

  const handleRowsChange = (data: PoolAssetRowData[]) => {
    onChange({
      type: "change",
      target: {
        name,
        value: {
          ...value!,
          rows: transformRows(data),
        },
      },
    });
  };

  const handleSwapFeeCustomChange: ChangeEventHandler<HTMLInputElement> = (
    event,
  ) => {
    const swapFee = parseFloat(event.target.value);
    onChange({
      type: "change",
      target: {
        name,
        value: {
          ...value!,
          swapFee: {
            type: "custom",
            value: isNaN(swapFee) ? 0 : parseFloat(event.target.value),
          },
        },
      },
    });
  };

  const handleSwapFeePresetChange = (swapFee: Liquidity["swapFee"]) => () => {
    onChange({
      type: "change",
      target: {
        name,
        value: {
          ...value!,
          swapFee,
        },
      },
    });
  };

  return (
    <div className="center">
      <div className="md:max-w-4xl">
        <>
          <div className="mb-4 ">
            <PoolSettings
              baseAssetPrice={baseAssetPrice ?? undefined}
              data={transformRows(value?.rows ?? [])}
              onChange={handleRowsChange}
              noDataMessage={errorMessage}
            />
          </div>
          <div className="relative flex justify-end pr-8 mr-4 md:mr-0">
            <div className="flex items-center gap-2">
              {swapFeePresets.map((preset, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={handleSwapFeePresetChange(preset)}
                  className={`flex center rounded-full bg-gray-100 py-3 px-6 transition-all active:scale-9 ${
                    value?.swapFee?.type === "preset" &&
                    value?.swapFee?.value === preset.value &&
                    "bg-nyanza-base"
                  }`}
                >
                  {preset.value}%
                </button>
              ))}
              <div className="relative inline-block">
                <input
                  type="number"
                  min={0}
                  className={`rounded-md bg-gray-100 py-3 pl-4 pr-34 text-right w-64 outline-none ${
                    value?.swapFee?.type === "custom" &&
                    fieldState.isValid &&
                    "bg-nyanza-base"
                  }`}
                  value={Number(value?.swapFee?.value).toString()}
                  onChange={handleSwapFeeCustomChange}
                />
                <div className="absolute bottom-[50%] center text-gray-600 right-0 rounded-r-md border-2 border-gray-100 border-l-0 px-4 bg-white h-full translate-y-[50%] translate-x-[0%] pointer-events-none">
                  % swap fee
                </div>
              </div>
            </div>
          </div>
        </>
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
