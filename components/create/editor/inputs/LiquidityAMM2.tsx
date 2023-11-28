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
import Input from "components/ui/Input";
import PoolSettingsAmm2 from "components/liquidity/PoolSettingsAMM2";
import FeeSelect, { Fee } from "./FeeSelect";

export type LiquidityInputProps = {
  name: string;
  value?: Liquidity;
  onChange: (event: FormEvent<Liquidity>) => void;
  onBlur?: (event: FormEvent<Liquidity>) => void;
  errorMessage?: string | ReactNode;
  currency: CurrencyTag;
  fieldState: FieldState;
};

export const LiquidityInputAmm2 = ({
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

  const handleAmountChange = (amount: string) => {
    onChange({
      type: "change",
      target: {
        name,
        value: {
          ...value!,
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

  return (
    <div className="center">
      <div className="flex w-full flex-col items-center md:max-w-4xl">
        <>
          <div className="mb-4 ">
            <PoolSettingsAmm2
              baseAssetPrice={baseAssetPrice ?? undefined}
              onChange={handleAmountChange}
              noDataMessage={errorMessage}
              baseAssetSymbol={currency}
              baseAssetImageSrc={currencyMetadata?.image}
              baseAssetAmount={value?.amount}
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
