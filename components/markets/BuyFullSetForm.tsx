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

  return (
    <div className="w-full">
      <div>
        <div className="mb-7 flex items-center justify-center">
          <div className="flex items-center justify-center gap-2">
            <span>Your Balance: </span>
            {imagePath && (
              <Image
                width={20}
                height={20}
                src={imagePath}
                alt="Currency token logo"
                className="rounded-full"
              />
            )}
            <span className="font-medium">
              {baseAssetBalance?.div(ZTG).toNumber().toFixed(2)}{" "}
              {metadata?.symbol}
            </span>
          </div>
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
            You'll get {amount ? amount : 0} Full Sets
          </p>
          <p className="mb-7 text-center text-sm">
            <span className="text-sky-600">Price Per Set: </span>1{" "}
            {metadata?.name}
          </p>
        </div>
      </div>
      <TransactionButton
        onClick={handleSignTransaction}
        disabled={disabled}
        loading={isLoading}
      >
        Confirm Buy
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

export default BuyFullSetForm;
