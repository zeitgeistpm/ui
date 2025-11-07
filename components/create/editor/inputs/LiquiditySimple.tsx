import Decimal from "decimal.js";
import { CurrencyTag, Liquidity } from "lib/state/market-creation/types/form";
import { FormEvent } from "../types";
import { getMetadataForCurrency } from "lib/constants/supported-currencies";
import { useAssetUsdPrice } from "lib/hooks/queries/useAssetUsdPrice";
import { swapFeePresets } from "lib/state/market-creation/constants/swap-fee";
import Input from "components/ui/Input";
import FeeSelect, { Fee } from "./FeeSelect";

export type LiquiditySimpleProps = {
  name: string;
  value?: Liquidity;
  onChange: (event: FormEvent<Liquidity>) => void;
  currency: CurrencyTag;
  answers: { type: string; answers: any[] };
};

export const LiquiditySimple = ({
  name,
  value,
  onChange,
  currency,
  answers,
}: LiquiditySimpleProps) => {
  const currencyMetadata = getMetadataForCurrency(currency);
  const { data: rawAssetPrice } = useAssetUsdPrice(currencyMetadata?.assetId);

  // Hardcode stablecoins to $1 USD
  // DISABLED: USDC.wh temporarily disabled
  // const isStablecoin = currency === "USDC.wh";
  const isStablecoin = false; // currency === "USDC.wh";
  const baseAssetPrice = isStablecoin ? new Decimal(1) : rawAssetPrice;

  const numOutcomes =
    answers?.type === "scalar" ? 2 : answers?.answers?.length || 0;
  const defaultAmount = "100";
  const ratio = numOutcomes > 0 ? 1 / numOutcomes : 0;

  const handleAmountChange = (amount: string) => {
    if (!numOutcomes || numOutcomes < 2) return;

    const rows = Array.from({ length: numOutcomes }, (_, index) => {
      const outcomeName =
        answers?.type === "categorical"
          ? answers.answers[index] || `Outcome ${index + 1}`
          : answers?.type === "scalar"
            ? index === 0
              ? "Short"
              : "Long"
            : `Outcome ${index + 1}`;

      return {
        asset: outcomeName,
        amount: amount || "0",
        price: {
          price: new Decimal(ratio).toString(),
          locked: false,
        },
      };
    });

    onChange({
      type: "change",
      target: {
        name,
        value: {
          ...value!,
          amount: amount,
          rows: rows as any,
        },
      },
    });
  };

  const handleFeeChange = (event: FormEvent<Fee | undefined>) => {
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

  const totalValue = value?.amount
    ? baseAssetPrice?.mul(value.amount)
    : new Decimal(0);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-white">
            Total Liquidity Amount <span className="text-ztg-red-400">*</span>
          </label>
          <Input
            type="number"
            inputMode="decimal"
            value={value?.amount || ""}
            onChange={(e) => handleAmountChange(e.target.value)}
            className="h-11 w-full rounded-lg border-2 border-white/20 bg-white/10 px-4 text-sm text-white backdrop-blur-sm transition-all placeholder:text-white/50"
            placeholder={`e.g., ${defaultAmount}`}
          />
          {totalValue && totalValue.gt(0) && (
            <p className="text-xs text-white/60">
              ≈ ${totalValue.toFixed(2)} USD
            </p>
          )}
          <p className="text-xs text-white/60">
            💡 This amount will be evenly distributed across all {numOutcomes}{" "}
            outcomes
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-white">
            Swap Fee <span className="text-ztg-red-400">*</span>
          </label>
          <FeeSelect
            name={name}
            value={value?.swapFee}
            onChange={handleFeeChange}
            presets={swapFeePresets}
            isValid={true}
            label="% Swap Fee"
          />
          <p className="text-xs text-white/60">
            💡 Fee earned on each trade. 1% is a common default.
          </p>
        </div>

        {numOutcomes >= 2 && (
          <div className="rounded-lg bg-white/5 p-3">
            <p className="mb-2 text-xs font-semibold text-white">
              Distribution Preview
            </p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {Array.from({ length: numOutcomes }, (_, idx) => {
                const outcomeName =
                  answers?.type === "categorical"
                    ? answers.answers[idx] || `Option ${idx + 1}`
                    : answers?.type === "scalar"
                      ? idx === 0
                        ? "Short"
                        : "Long"
                      : `Option ${idx + 1}`;
                const amount = value?.amount
                  ? new Decimal(value.amount).mul(ratio).toFixed(2)
                  : "0";
                return (
                  <div key={idx} className="rounded-lg bg-white/5 p-2">
                    <p className="mb-1 truncate text-xs font-medium text-white">
                      {outcomeName}
                    </p>
                    <p className="text-xs text-white/70">
                      {amount} {currency}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
