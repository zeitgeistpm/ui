import { useQuery } from "@tanstack/react-query";
import { ZTG, isIndexedSdk } from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { calculateSpotPrice } from "lib/util/amm2";
import { useSdkv2 } from "../../useSdkv2";
import { getMarketHeaders } from "lib/gql/market-header";
import { useAllForeignAssetUsdPrices } from "../useAssetUsdPrice";
import { lookUpAssetPrice } from "lib/util/lookup-price";
import { useZtgPrice } from "../useZtgPrice";

export const accountAmm2PoolsKey = "account-amm2-pools";

export const useAccountAmm2Pool = (address?: string) => {
  const [sdk, id] = useSdkv2();
  const { data: foreignAssetPrices, isLoading: assetPricesLoading } =
    useAllForeignAssetUsdPrices();
  const { data: ztgPrice, isLoading: ztgLoading } = useZtgPrice();

  const enabled =
    !!sdk &&
    !!isIndexedSdk(sdk) &&
    !!address &&
    !!ztgPrice &&
    !!foreignAssetPrices &&
    assetPricesLoading === false &&
    ztgLoading === false;
  const query = useQuery(
    [id, accountAmm2PoolsKey, address],
    async () => {
      if (!enabled) return;

      const { liquiditySharesManagers } =
        await sdk.indexer.liquiditySharesManagers({
          where: {
            account_eq: address,
          },
        });

      const markets = await getMarketHeaders(
        sdk,
        liquiditySharesManagers.map((manager) => manager.neoPool.marketId),
      );

      const neoPools = liquiditySharesManagers.map((l) => l.neoPool);

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
        const account = pool.liquiditySharesManager.find(
          (l) => l.account === address,
        );

        const baseAssetUsdPrice = lookUpAssetPrice(
          pool.collateral,
          foreignAssetPrices,
          ztgPrice,
        );

        const totalShares = pool.totalStake;
        const totalValue = valuations[index];

        const percentageOwnership = new Decimal(account?.stake ?? 0).div(
          pool.totalStake,
        );

        const addressValue = totalValue.mul(percentageOwnership).div(ZTG);

        const addressUsdValue = addressValue.mul(baseAssetUsdPrice);
        const addressZtgValue = addressUsdValue.div(ztgPrice);

        return {
          ...pool,
          totalValue,
          addressValue,
          addressUsdValue,
          addressZtgValue,
          question: market?.question,
          account,
          totalShares,
          baseAsset: pool.collateral,
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
