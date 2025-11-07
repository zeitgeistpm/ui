import {
  IOBaseAssetId,
  IOForeignAssetId,
  isRpcSdk,
  parseAssetId,
} from "@zeitgeistpm/sdk";
import TransactionButton from "components/ui/TransactionButton";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { lookupAssetImagePath } from "lib/constants/foreign-asset";
import { useGlobalKeyPress } from "lib/hooks/events/useGlobalKeyPress";
import { useAccountPoolAssetBalances } from "lib/hooks/queries/useAccountPoolAssetBalances";
import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import { useBalance } from "lib/hooks/queries/useBalance";
import { useMarket } from "lib/hooks/queries/useMarket";
import { usePool } from "lib/hooks/queries/usePool";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { formatNumberCompact } from "lib/util/format-compact";
import Image from "next/image";
import { useEffect, useState } from "react";

const BuyFullSetForm = ({
  marketId,
  onSuccess,
}: {
  marketId: number;
  onSuccess?: () => void;
}) => {
  const [sdk] = useSdkv2();
  const wallet = useWallet();
  const notificationStore = useNotifications();

  const { data: market } = useMarket({ marketId: marketId });
  const { data: pool } = usePool({ marketId: marketId });

  const baseAssetId = market?.baseAsset
    ? parseAssetId(market.baseAsset).unrightOr(undefined)
    : undefined;

  const { data: metadata } = useAssetMetadata(baseAssetId);

  const [amount, setAmount] = useState<string>("0");
  const [maxTokenSet, setMaxTokenSet] = useState<Decimal>(new Decimal(0));

  const { data: baseAssetBalance } = useBalance(
    wallet.realAddress,
    baseAssetId,
  );

  const { data: balances } = useAccountPoolAssetBalances(
    wallet.realAddress,
    pool,
  );

  const {
    send: buySet,
    isLoading,
    fee,
  } = useExtrinsic(
    () => {
      if (isRpcSdk(sdk) && amount && amount !== "") {
        try {
          return sdk.api.tx.predictionMarkets.buyCompleteSet(
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
          `Bought ${new Decimal(amount).toFixed(1)} full sets`,
          { type: "Success" },
        );
        onSuccess?.();
      },
    },
  );

  useEffect(() => {
    let lowestTokenAmount: Decimal = new Decimal(0);
    balances?.forEach((balance) => {
      const free = new Decimal(balance.free.toNumber());
      if (!lowestTokenAmount || free.lessThan(lowestTokenAmount)) {
        lowestTokenAmount = free;
      }
    });
    setMaxTokenSet(lowestTokenAmount);
  }, [balances]);

  const handleAmountChange = (amount: string) => {
    setAmount(amount);
  };

  const disabled =
    isLoading ||
    !baseAssetBalance ||
    Number(amount) > baseAssetBalance?.div(ZTG).toNumber() ||
    Number(amount) === 0;

  const handleSignTransaction = async () => {
    if (disabled || !isRpcSdk(sdk)) {
      return;
    }
    buySet();
  };

  useGlobalKeyPress("Enter", handleSignTransaction);

  const imagePath = lookupAssetImagePath(baseAssetId);

  const maxBalance = baseAssetBalance?.div(ZTG).toNumber() ?? 0;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percentage = Number(e.target.value);
    const calculatedAmount = ((maxBalance * percentage) / 100).toFixed(2);
    setAmount(calculatedAmount);
  };

  return (
    <div className="flex w-full flex-col gap-y-4">
      <div className="flex items-center justify-between rounded-lg border-2 border-ztg-primary-200/30 bg-ztg-primary-50/50 p-4 shadow-sm backdrop-blur-sm">
        <span className="text-sm font-semibold text-ztg-primary-700">
          Your Balance
        </span>
        <div className="flex items-center gap-2">
          {imagePath && (
            <Image
              width={16}
              height={16}
              src={imagePath}
              alt="Currency token logo"
              className="rounded-full"
            />
          )}
          <span className="font-bold text-ztg-primary-900">
            {baseAssetBalance?.div(ZTG).toNumber().toFixed(2)}{" "}
            {metadata?.symbol}
          </span>
        </div>
      </div>

      <div className="h-[56px] w-full rounded-lg border-2 border-ztg-primary-200/30 bg-white/60 px-4 shadow-sm backdrop-blur-sm transition-all focus-within:border-ztg-primary-400 focus-within:shadow-md">
        <input
          type="number"
          min="0"
          max={maxBalance}
          value={amount}
          step="0.1"
          onChange={(e) => handleAmountChange(e.target.value)}
          className="h-full w-full bg-transparent text-right text-base font-medium text-ztg-primary-900 outline-none"
        />
      </div>

      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={maxBalance > 0 ? (Number(amount) / maxBalance) * 100 : 0}
        onChange={handleSliderChange}
        className="w-full cursor-pointer accent-sky-600"
      />

      <div className="rounded-lg border-2 border-ztg-primary-200/30 bg-ztg-primary-50/50 p-4 shadow-sm backdrop-blur-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-ztg-primary-700">
            You'll Receive
          </span>
          <span className="font-bold text-ztg-primary-900">
            {amount ? amount : 0} Full Sets
          </span>
        </div>
        {market?.categories && Number(amount) > 0 && (
          <div className="space-y-2 border-t-2 border-ztg-primary-200/30 pt-3">
            <p className="mb-2 text-xs font-semibold text-ztg-primary-600">
              Breakdown per set:
            </p>
            {market.categories.map((category, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm"
              >
                <span className="capitalize text-ztg-primary-700">
                  {category.name || `Outcome ${index + 1}`}
                </span>
                <span className="font-medium text-ztg-primary-900">
                  {amount ? amount : 0} tokens
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border-2 border-ztg-primary-200/30 bg-white/60 p-3 shadow-sm backdrop-blur-sm">
        <p className="text-center text-sm text-ztg-primary-700">
          <span className="font-semibold">Price Per Set:</span> 1{" "}
          {metadata?.symbol}
        </p>
      </div>

      <TransactionButton
        onClick={handleSignTransaction}
        disabled={disabled}
        loading={isLoading}
      >
        Confirm Buy
      </TransactionButton>
    </div>
  );
};

export default BuyFullSetForm;
