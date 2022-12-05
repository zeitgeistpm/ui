import { useQueries, useQueryClient } from "@tanstack/react-query";
import Decimal from "decimal.js";
import { isNotNull } from "@zeitgeistpm/utility/dist/null";
import { ZTG } from "lib/constants";
import { key } from "lib/hooks/queries/useSaturatedPoolsIndex";
import { useSdkv2 } from "lib/hooks/useSdkv2";
import { useEffect, useMemo, useState } from "react";
import { TradeSlipItem, useTradeslipItems } from "./items";
import { itemKey, rootKey, UseTradeslipItemState } from "./tradeslipItemState";

export const useTradeslipTotalState = () => {
  const [, id] = useSdkv2();
  const { items } = useTradeslipItems();

  const queryClient = useQueryClient();

  const [sum, setSum] = useState(new Decimal(0));

  const key = [id, rootKey];

  useEffect(() => {
    setTimeout(() => {
      const states = queryClient.getQueriesData<UseTradeslipItemState>(key);

      const itemStates: [TradeSlipItem, UseTradeslipItemState][] = items
        .map((item) => {
          const state = states.find(([key]) => key[2] === itemKey(item));
          if (state) {
            return [item, state[1]] as [TradeSlipItem, UseTradeslipItemState];
          }
          return null;
        })
        .filter(isNotNull);

      setSum(
        itemStates.reduce((sum, [item, state]) => {
          if (item.action === "buy") {
            return sum.minus(state?.sum ?? 0);
          }
          return sum.plus(state?.sum ?? 0);
        }, new Decimal(0)),
      );
    }, 66);
  }, [queryClient, items, queryClient.getQueryState(key)]);

  return {
    sum,
  };
};
