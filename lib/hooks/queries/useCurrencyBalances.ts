import { useQuery } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk-next";
import Decimal from "decimal.js";
import { CHAINS } from "lib/constants/chains";
import { useCrossChainApis } from "lib/state/cross-chain";
import { useSdkv2 } from "../useSdkv2";

export const balanceRootKey = "currency-balances";

export const useCurrencyBalances = (address: string) => {
  const [sdk, id] = useSdkv2();
  const { apis } = useCrossChainApis();

  const query = useQuery(
    [id, balanceRootKey, address, apis.length],
    async () => {
      if (isRpcSdk(sdk)) {
        const metadata = await sdk.api.query.assetRegistry.metadata.multi([
          { ForeignAsset: 0 },
          { ForeignAsset: 1 },
        ]);
        const foreignBalances = await sdk.api.query.tokens.accounts.multi([
          //todo: use config
          [address, { ForeignAsset: 0 }],
          [address, { ForeignAsset: 1 }],
        ]);

        const account = await sdk.api.query.system.account(address);
        const ztgBalance = new Decimal(account.data.free.toString());

        const chainBalances = await Promise.all(
          apis.map((api, index) => CHAINS[index].fetchBalances(api, address)),
        );

        console.log(chainBalances);
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
