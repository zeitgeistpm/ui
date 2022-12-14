import { useQuery } from "@tanstack/react-query";
import {
  CategoricalAssetId,
  fromPrimitive,
  isRpcSdk,
  ScalarAssetId,
} from "@zeitgeistpm/sdk-next";
import {
  OrmlTokensAccountData,
  ZeitgeistPrimitivesAsset,
} from "@polkadot/types/lookup";
import { isNotNull } from "@zeitgeistpm/utility/dist/null";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "account-token-positions";

export type AccountTokenPosition = {
  asset: CategoricalAssetId | ScalarAssetId;
  balance: OrmlTokensAccountData;
};

export const useAccountTokenPositions = (account?: string) => {
  const [sdk, id] = useSdkv2();

  return useQuery<AccountTokenPosition[]>(
    [id, rootKey, account],
    async () => {
      if (sdk && isRpcSdk(sdk) && account) {
        const entries = await sdk.context.api.query.tokens.accounts.entries(
          account,
        );

        return entries
          .map(([key, balance]) => {
            const [, asset] = key.args;
            if (!asset.isScalarOutcome && !asset.isCategoricalOutcome) {
              return null;
            }
            return {
              asset: fromPrimitive(asset) as CategoricalAssetId | ScalarAssetId,
              balance,
            };
          })
          .filter(isNotNull);
      }
    },
    {
      enabled: Boolean(sdk && isRpcSdk(sdk) && account),
      refetchInterval: 12 * 1000,
    },
  );
};
