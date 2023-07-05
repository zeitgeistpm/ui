import { isRpcSdk } from "@zeitgeistpm/sdk-next";
import TransactionButton from "components/ui/TransactionButton";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { useAccountPoolAssetBalances } from "lib/hooks/queries/useAccountPoolAssetBalances";
import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import { useBalance } from "lib/hooks/queries/useBalance";
import { useMarket } from "lib/hooks/queries/useMarket";
import { usePool } from "lib/hooks/queries/usePool";
import { useSaturatedMarket } from "lib/hooks/queries/useSaturatedMarket";
import { useExtrinsic } from "lib/hooks/useExtrinsic";
import { useGlobalKeyPress } from "lib/hooks/useGlobalKeyPress";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { calcMarketColors } from "lib/util/color-calc";
import { parseAssetIdString } from "lib/util/parse-asset-id";
import { useEffect, useState } from "react";

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

  const { data: market } = useMarket({ marketId });
  const { data: saturatedMarket } = useSaturatedMarket(market ?? undefined);
  const { data: pool } = usePool({ marketId: marketId });
  const baseAssetId = parseAssetIdString(pool?.baseAsset);
  const { data: metadata } = useAssetMetadata(baseAssetId);

  const { data: baseAssetBalance } = useBalance(
    wallet.getActiveSigner()?.address,
    baseAssetId,
  );

  const { data: balances } = useAccountPoolAssetBalances(
    wallet.getActiveSigner()?.address,
    pool,
  );

  const [amount, setAmount] = useState<string>("0");
  const [maxTokenSet, setMaxTokenSet] = useState<Decimal>(new Decimal(0));

  const colors = market?.categories
    ? calcMarketColors(marketId, market.categories.length)
    : [];

  const { send: sellSets, isLoading } = useExtrinsic(
    () => {
      if (isRpcSdk(sdk)) {
        return sdk.api.tx.predictionMarkets.sellCompleteSet(
          marketId,
          new Decimal(amount).mul(ZTG).toNumber(),
        );
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
    let lowestTokenAmount: Decimal = new Decimal(0);
    balances?.forEach((balance) => {
      const free = new Decimal(balance.free.toNumber());
      if (lowestTokenAmount.eq(0) || free.lessThan(lowestTokenAmount)) {
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
    new Decimal(amount === "" ? 0 : amount).gt(maxTokenSet.div(ZTG)) ||
    new Decimal(amount === "" ? 0 : amount).eq(0);

  const handleSignTransaction = async () => {
    if (disabled || !isRpcSdk(sdk)) {
      return;
    }

    sellSets();
  };

  useGlobalKeyPress("Enter", handleSignTransaction);

  return (
    <div className="w-full">
      <div>
        <div className="flex justify-center items-center mb-7">
          <span>Your Balance: &nbsp;</span>
          <span className="font-medium">
            {maxTokenSet.div(ZTG).toString()} Full Sets
          </span>
        </div>
        <div className="h-[56px] bg-anti-flash-white center mb-7 w-full">
          <input
            type="number"
            min="0"
            value={amount}
            step="0.1"
            onChange={(e) => handleAmountChange(e.target.value)}
            className="w-full bg-transparent outline-none text-center text-lg"
          />
        </div>
      </div>
      <div>
        <div className="text-center">
          <p className="text-lg font-medium mb-7">
            You'll Get {baseAssetBalance?.div(ZTG).toNumber().toFixed(2)}{" "}
            {metadata?.symbol}
          </p>
          <p className="text-sm text-center mb-7">
            <span className="text-sky-600">Price per Set: </span>1{" "}
            {metadata?.symbol}
          </p>
        </div>
      </div>
      <TransactionButton onClick={handleSignTransaction} disabled={disabled}>
        Confirm Sell
      </TransactionButton>
    </div>
  );
};

export default SellFullSetForm;
