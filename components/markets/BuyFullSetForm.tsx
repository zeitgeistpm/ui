import { isRpcSdk, parseAssetId } from "@zeitgeistpm/sdk-next";
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
import { useEffect, useState } from "react";
import {
  getMetadataForCurrency,
  SupportedCurrencyTag,
} from "lib/constants/supported-currencies";
import Image from "next/image";

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
  const { data: market } = useMarket({ marketId });
  const { data: saturatedMarket } = useSaturatedMarket(market ?? undefined);
  const { data: pool } = usePool({ marketId: marketId });
  const baseAssetId = pool?.baseAsset
    ? parseAssetId(pool.baseAsset).unrightOr(undefined)
    : undefined;
  const { data: metadata } = useAssetMetadata(baseAssetId);

  console.log(saturatedMarket);

  const [amount, setAmount] = useState<string>("0");

  const [maxTokenSet, setMaxTokenSet] = useState<Decimal>(new Decimal(0));

  const { data: baseAssetBalance } = useBalance(
    wallet.getActiveSigner()?.address,
    baseAssetId,
  );

  const { data: balances } = useAccountPoolAssetBalances(
    wallet.getActiveSigner()?.address,
    pool,
  );

  const { send: buySet, isLoading } = useExtrinsic(
    () => {
      if (isRpcSdk(sdk)) {
        return sdk.api.tx.predictionMarkets.buyCompleteSet(
          marketId,
          new Decimal(amount).mul(ZTG).toNumber(),
        );
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

  // useEffect(() => {
  //   const { weight, partialFee } = await api.rpc.payment.queryInfo(extrinsic);
  //   console.log(`This transaction will cost ${partialFee} units and has a weight of ${weight}`);
  // },[])

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
  const { image } = getMetadataForCurrency(
    (metadata?.symbol as SupportedCurrencyTag) ?? "ZTG",
  );

  return (
    <div className="w-full">
      <div>
        <div className="flex justify-center items-center mb-7">
          <div className="flex items-center justify-center gap-2">
            <span>Your Balance: </span>
            <Image
              width={20}
              height={20}
              src={image}
              alt="Currency token logo"
              className="rounded-full"
            />
            <span className="font-medium">
              {baseAssetBalance?.div(ZTG).toNumber().toFixed(2)}{" "}
              {metadata?.symbol}
            </span>
          </div>
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
            You'll get {amount} Full Sets
          </p>
          <p className="text-sm text-center mb-7">
            <span className="text-sky-600">Price per Set: </span>1{" "}
            {metadata?.symbol}
          </p>
        </div>
      </div>
      <TransactionButton onClick={handleSignTransaction} disabled={disabled}>
        Confirm Buy
      </TransactionButton>
    </div>
  );
};

export default BuyFullSetForm;
