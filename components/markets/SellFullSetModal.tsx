import { isRpcSdk, parseAssetId } from "@zeitgeistpm/sdk-next";
import { AmountInput } from "components/ui/inputs";
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
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useNotifications } from "lib/state/notifications";
import { useWallet } from "lib/state/wallet";
import { useModalStore } from "lib/stores/ModalStore";
import { useEffect, useState } from "react";
import Loader from "react-spinners/PulseLoader";

const SellFullSetModal = ({ marketId }: { marketId: number }) => {
  const wallet = useWallet();
  const notificationStore = useNotifications();
  const modalStore = useModalStore();
  const [sdk] = useSdkv2();

  const { data: market } = useMarket({ marketId });
  const { data: saturatedMarket } = useSaturatedMarket(market);
  const { data: pool } = usePool({ marketId: marketId });
  const baseAssetId = parseAssetId(pool?.baseAsset).unrightOr(null);
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
        modalStore.closeModal();
      },
    },
  );

  useEffect(() => {
    let lowestTokenAmount: Decimal = null;
    balances?.forEach((balance) => {
      const free = new Decimal(balance.free.toNumber());
      if (!lowestTokenAmount || free.lessThan(lowestTokenAmount)) {
        lowestTokenAmount = free;
      }
    });
    setMaxTokenSet(lowestTokenAmount ?? new Decimal(0));
  }, [balances]);

  const handleAmountChange = (amount: string) => {
    setAmount(amount);
  };

  const handleSignTransaction = async () => {
    if (
      Number(amount) > baseAssetBalance?.div(ZTG).toNumber() ||
      Number(amount) === 0 ||
      !isRpcSdk(sdk)
    ) {
      return;
    }

    sellSets();
  };

  useEffect(() => {
    modalStore.setOnEnterKeyPress(() => handleSignTransaction());
  }, [modalStore, market, handleSignTransaction]);

  const disabled =
    isLoading ||
    Number(amount) > maxTokenSet.toNumber() ||
    Number(amount) === 0;

  return (
    <div>
      <div>
        <div className="flex items-center mt-ztg-24 mb-ztg-8">
          {saturatedMarket?.categories.map((outcome, index) => (
            <div
              key={index}
              className="rounded-full w-ztg-20 h-ztg-20 -mr-ztg-8 border-sky-600 border-2"
              style={{ backgroundColor: outcome.color }}
            ></div>
          ))}
          <div className="font-bold  ml-ztg-20  text-ztg-16-150 text-black dark:text-white">
            Full Set
          </div>
          <span className="font-mono text-ztg-12-150 font-medium ml-auto ">
            {maxTokenSet.div(ZTG).toString()}
          </span>
        </div>
        <AmountInput value={amount} onChange={handleAmountChange} min="0" />
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
        <AmountInput
          value={amount}
          onChange={handleAmountChange}
          disabled={true}
          min="0"
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
        {isLoading ? <Loader size={8} /> : "Sign Transaction"}
      </TransactionButton>
    </div>
  );
};

export default SellFullSetModal;
