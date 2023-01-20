import { useQuery } from "@tanstack/react-query";
import {
  Context,
  isIndexedData,
  isRpcData,
  isRpcSdk,
  Pool,
} from "@zeitgeistpm/sdk-next";
import { KeyringPairOrExtSigner } from "@zeitgeistpm/sdk/dist/types";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "account-pool-asset-balances";

export const useAccountPoolAssetBalances = (
  address?: string,
  pool?: Pool<Context>,
) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, rootKey, address, pool?.poolId],
    async () => {
      if (isRpcSdk(sdk)) {
        const assets = isIndexedData(pool)
          ? pool.weights
              .filter((weight) => weight.assetId !== "Ztg")
              .map((weight) => JSON.parse(weight.assetId))
          : pool.assets;

        const balances = await sdk.context.api.query.tokens.accounts.multi(
          assets.map((assets) => [address, assets]),
        );

        return balances;
      }
    },
    {
      enabled: Boolean(sdk && isRpcSdk(sdk) && address && pool),
      initialData: [],
    },
  );

  return query;
};
