import { useQuery } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk-next";
import { isNotNull } from "@zeitgeistpm/utility/dist/null";
import { useSdkv2 } from "../useSdkv2";

export const rootKey = "account-token-positions";

export const useAccountTokenPositions = (account?: string) => {
  const [sdk, id] = useSdkv2();

  return useQuery(
    [id, rootKey, account],
    async () => {
      if (sdk && isRpcSdk(sdk) && account) {
        const entries = await sdk.context.api.query.tokens.accounts.entries(
          account,
        );

        return entries
          .map(([key, balance]) => {
            const [, asset] = key.args;
            if (
              (!asset.isScalarOutcome && !asset.isCategoricalOutcome) ||
              balance.free.isZero()
            ) {
              return null;
            }
            return { asset, balance };
          })
          .filter(isNotNull);
      }
      return null;
    },
    {
      enabled: Boolean(sdk && isRpcSdk(sdk) && account),
      refetchInterval: 12 * 1000,
    },
  );
};
