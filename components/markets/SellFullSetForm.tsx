import { isRpcSdk } from "@zeitgeistpm/sdk";
import Input from "components/ui/Input";
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
import { useGlobalKeyPress } from "lib/hooks/events/useGlobalKeyPress";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { parseAssetIdString } from "lib/util/parse-asset-id";
import { useEffect, useState } from "react";
import { formatNumberCompact } from "lib/util/format-compact";

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

  const { data: pool } = usePool({ marketId: marketId });
  const baseAssetId = parseAssetIdString(pool?.baseAsset);
  const { data: metadata } = useAssetMetadata(baseAssetId);

  const { data: baseAssetBalance } = useBalance(
    wallet.realAddress,
    baseAssetId,
  );

  const { data: balances } = useAccountPoolAssetBalances(
    wallet.realAddress,
    pool,
  );

  const [amount, setAmount] = useState<string>("0");
  const [maxTokenSet, setMaxTokenSet] = useState<Decimal>(new Decimal(0));

  const {
    send: sellSets,
    isLoading,
    fee,
  } = useExtrinsic(
    () => {
      if (isRpcSdk(sdk) && amount && amount !== "") {
        return sdk.api.tx.predictionMarkets.sellCompleteSet(
          marketId,
          new Decimal(amount).mul(ZTG).toFixed(0),
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
        <div className="mb-7 flex items-center justify-center">
          <span>Your Balance: &nbsp;</span>
          <span className="font-medium">
            {maxTokenSet.div(ZTG).toFixed(2)} Full Sets
          </span>
        </div>
        <div className="center mb-7 h-[56px] w-full bg-anti-flash-white">
          <input
            type="number"
            min="0"
            value={amount}
            step="0.1"
            onChange={(e) => handleAmountChange(e.target.value)}
            className="w-full bg-transparent text-center text-lg outline-none"
          />
        </div>
      </div>
      <div>
        <div className="text-center">
          <p className="mb-7 text-lg font-medium">
            You'll Get {amount ? amount : 0} {metadata?.symbol}
          </p>
          <p className="mb-7 text-center text-sm">
            <span className="text-sky-600">Price Per Set: </span>1{" "}
            {metadata?.symbol}
          </p>
        </div>
      </div>
      <TransactionButton onClick={handleSignTransaction} disabled={disabled}>
        Confirm Sell
        {fee && (
          <span className="block text-xs font-normal">
            Transaction fee:{" "}
            {formatNumberCompact(fee.amount.div(ZTG).toNumber())} {fee.symbol}
          </span>
        )}
      </TransactionButton>
    </div>
  );
};

export default SellFullSetForm;
