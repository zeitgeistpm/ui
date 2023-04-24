import { useQueryClient } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk-next";
import { useEffect } from "react";
import { accountAssetBalanceRootKey } from "./queries/useAccountAssetBalances";
import { accountPoolAssetBalancesRootKey } from "./queries/useAccountPoolAssetBalances";
import { balanceRootKey } from "./queries/useBalance";
import { tradeItemStateRootQueryKey } from "./queries/useTradeItemState";
import { useSdkv2 } from "./useSdkv2";

export const useSubscribeBlockEvents = () => {
  const [sdk, id] = useSdkv2();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (sdk && isRpcSdk(sdk)) {
      sdk.api.query.system.events((events) => {
        const accounts = new Set<string>();

        events.forEach((record) => {
          const { event } = record;
          const types = event.typeDef;

          event.data.forEach((data, index) => {
            if (
              event.section === "balances" &&
              types[index].type === "AccountId32"
            ) {
              accounts.add(data.toString());
            }
          });
        });

        accounts.forEach((account) => {
          queryClient.invalidateQueries([
            id,
            accountPoolAssetBalancesRootKey,
            account,
          ]);
          queryClient.invalidateQueries([
            id,
            accountAssetBalanceRootKey,
            account,
          ]);
          queryClient.invalidateQueries([id, balanceRootKey, account]);
          queryClient.invalidateQueries([
            id,
            tradeItemStateRootQueryKey,
            account,
          ]);
        });
      });
    }
  }, [sdk]);
};
