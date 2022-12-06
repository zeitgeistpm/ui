import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { useQuery } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useStore } from "lib/stores/Store";
import { useMemo } from "react";
import { useTradeslipItems } from "./items";
import { useTradeslipItemsState } from "./tradeslipItemsState";

/**
 * Total state for the tradeslip items.
 */
export type TradeslipTotalState = {
  /**
   * The aggregated sum/cost/gain for all trade slip items.
   */
  sum: Decimal;
  /**
   * The batched transaction for all trade slip items.
   */
  batchTransaction: null | SubmittableExtrinsic<"promise", ISubmittableResult>;
  /**
   * Transaction fees for the batched transaction.
   */
  transactionFees: Decimal;
};

/**
 * Get totals state for all trade slip items like total sum, batched transaction and total transaction fees.
 *
 * @returns UseTradeslipTotalState
 */
export const useTradeslipTotalState = (): TradeslipTotalState => {
  const [sdk, id] = useSdkv2();

  const { wallets } = useStore();
  const signer = wallets.activeAccount ? wallets.getActiveSigner() : null;

  const { items } = useTradeslipItems();
  const states = useTradeslipItemsState(items);

  const sum = Object.values(states).reduce((sum, state) => {
    if (state.item.action === "buy") return sum.minus(state.sum);
    return sum.plus(state.sum);
  }, new Decimal(0));

  const batchTransaction: null | SubmittableExtrinsic<
    "promise",
    ISubmittableResult
  > = useMemo(() => {
    const transactions = Object.values(states).map(
      ({ transaction }) => transaction,
    );
    if (sdk && isRpcSdk(sdk) && transactions.length) {
      return sdk.context.api.tx.utility.batch(transactions);
    }
    return null;
  }, [sdk, states]);

  const { data: transactionFees } = useQuery(
    [id, "tradeslip-batch-transaction-fee", items],
    async () => {
      if (!batchTransaction) return new Decimal(0);
      return new Decimal(
        (
          await batchTransaction.paymentInfo(signer.address)
        ).partialFee.toNumber(),
      );
    },
    {
      keepPreviousData: true,
      enabled: Boolean(signer),
    },
  );

  return {
    sum,
    batchTransaction,
    transactionFees,
  };
};
