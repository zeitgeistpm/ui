import Decimal from "decimal.js";
import {
  CurrencyTag,
  Liquidity,
  Answers,
} from "lib/state/market-creation/types/form";
import { FormEvent } from "../types";
import { getMetadataForCurrency } from "lib/constants/supported-currencies";
import { useAssetUsdPrice } from "lib/hooks/queries/useAssetUsdPrice";
import { swapFeePresets } from "lib/state/market-creation/constants/swap-fee";
import Input from "components/ui/Input";
import FeeSelect, { Fee } from "./FeeSelect";
import { LiquidityInput } from "./Liquidity";
import { FieldState } from "lib/state/market-creation/types/fieldstate";
import { Disclosure } from "@headlessui/react";
import { LuChevronDown, LuSettings } from "react-icons/lu";

export type LiquidityUnifiedProps = {
  value?: Liquidity;
  onChange: (liquidity: Liquidity) => void;
  currency: CurrencyTag;
  answers: Answers;
  input: {
    name: string;
    value?: Liquidity;
    onChange: (event: FormEvent<Liquidity>) => void;
    onBlur: (event: FormEvent<Liquidity>) => void;
  };
  fieldsState: FieldState;
};

export const LiquidityUnified = ({
  value,
  onChange,
  currency,
  answers,
  input,
  fieldsState,
}: LiquidityUnifiedProps) => {
  const currencyMetadata = getMetadataForCurrency(currency);
  const { data: rawAssetPrice } = useAssetUsdPrice(currencyMetadata?.assetId);

  // Hardcode stablecoins to $1 USD
  // DISABLED: USDC.wh temporarily disabled
  // const isStablecoin = currency === "USDC.wh";
  const isStablecoin = false; // currency === "USDC.wh";
  const baseAssetPrice = isStablecoin ? new Decimal(1) : rawAssetPrice;

  const numOutcomes =
    answers?.type === "scalar" ? 2 : answers?.answers?.length || 0;
  const ratio = numOutcomes > 0 ? 1 / numOutcomes : 0;

  // Derive a concrete base object to avoid spreading undefined
  const base =
    input.value ??
    value ?? {
      deploy: false,
      amount: "",
      rows: [],
      swapFee: {
        type: "preset" as const,
        value: 1,
      },
    };

  const computeRowsForAmount = (amount: string) => {
    if (!numOutcomes || numOutcomes < 2) return [];

    return Array.from({ length: numOutcomes }, (_, index) => {
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
  };

  const handleAmountChange = (amount: string, updatedValue: Liquidity) => {
    onChange(updatedValue);
  };

  const handleFeeChange = (event: FormEvent<Fee | undefined>) => {
    onChange({
      ...base,
      swapFee: event.target.value,
    });
  };

  const handleAdvancedChange = (event: FormEvent<Liquidity>) => {
    input.onChange(event);
    const newValue = event.target.value;
    onChange(newValue);
  };

  const totalValue = value?.amount
    ? baseAssetPrice?.mul(value.amount)
    : new Decimal(0);

  // Check if distribution has been customized (not evenly distributed)
  const isCustomized =
    value?.rows &&
    value.rows.length > 0 &&
    (() => {
      const firstPrice = value.rows[0]?.price?.price;
      return !value.rows.every(
        (row) => row.price?.price?.toString() === firstPrice?.toString(),
      );
    })();

  return (
    <div className="space-y-4">
      {/* Total Liquidity & Swap Fee - One Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Total Liquidity Input */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-white">
            Total Liquidity Amount <span className="text-ztg-red-400">*</span>
          </label>
          <Input
            type="number"
            inputMode="decimal"
            value={value?.amount ?? ""}
            onChange={(e) => {
              const newAmount = e.target.value;
              
              // Compute rows once for the new amount
              const updatedRows = computeRowsForAmount(newAmount);
              const updatedValue: Liquidity = {
                ...base,
                amount: newAmount,
                rows: (updatedRows.length > 0 ? updatedRows : base.rows) as any,
              };

              // Update both parent and form library with the same value
              handleAmountChange(newAmount, updatedValue);
              input.onChange({
                type: "change",
                target: {
                  name: input.name,
                  value: updatedValue,
                },
              });
            }}
            onBlur={(e) => {
              // Derive the current value at blur time to avoid stale render-time base
              const currentAmount = e.currentTarget.value || "";
              const currentValue =
                input.value ??
                value ?? {
                  deploy: false,
                  amount: currentAmount,
                  rows: [],
                  swapFee: {
                    type: "preset" as const,
                    value: 1,
                  },
                };
              // Ensure we use the current input value for amount
              input.onBlur({
                type: "blur",
                target: {
                  name: input.name,
                  value: {
                    ...currentValue,
                    amount: currentAmount,
                  },
                },
              });
            }}
            className="h-12 w-full rounded-lg border-2 border-white/20 bg-white/10 px-4 text-sm text-white backdrop-blur-sm transition-all placeholder:text-white/50 hover:border-white/30 focus:border-white/40"
            placeholder="e.g., 1000"
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

        {/* Swap Fee */}
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-semibold text-white">
            Swap Fee <span className="text-ztg-red-400">*</span>
          </label>
          <FeeSelect
            name={`${input.name}.swapFee`}
            value={value?.swapFee}
            onChange={handleFeeChange}
            presets={swapFeePresets}
            isValid={fieldsState.isValid}
            label="% Swap Fee"
          />
          <p className="text-xs text-white/60">
            💡 Fee earned on each trade. 1% is a common default.
          </p>
        </div>
      </div>

      {/* Fine-tune Distribution - Collapsible */}
      <Disclosure>
        {({ open }) => (
          <div className="rounded-lg bg-white/5">
            <Disclosure.Button className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/5">
              <div className="flex items-center gap-2">
                <LuSettings size={16} className="text-white/70" />
                <span className="text-sm font-semibold text-white">
                  Fine-tune Distribution
                  {isCustomized && (
                    <span className="ml-2 text-xs font-normal text-white/60">
                      (Customized)
                    </span>
                  )}
                </span>
              </div>
              <LuChevronDown
                className={`h-4 w-4 text-white/70 transition-transform ${
                  open ? "rotate-180" : ""
                }`}
              />
            </Disclosure.Button>
            <Disclosure.Panel className=" ">
              <LiquidityInput
                {...input}
                onChange={handleAdvancedChange}
                currency={currency}
                fieldState={fieldsState}
              />
            </Disclosure.Panel>
          </div>
        )}
      </Disclosure>
    </div>
  );
};
