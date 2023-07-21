import { isRpcSdk } from "@zeitgeistpm/sdk-next";
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
    wallet.realAddress,
    baseAssetId,
  );

  const { data: balances } = useAccountPoolAssetBalances(
    wallet.realAddress,
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
    <div>
      <div>
        <div className="flex items-center mt-ztg-24 mb-ztg-8">
          {saturatedMarket?.categories?.map((_, index) => (
            <div
              key={index}
              className="rounded-full w-ztg-20 h-ztg-20 -mr-ztg-8 border-sky-600 border-2"
              style={{ backgroundColor: colors[index] }}
            ></div>
          ))}
          <div className="font-bold  ml-ztg-20  text-ztg-16-150 text-black dark:text-white">
            Full Set
          </div>
          <span className="font-mono text-ztg-12-150 font-medium ml-auto ">
            {maxTokenSet.div(ZTG).toString()}
          </span>
        </div>
        <Input
          type="number"
          min="0"
          value={amount}
          step="0.1"
          onChange={(e) => handleAmountChange(e.target.value)}
          className="text-ztg-14-150 font-mono text-right w-full p-2 outline-none bg-sky-200"
        />
      </div>
      <div>
        <div className="flex items-center mt-ztg-24 mb-ztg-8">
          <div className="rounded-full w-ztg-20 h-ztg-20 mr-ztg-10 border-sky-600 border-2 bg-ztg-blue"></div>
          <div className="font-bold   text-ztg-16-150 uppercase text-black dark:text-white">
            {metadata?.symbol}
          </div>
          <span className="font-mono text-ztg-12-150 font-medium ml-auto text-sky-600">
            {baseAssetBalance?.div(ZTG).toNumber()}
          </span>
        </div>
        <Input
          type="number"
          value={amount}
          step="0.1"
          disabled={true}
          className="text-ztg-14-150 font-mono text-right w-full p-2 outline-none bg-sky-200 disabled:bg-transparent disabled:border-sky-200 border-1"
        />
      </div>
      <div className="h-ztg-18 flex px-ztg-8 justify-between text-ztg-12-150 my-ztg-10 text-sky-600">
        <span className=" font-bold">Price per Set:</span>
        <span className="font-mono font-medium">1 {metadata?.symbol}</span>
      </div>
      <TransactionButton
        className="!rounded-ztg-10 h-ztg-50"
        onClick={handleSignTransaction}
        disabled={disabled}
      >
        Sell Full Set
      </TransactionButton>
    </div>
  );
};

export default SellFullSetForm;
