import { useQuery } from "@tanstack/react-query";
import { MarketStatus } from "@zeitgeistpm/indexer";
import { isFullSdk } from "@zeitgeistpm/sdk-next";
import { isNotNull } from "@zeitgeistpm/utility/dist/null";
import { useSdkv2 } from "../useSdkv2";

export const useReadyToReportMarkets = (account?: string) => {
  const [sdk, id] = useSdkv2();

  const enabled = sdk && isFullSdk(sdk) && account;

  return useQuery(
    [id, "ready-to-report-markets", account],
    async () => {
      if (enabled) {
        const closedMarketsForAccount = await sdk.indexer.markets({
          where: {
            oracle_eq: account,
            status_eq: MarketStatus.Closed,
          },
        });

        let readyToReportMarkets = (
          await Promise.all(
            closedMarketsForAccount.markets.map(async (market) => {
              const stage = await sdk.model.markets.getStage(market);
              if (
                stage.type === "OracleReportingPeriod" ||
                stage.type === "OpenReportingPeriod"
              ) {
                return market;
              }
              return null;
            }),
          )
        ).filter(isNotNull);

        return readyToReportMarkets;
      }
    },
    {
      enabled: Boolean(enabled),
    },
  );
};