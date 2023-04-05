import { useQuery } from "@tanstack/react-query";
import { isRpcSdk } from "@zeitgeistpm/sdk-next";
import { useSdkv2 } from "../useSdkv2";

export const authorizedReportRootKey = "rpc-market";

export const useAuthorizedReport = (marketId: number) => {
  const [sdk, id] = useSdkv2();

  const query = useQuery(
    [id, authorizedReportRootKey, marketId],
    async () => {
      if (isRpcSdk(sdk)) {
        const report = await sdk.api.query.authorized.authorizedOutcomeReports(
          marketId,
        );

        return report;
      }
    },
    {
      enabled: Boolean(sdk && isRpcSdk(sdk) && marketId != null),
    },
  );

  return query;
};
