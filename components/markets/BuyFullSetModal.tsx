import { transactionErrorToString } from "@zeitgeistpm/rpc";
import { Context, hasMarketMethods } from "@zeitgeistpm/sdk-next";
import { isRight } from "@zeitgeistpm/utility/dist/either";
import { AmountInput } from "components/ui/inputs";
import TransactionButton from "components/ui/TransactionButton";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { useAccountPoolAssetBalances } from "lib/hooks/queries/useAccountPoolAssetBalances";
import { useMarket } from "lib/hooks/queries/useMarket";
import { usePool } from "lib/hooks/queries/usePool";
import { useSaturatedMarket } from "lib/hooks/queries/useSaturatedMarket";
import { useModalStore } from "lib/stores/ModalStore";
import { useNotificationStore } from "lib/stores/NotificationStore";
import { useStore } from "lib/stores/Store";
import { observer } from "mobx-react";
import { useEffect, useState } from "react";
import Loader from "react-spinners/PulseLoader";

const BuyFullSetModal = observer(({ marketId }: { marketId: number }) => {
  const store = useStore();
  const { wallets } = store;
  const notificationStore = useNotificationStore();
  const modalStore = useModalStore();

  const { data: market } = useMarket(marketId);
  const { data: saturatedMarket } = useSaturatedMarket(market);
  const { data: pool } = usePool({ marketId: marketId });

  const { data: balances } = useAccountPoolAssetBalances(
    wallets.getActiveSigner(),
    pool,
  );

  const [transacting, setTransacting] = useState(false);
  const [amount, setAmount] = useState<string>("0");
  const [maxTokenSet, setMaxTokenSet] = useState<Decimal>(new Decimal(0));

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
      Number(amount) > wallets.activeBalance.toNumber() ||
      Number(amount) === 0
    ) {
      return;
    }

    setTransacting(true);

    if (hasMarketMethods<Context>(market)) {
      const signer = wallets.getActiveSigner();

      notificationStore?.pushNotification("Transacting...", {
        autoRemove: true,
      });

      const result = await market
        .buyCompleteSet({
          amount: new Decimal(amount).mul(ZTG).toNumber(),
          signer,
          hooks: {
            inBlock: () => {
              notificationStore.pushNotification(
                `In block: bought ${new Decimal(amount).toFixed(
                  1,
                )} full sets. Waiting for finalization...`,
                { type: "Info", autoRemove: true, lifetime: 45 },
              );
              setTransacting(false);
              modalStore.closeModal();
            },
            retracted: () => {
              notificationStore.pushNotification(
                `Transaction retracted and will take longer than usual to be finalized.`,
                { type: "Info", lifetime: 45 },
              );
            },
          },
        })
        .asEither();

      if (isRight(result)) {
        notificationStore.pushNotification(
          `Finalized: Bought full set ${new Decimal(amount).toFixed(1)}`,
          { type: "Success", autoRemove: true, lifetime: 9 },
        );
      } else {
        const error = result.left;
        const message = transactionErrorToString(error);
        notificationStore.pushNotification(message, {
          type: "Error",
          lifetime: 12,
          autoRemove: true,
        });
      }
    }

    setTransacting(false);
    modalStore.closeModal();
  };

  useEffect(() => {
    modalStore.setOnEnterKeyPress(() => handleSignTransaction());
  }, [modalStore, market, handleSignTransaction]);

  const disabled =
    transacting ||
    !hasMarketMethods<Context>(market) ||
    Number(amount) > wallets.activeBalance.toNumber() ||
    Number(amount) === 0;

  return (
    <div>
      <div>
        <div className="flex items-center mt-ztg-24 mb-ztg-8">
          <div className="rounded-full w-ztg-20 h-ztg-20 mr-ztg-10 border-sky-600 border-2 bg-ztg-blue"></div>
          <div className="font-bold   text-ztg-16-150 uppercase text-black dark:text-white">
            {store.config.tokenSymbol}
          </div>
          <span className="font-mono text-ztg-12-150 font-medium ml-auto text-sky-600">
            {wallets.activeBalance.toNumber()}
          </span>
        </div>
        <AmountInput value={amount} onChange={handleAmountChange} min="0" />
      </div>
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
        <AmountInput
          value={amount}
          onChange={handleAmountChange}
          disabled={true}
          min="0"
        />
      </div>
      <div className="h-ztg-18 flex px-ztg-8 justify-between text-ztg-12-150 my-ztg-10 text-sky-600">
        <span className=" font-bold">Price per Set:</span>
        <span className="font-mono font-medium">
          1 {store.config.tokenSymbol}
        </span>
      </div>
      <TransactionButton
        className="!rounded-ztg-10 h-ztg-50"
        onClick={handleSignTransaction}
        disabled={disabled}
      >
        {transacting ? <Loader size={8} /> : "Sign Transaction"}
      </TransactionButton>
    </div>
  );
});

export default BuyFullSetModal;
