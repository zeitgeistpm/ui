import { useQuery } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk";
import Decimal from "decimal.js";
import { ChainName, CHAINS } from "lib/constants/chains";
import { useCrossChainApis } from "lib/state/cross-chain";
import { calculateFreeBalance } from "lib/util/calc-free-balance";
import { useSdkv2 } from "../useSdkv2";
import { useChainConstants } from "./useChainConstants";
import { useForeignAssetBalances } from "./useForeignAssetBalances";
import Opaque from "ts-opaque";

export type CurrencyBalance = {
  symbol: string;
  balance: Decimal;
  chain: ChainName;
  foreignAssetId?: number;
  sourceAssetId?: number;
  sourceChain: ChainName;
  existentialDeposit: Decimal;
  decimals: number;
};

export type CurrencyBalanceId = Opaque<"CurrencyBalance.Id", string>;

export const currencyBalanceId = (
  balance: CurrencyBalance,
): CurrencyBalanceId =>
  `${balance.sourceChain}-${balance.symbol}-${balance.chain}` as CurrencyBalanceId;

export const eqCurrencyBalanceId = (
  id: CurrencyBalanceId,
  balance: CurrencyBalance,
) => currencyBalanceId(balance) === id;

export const currencyBalanceRootKey = "currency-balances";

export const useCurrencyBalances = (address: string) => {
  const [sdk, id] = useSdkv2();
  const { apis } = useCrossChainApis();
  const { data: constants } = useChainConstants();
  const { data: foreignAssetBalances } = useForeignAssetBalances(address);

  const enabled =
    !!sdk &&
    !!address &&
    !!constants &&
    isRpcSdk(sdk) &&
    !!foreignAssetBalances;
  const query = useQuery(
    [
      id,
      currencyBalanceRootKey,
      address,
      Object.values(apis ?? {}).length,
      constants,
      foreignAssetBalances,
    ],
    async () => {
      if (enabled) {
        const { data } = await sdk.api.query.system.account(address);

        const nativeBalance = calculateFreeBalance(
          data?.free?.toString(),
          data?.frozen?.toString(),
          data?.reserved?.toString(),
        );

        const apisArray = Object.values(apis ?? {});

        const chainBalancesRes = await Promise.allSettled(
          apisArray.map((api, index) =>
            CHAINS[index].fetchCurrencies(api, address),
          ),
        );
        const chainBalances = chainBalancesRes
          .map((res) => res.status === "fulfilled" && res.value)
          .filter((res) => !!res)
          .flat() as CurrencyBalance[];

        const nativeBalanceDetails: CurrencyBalance = {
          balance: nativeBalance,
          chain: "Zeitgeist" as ChainName,
          sourceChain: "Zeitgeist" as ChainName,
          symbol: constants.tokenSymbol,
          existentialDeposit: new Decimal(
            sdk.api.consts.balances.existentialDeposit.toString(),
          ),
          decimals: 10,
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
