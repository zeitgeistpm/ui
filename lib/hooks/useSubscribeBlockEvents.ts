import { useQueryClient } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk";
import { useEffect } from "react";
import { accountAssetBalanceRootKey } from "./queries/useAccountAssetBalances";
import { accountPoolAssetBalancesRootKey } from "./queries/useAccountPoolAssetBalances";
import { balanceRootKey } from "./queries/useBalance";
import { currencyBalanceRootKey } from "./queries/useCurrencyBalances";
import { tradeItemStateRootQueryKey } from "./queries/useTradeItemState";
import { useSdkv2 } from "./useSdkv2";
import { amm2PoolKey } from "./queries/amm2/useAmm2Pool";

export const useSubscribeBlockEvents = () => {
  const [sdk, id] = useSdkv2();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (sdk && isRpcSdk(sdk)) {
      sdk.api.query.system.events((events) => {
        const accounts = new Set<string>();
        const amm2MarketIds = new Set<string>();

        events.forEach((record) => {
          const { event } = record;
          const types = event.typeDef;

          event.data.forEach((data, index) => {
            if (
              (event.section === "balances" || event.section === "tokens") &&
              types[index].type === "AccountId32"
            ) {
              accounts.add(data.toString());
            } else if (event.section === "neoSwaps") {
              if (event.data.names?.includes("marketId")) {
                amm2MarketIds.add(event.data["marketId"].toString());
              }
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
          queryClient.invalidateQueries([id, currencyBalanceRootKey, account]);
        });

        amm2MarketIds.forEach((marketId) => {
          queryClient.invalidateQueries([id, amm2PoolKey, Number(marketId)]);
        });
      });
    }
  }, [sdk]);
};
