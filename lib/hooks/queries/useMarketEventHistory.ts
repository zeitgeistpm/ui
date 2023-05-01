import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { isIndexedSdk } from "@zeitgeistpm/sdk-next";
import { getMarket } from "lib/gql/markets";
import { MarketPageIndexedData } from "lib/gql/markets";
import { useSdkv2 } from "../useSdkv2";
import { useAuthorizedReport } from "./useAuthorizedReport";
import { useTimeStampForBlock } from "./useTimeStampForBlock";

export const marketsEventsRootQuery = "marketsEvents";

//is a market always reported first before any disputes can be made?
//if the oracle doesnt report the result then who is the reporter? (i.e. did the oracle fail to report?)
//who is the "Authority"? is that the "Authorized Address"? Does the Authority ultimatrely decide the outcome of the market?
//are all markets resolved? or can they simply end?

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

      //if oracle report is true, then oracle reported otherwise market reporter reported
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
