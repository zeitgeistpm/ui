import { useState, useEffect } from "react";
import {
  CurrencyTag,
  Liquidity,
  Answers,
} from "lib/state/market-creation/types/form";
import { LiquidityInput } from "./Liquidity";
import { LiquiditySimple } from "./LiquiditySimple";
import { FormEvent } from "../types";
import { FieldState } from "lib/state/market-creation/types/fieldstate";
import Toggle from "components/ui/Toggle";

export type LiquidityModeToggleProps = {
  value?: Liquidity;
  answers: Answers;
  currency: CurrencyTag;
  onChange: (liquidity: Liquidity) => void;
  input: {
    name: string;
    value?: Liquidity;
    onChange: (event: FormEvent<Liquidity>) => void;
    onBlur: (event: FormEvent<Liquidity>) => void;
  };
  fieldsState: FieldState;
};

export const LiquidityModeToggle = ({
  value,
  answers,
  currency,
  onChange,
  input,
  fieldsState,
}: LiquidityModeToggleProps) => {
  const [isSimple, setIsSimple] = useState(true);

  // Auto-switch to simple if using simple mode and values change
  useEffect(() => {
    if (isSimple && value?.rows && value.rows.length > 0) {
      // Check if rows are evenly distributed (simple mode characteristic)
      const firstPrice = value.rows[0]?.price?.price;
      const isEvenlyDistributed = value.rows.every(
        (row) => row.price?.price?.toString() === firstPrice?.toString(),
      );
      if (!isEvenlyDistributed) {
        setIsSimple(false);
      }
    }
  }, [value, isSimple]);

  const handleAdvancedChange = (event: FormEvent<Liquidity>) => {
    input.onChange(event);
    setIsSimple(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-white/70">Mode:</span>
          <div className="flex items-center gap-2 rounded-lg bg-white/10 px-2 py-1">
            <span
              className={`text-xs font-medium transition-colors ${
                isSimple ? "text-white" : "text-white/60"
              }`}
            >
              Simple
            </span>
            <Toggle
              checked={!isSimple}
              onChange={(checked) => setIsSimple(!checked)}
              activeClassName="bg-ztg-green-600"
            />
            <span
              className={`text-xs font-medium transition-colors ${
                !isSimple ? "text-white" : "text-white/60"
              }`}
            >
              Advanced
            </span>
          </div>
        </div>
        {isSimple && (
          <p className="text-xs text-white/60">
            💡 Simple mode automatically distributes liquidity evenly
          </p>
        )}
      </div>

      {isSimple ? (
        <LiquiditySimple
          name={input.name}
          value={value}
          onChange={(event) => {
            input.onChange(event);
          }}
          currency={currency}
          answers={answers}
        />
      ) : (
        <div>
          <LiquidityInput
            {...input}
            onChange={handleAdvancedChange}
            currency={currency}
            fieldState={fieldsState}
          />
          <p className="mt-2 text-xs text-white/60">
            💡 Advanced mode lets you set custom prices and amounts for each
            outcome
          </p>
        </div>
      )}
    </div>
  );
};
