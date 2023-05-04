import { useQuery } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { CHAINS } from "lib/constants/chains";
import { FORIEGN_ASSET_METADATA } from "lib/constants/foreign-asset";
import { useCrossChainApis } from "lib/state/cross-chain";
import { useSdkv2 } from "../useSdkv2";
import { useChainConstants } from "./useChainConstants";

export const balanceRootKey = "currency-balances";

export type CurrencyBalance = {
  symbol: string;
  balance: Decimal;
  chain: string;
};

export const useCurrencyBalances = (address: string) => {
  const [sdk, id] = useSdkv2();
  const { apis } = useCrossChainApis();
  const { data: constants } = useChainConstants();

  const query = useQuery(
    [id, balanceRootKey, address, apis.length],
    async () => {
      if (isRpcSdk(sdk)) {
        const assetIds = Object.keys(FORIEGN_ASSET_METADATA);

        const metadata = await sdk.api.query.assetRegistry.metadata.multi(
          assetIds.map((assetId) => ({ ForeignAsset: assetId })),
        );

        const foreignAccounts = await sdk.api.query.tokens.accounts.multi(
          assetIds.map((assetId) => [address, { ForeignAsset: assetId }]),
        );

        const foreignAssetBalances: CurrencyBalance[] = foreignAccounts.map(
          (account, index) => ({
            symbol: metadata[index].unwrap().symbol.toPrimitive() as string,
            balance: new Decimal(account.free.toString()),
            chain: "Zeitgeist",
          }),
        );

        const account = await sdk.api.query.system.account(address);
        const nativeBalance = new Decimal(account.data.free.toString());

        const chainBalances = await Promise.all(
          apis.map((api, index) => CHAINS[index].fetchBalances(api, address)),
        );

        return [
          ...foreignAssetBalances,
          {
            balance: nativeBalance,
            chain: "Zeitgeist",
            symbol: constants.tokenSymbol,
          },
          ...chainBalances.flat(),
        ];
      }
      return null;
    },
    {
      keepPreviousData: true,
      enabled: Boolean(sdk && address && isRpcSdk(sdk)),
    },
  );

  return query;
};
