import { isRpcSdk, parseAssetId } from "@zeitgeistpm/sdk";
import Input from "components/ui/Input";
import TransactionButton from "components/ui/TransactionButton";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { useBalances } from "lib/hooks/queries/useBalances";
import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import { useBalance } from "lib/hooks/queries/useBalance";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useGlobalKeyPress } from "lib/hooks/events/useGlobalKeyPress";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { parseAssetIdString } from "lib/util/parse-asset-id";
import { useEffect, useMemo, useState } from "react";
import { formatNumberCompact } from "lib/util/format-compact";
import { isPresent } from "lib/types";

const SellFullSetForm = ({
  marketId,
  onSuccess,
}: {
  marketId: number;
  onSuccess?: () => void;
}) => {
  const wallet = useWallet();
  const notificationStore = useNotifications();
  const [sdk] = useSdkv2();

  const { data: market } = useMarket({ marketId: marketId });

  const baseAssetId = parseAssetIdString(market?.baseAsset);
  const { data: metadata } = useAssetMetadata(baseAssetId);

  const { data: baseAssetBalance } = useBalance(
    wallet.realAddress,
    baseAssetId,
  );

  // Get outcome token IDs from market
  const outcomeAssetIds = useMemo(() => {
    if (!market?.outcomeAssets) return [];
    return market.outcomeAssets
      .map((assetString) => parseAssetId(assetString).unrightOr(undefined))
      .filter(isPresent);
  }, [market?.outcomeAssets]);

  // Fetch balances for all outcome tokens
  const outcomeBalancesQueries = useBalances(
    outcomeAssetIds,
    wallet.realAddress,
  );
  const outcomeBalances = outcomeBalancesQueries
    .map((res) => res.data)
    .filter(isPresent);

  const [amount, setAmount] = useState<string>("0");
  const [maxTokenSet, setMaxTokenSet] = useState<Decimal>(new Decimal(0));

  const {
    send: sellSets,
    isLoading,
    fee,
  } = useExtrinsic(
    () => {
      if (isRpcSdk(sdk) && amount && amount !== "") {
        try {
          return sdk.api.tx.predictionMarkets.sellCompleteSet(
            marketId,
            new Decimal(amount).mul(ZTG).toFixed(0),
          );
        } catch (error) {
          console.error(error);
        }
      }
    },
    {
      onSuccess: () => {
        notificationStore.pushNotification(
          `Sold ${new Decimal(amount).toFixed(1)} full sets`,
          { type: "Success" },
        );
        onSuccess?.();
      },
    },
  );

  useEffect(() => {
    if (outcomeBalances.length === 0) {
      setMaxTokenSet(new Decimal(0));
      return;
    }

    // Find the minimum balance across all outcome tokens
    // This is the max number of complete sets you can sell
    let lowestTokenAmount: Decimal | undefined;
    outcomeBalances.forEach((balance) => {
      if (balance) {
        if (!lowestTokenAmount || balance.lessThan(lowestTokenAmount)) {
          lowestTokenAmount = balance;
        }
      }
    });

    setMaxTokenSet(lowestTokenAmount ?? new Decimal(0));
  }, [outcomeBalances]);

  const handleAmountChange = (amount: string) => {
    setAmount(amount);
  };
  const disabled =
    isLoading ||
    !baseAssetBalance ||
    new Decimal(amount === "" ? 0 : amount).gt(maxTokenSet.div(ZTG)) ||
    new Decimal(amount === "" ? 0 : amount).eq(0);

  const handleSignTransaction = async () => {
    if (disabled || !isRpcSdk(sdk)) {
      return;
    }

    sellSets();
  };

  useGlobalKeyPress("Enter", handleSignTransaction);

  const maxSets = maxTokenSet.div(ZTG).toNumber();

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percentage = Number(e.target.value);
    const calculatedAmount = ((maxSets * percentage) / 100).toFixed(2);
    setAmount(calculatedAmount);
  };

  return (
    <div className="flex w-full flex-col gap-y-4">
      <div className="flex items-center justify-between rounded-lg border border-sky-200/30 bg-sky-50/50 p-4 shadow-sm backdrop-blur-sm">
        <span className="text-sm font-semibold text-sky-700">Your Balance</span>
        <span className="font-bold text-sky-900">
          {maxTokenSet.div(ZTG).toFixed(2)} Full Sets
        </span>
      </div>

      <div className="h-[56px] w-full rounded-lg border border-sky-200/30 bg-white/60 px-4 shadow-sm backdrop-blur-sm transition-all focus-within:border-sky-400 focus-within:shadow-md">
        <input
          type="number"
          min="0"
          max={maxSets}
          value={amount}
          step="0.1"
          onChange={(e) => handleAmountChange(e.target.value)}
          className="h-full w-full bg-transparent text-right text-base font-medium text-sky-900 outline-none"
        />
      </div>

      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={maxSets > 0 ? (Number(amount) / maxSets) * 100 : 0}
        onChange={handleSliderChange}
        className="w-full cursor-pointer accent-sky-600"
      />

      <div className="rounded-lg border border-sky-200/30 bg-sky-50/50 p-4 shadow-sm backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-sky-700">
            You'll Sell
          </span>
          <span className="font-bold text-sky-900">
            {amount ? amount : 0} Full Sets
          </span>
        </div>
        {market?.categories && Number(amount) > 0 && (
          <div className="space-y-2 border-t border-sky-200/30 pt-3">
            <p className="mb-2 text-xs font-semibold text-sky-600">
              Breakdown per set:
            </p>
            {market.categories.map((category, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm"
              >
                <span className="capitalize text-sky-700">
                  {category.name || `Outcome ${index + 1}`}
                </span>
                <span className="font-medium text-sky-900">
                  {amount ? amount : 0} tokens
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-sky-200/30 bg-white/60 p-4 shadow-sm backdrop-blur-sm">
        <div className="mb-2 text-center">
          <span className="text-sm font-semibold text-sky-700">
            You'll Receive
          </span>
        </div>
        <div className="text-center">
          <span className="text-lg font-bold text-sky-900">
            {amount ? amount : 0} {metadata?.symbol}
          </span>
        </div>
      </div>

      <div className="rounded-lg border border-sky-200/30 bg-white/60 p-3 shadow-sm backdrop-blur-sm">
        <p className="text-center text-sm text-sky-700">
          <span className="font-semibold">Price Per Set:</span> 1{" "}
          {metadata?.symbol}
        </p>
      </div>

      <TransactionButton
        onClick={handleSignTransaction}
        disabled={disabled}
        loading={isLoading}
      >
        Confirm Sell
      </TransactionButton>
    </div>
  );
};

export default SellFullSetForm;
