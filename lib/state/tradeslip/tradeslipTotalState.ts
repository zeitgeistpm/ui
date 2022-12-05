import { isRpcSdk } from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { SubmittableExtrinsic } from "@polkadot/api/types";
import { ISubmittableResult } from "@polkadot/types/types";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useMemo } from "react";
import { useTradeslipItems } from "./items";
import { useTradeslipItemsState } from "./tradeslipItemsState";
import { useQuery } from "@tanstack/react-query";
import { useStore } from "lib/stores/Store";

export type UseTradeslipTotalState = {
  sum: Decimal;
  batchTransaction: null | SubmittableExtrinsic<"promise", ISubmittableResult>;
  transactionFees: Decimal;
};

export const useTradeslipTotalState = (): UseTradeslipTotalState => {
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
    [id, items, batchTransaction?.hash.toString()],
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
