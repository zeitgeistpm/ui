import { AssetId, isRpcSdk } from "@zeitgeistpm/sdk";
import { useQuery } from "@tanstack/react-query";

import { useSdkv2 } from "../useSdkv2";
import Decimal from "decimal.js";

export const totalIssuanceRootQueryKey = "total-issuance";

export const useTotalIssuance = (assetId: AssetId) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, totalIssuanceRootQueryKey, assetId],
    async () => {
      if (isRpcSdk(sdk)) {
        const totalIssuance = await sdk.api.query.tokens.totalIssuance(assetId);
        return new Decimal(totalIssuance.toString());
      }
    },
    {
      enabled: Boolean(sdk && isRpcSdk(sdk)),
    },
  );

  return query;
};
