import { useQueryClient } from "@tanstack/react-query";
import Decimal from "decimal.js";
import { ZTG } from "lib/constants";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useMemo } from "react";
import { useTradeslipItems } from "./items";
import {
  itemKey,
  rootKey,
  UseTradslipRemoteDataQuery,
} from "./tradeslipItemState";

export const useTradeslipTotalState = () => {
  const [, id] = useSdkv2();
  const queryClient = useQueryClient();

  const key = [id, rootKey];

  const { items } = useTradeslipItems();

  const tradeslipItemsState = useMemo(() => {
    return queryClient.getQueriesData<UseTradslipRemoteDataQuery>(key);
  }, [key, items, queryClient.getQueryState(key)]);

  const sum = useMemo(() => {
    if (items && tradeslipItemsState) {
      return items.reduce((acc, item) => {
        const state = tradeslipItemsState.find(([key]) => {
          return itemKey(item) === key[2];
        });

        if (!state) return acc;

        console.log(state[1]?.sum.div(ZTG).toString());

        return item.action === "buy"
          ? acc.minus(state[1]?.sum ?? 0)
          : acc.plus(state[1]?.sum ?? 0);
      }, new Decimal(0));
    }
    return new Decimal(0);
  }, [tradeslipItemsState]);

  return {
    sum,
  };
};
