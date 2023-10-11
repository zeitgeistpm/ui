import { useQuery } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { ChainName } from "lib/constants/chains";
import { FOREIGN_ASSET_METADATA } from "lib/constants/foreign-asset";
import { useSdkv2 } from "../useSdkv2";
import { CurrencyBalance } from "./useCurrencyBalances";

export const foreignAssetBalancesRootKey = "foreign-asset-balances";

export const useForeignAssetBalances = (address?: string) => {
  const [sdk, id] = useSdkv2();

  const enabled = !!sdk && !!address && isRpcSdk(sdk);
  const query = useQuery(
    [id, foreignAssetBalancesRootKey, address],
    async () => {
      if (enabled) {
        const assetIds = Object.keys(FOREIGN_ASSET_METADATA);

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
            sourceChain: FOREIGN_ASSET_METADATA[assetIds[index]]
              .originChain as ChainName,
            foreignAssetId: Number(assetIds[index]),
            existentialDeposit: new Decimal(
              sdk.api.consts.balances.existentialDeposit.toString(),
            ),
            decimals: Number(metadata[index].unwrap().decimals.toString()),
          }),
        );

        return foreignAssetBalances;
      }
      return null;
    },
    {
      keepPreviousData: true,
      enabled: enabled,
    },
  );

  return query;
};
