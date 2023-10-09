import { useQuery } from "@tanstack/react-query";
import { MarketStatus } from "@zeitgeistpm/indexer";
import { isFullSdk } from "@zeitgeistpm/sdk";
import { isNotNull } from "@zeitgeistpm/utility/dist/null";
import { useSdkv2 } from "../useSdkv2";
import { useChainTime } from "lib/state/chaintime";

export const useReadyToReportMarkets = (account?: string) => {
  const [sdk, id] = useSdkv2();
  const chainTime = useChainTime();

  const enabled = sdk && isFullSdk(sdk) && account && chainTime;

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
              const stage = await sdk.model.markets.getStage(market, chainTime);
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
      refetchInterval: 1000 * 60,
    },
  );
};
