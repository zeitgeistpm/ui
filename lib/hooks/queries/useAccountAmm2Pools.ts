import { useQuery } from "@tanstack/react-query";
import { isIndexedSdk } from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { calculateSpotPrice } from "lib/util/amm2";
import { useSdkv2 } from "../useSdkv2";
import { getMarketHeaders } from "lib/gql/market-header";

export const accountAmm2PoolsKey = "account-amm2-pools";

export const useAccountAmm2Pool = (address?: string) => {
  const [sdk, id] = useSdkv2();

  const enabled = !!sdk && !!isIndexedSdk(sdk) && !!address;
  const query = useQuery(
    [id, accountAmm2PoolsKey, address],
    async () => {
      if (!enabled) return;

      const { neoPools } = await sdk.indexer.neoPools({
        where: {
          liquiditySharesManager: {
            owner_eq: address,
          },
        },
      });

      const markets = await getMarketHeaders(
        sdk,
        neoPools.map((pool) => pool.marketId),
      );

      const valuations = neoPools.map((pool) => {
        const values = pool.account.balances.map((balance) => {
          const price = calculateSpotPrice(
            new Decimal(balance.balance),
            new Decimal(pool.liquidityParameter),
          );

          return price.mul(balance.balance);
        });

        return values.reduce(
          (total, value) => total.plus(value),
          new Decimal(0),
        );
      });

      return neoPools.map((pool, index) => {
        const market = markets.find((m) => m.marketId === pool.marketId);
        return {
          ...pool,
          value: valuations[index],
          question: market?.question,
        };
      });
    },
    {
      keepPreviousData: true,
      enabled: enabled,
    },
  );

  return query;
};
