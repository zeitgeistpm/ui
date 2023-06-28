import { useQuery } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { ChainName, CHAINS } from "lib/constants/chains";
import { FOREIGN_ASSET_METADATA } from "lib/constants/foreign-asset";
import { useCrossChainApis } from "lib/state/cross-chain";
import { useSdkv2 } from "../useSdkv2";
import { useChainConstants } from "./useChainConstants";
import { calculateFreeBalance } from "lib/util/calc-free-balance";

export const currencyBalanceRootKey = "currency-balances";

export type CurrencyBalance = {
  symbol: string;
  balance: Decimal;
  chain: ChainName;
  foreignAssetId?: number;
  sourceChain: ChainName;
  existentialDeposit: Decimal;
};

export const useCurrencyBalances = (address: string) => {
  const [sdk, id] = useSdkv2();
  const { apis } = useCrossChainApis();
  const { data: constants } = useChainConstants();

  const enabled = !!sdk && !!address && !!constants && isRpcSdk(sdk);
  const query = useQuery(
    [
      id,
      currencyBalanceRootKey,
      address,
      Object.values(apis ?? {}).length,
      constants,
    ],
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
          }),
        );

        const { data } = await sdk.api.query.system.account(address);
        const nativeBalance = calculateFreeBalance(
          data.free.toString(),
          data.miscFrozen.toString(),
          data.feeFrozen.toString(),
        );

        const apisArray = Object.values(apis ?? {});

        const chainBalances = await Promise.all(
          apisArray.map((api, index) =>
            CHAINS[index].fetchCurrencies(api, address),
          ),
        );

        const nativeBalanceDetails: CurrencyBalance = {
          balance: nativeBalance,
          chain: "Zeitgeist" as ChainName,
          sourceChain: "Zeitgeist" as ChainName,
          symbol: constants.tokenSymbol,
          existentialDeposit: new Decimal(
            sdk.api.consts.balances.existentialDeposit.toString(),
          ),
        };

        return [
          ...foreignAssetBalances,
          nativeBalanceDetails,
          ...chainBalances.flat(),
        ];
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
