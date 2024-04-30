import PoolSettings, {
  PoolAssetRowData,
} from "components/liquidity/PoolSettings";
import Decimal from "decimal.js";
import { getMetadataForCurrency } from "lib/constants/supported-currencies";
import { useAssetUsdPrice } from "lib/hooks/queries/useAssetUsdPrice";
import { swapFeePresets } from "lib/state/market-creation/constants/swap-fee";
import { FieldState } from "lib/state/market-creation/types/fieldstate";
import { CurrencyTag, Liquidity } from "lib/state/market-creation/types/form";
import { ReactNode } from "react";
import { FormEvent } from "../types";
import FeeSelect, { Fee } from "./FeeSelect";
import { useMarketDraftEditor } from "lib/state/market-creation/editor";

export type LiquidityInputProps = {
  name: string;
  value?: Liquidity;
  onChange: (event: FormEvent<Liquidity>) => void;
  errorMessage?: string | ReactNode;
  currency: CurrencyTag;
  fieldState: FieldState;
};

export const LiquidityInput = ({
  name,
  value,
  onChange,
  errorMessage,
  currency,
  fieldState,
}: LiquidityInputProps) => {
  const editor = useMarketDraftEditor();
  const currencyMetadata = getMetadataForCurrency(currency);
  const { data: baseAssetPrice } = useAssetUsdPrice(currencyMetadata?.assetId);

  const handleRowsChange = (data: PoolAssetRowData[], amount: string) => {
    onChange({
      type: "change",
      target: {
        name,
        value: {
          ...value!,
          rows: transformRows(data),
          amount: amount,
        },
      },
    });
  };

  const handleFeeChange = (event: FormEvent<Fee>) => {
    onChange({
      type: "change",
      target: {
        name,
        value: {
          ...value!,
          swapFee: event.target.value,
        },
      },
    });
  };
  console.log(value);
  return (
    <div className="center">
      <div className="md:max-w-4xl">
        <>
          <div className="mb-4 ">
            <PoolSettings
              baseAssetPrice={baseAssetPrice ?? undefined}
              baseAssetSymbol={currencyMetadata?.name ?? ""}
              baseAssetAmount={value?.amount ?? ""}
              data={transformRows(value?.rows ?? [])}
              onChange={handleRowsChange}
              noDataMessage={errorMessage}
            />
          </div>
          <FeeSelect
            name={name}
            value={value?.swapFee}
            onChange={handleFeeChange}
            presets={swapFeePresets}
            isValid={fieldState.isValid}
            label="% Swap Fee"
          />
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
