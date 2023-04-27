import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { isIndexedSdk } from "@zeitgeistpm/sdk-next";
import { getMarket } from "lib/gql/markets";
import { MarketPageIndexedData } from "lib/gql/markets";
import { useSdkv2 } from "../useSdkv2";
import { useTimeStampForBlock } from "./useTimeStampForBlock";

export const marketsEventsRootQuery = "marketsEvents";

export const useMarketEventHistory = (
  marketId: string,
): UseQueryResult<MarketPageIndexedData> => {
  const [sdk, id] = useSdkv2();

  return useQuery(
    [marketsEventsRootQuery, id, marketId],
    async () => {
      if (!isIndexedSdk(sdk)) return [];

      const market = await getMarket(sdk.indexer.client, marketId);

      const disputes = market.disputes;
      const report = market.report;

      const oracleReported = report.by === market.oracle;
      console.log(oracleReported);
      // const { data: timeStamp } = useTimeStampForBlock(1838978);

      // console.log(new Date(timeStamp));

      return market;
    },
    {
      enabled: sdk != null && isIndexedSdk(sdk),
      keepPreviousData: true,
    },
  );
};
