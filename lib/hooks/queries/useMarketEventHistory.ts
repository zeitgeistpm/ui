import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { isIndexedSdk, isRpcSdk } from "@zeitgeistpm/sdk-next";
import { getMarket, MarketPageIndexedData } from "lib/gql/markets";
import { useSdkv2 } from "../useSdkv2";
import { Report, MarketDispute } from "@zeitgeistpm/sdk/dist/types";
import { getApiAtBlock } from "lib/util/get-api-at";
import { useMarket } from "./useMarket";

export const marketsEventsRootQuery = "marketsEvents";
interface ReportWithTimestamp extends Report {
  timestamp: number;
}

interface DisputesWithTimestamp extends MarketDispute {
  timestamp: number;
}

export type MarketHistory = {
  start: {
    block: number;
    timestamp: number;
  };
  end: {
    block: number;
    timestamp: number;
  };
  reported: ReportWithTimestamp;
  disputes: DisputesWithTimestamp[];
  resolved: string;
  oracleReported: boolean;
};

// const fetchMarketData = async (
//   sdk,
//   marketId,
// ): Promise<MarketPageIndexedData> => {
//   if (isIndexedSdk(sdk) && isRpcSdk(sdk)) {
//     return await getMarket(sdk.indexer.client, marketId);
//   }
//   return null;
// };

export const useMarketEventHistory = (
  marketId: string,
): UseQueryResult<MarketHistory> => {
  const [sdk, id] = useSdkv2();

  const { data: market } = useMarket({ marketId: Number(marketId) });

  return useQuery(
    [marketsEventsRootQuery, id, marketId],
    async () => {
      if (isRpcSdk(sdk) && market) {
        const disputes = market["disputes"];
        const report = market["report"];
        const start = {
          block:
            market["period"]?.block !== null
              ? Number(market["period"]?.block[0])
              : 0,
          timestamp: Number(market["period"]?.start),
        };
        const end = {
          block:
            market["period"]?.block !== null
              ? Number(market["period"]?.block[1])
              : 0,
          timestamp: Number(market["period"]?.end),
        };
        const resolved = market["resolvedOutcome"];
        const oracleReported = report.by === market["oracle"];

        const getTimeStampForBlock = async (blockNumber: number) => {
          try {
            const blockHash = await getApiAtBlock(sdk.api, blockNumber);
            return await blockHash.query.timestamp
              .now()
              .then((now) => now.toNumber());
          } catch (error) {
            return 0;
          }
        };

        let disputesWithTimestamp;
        let reportWithTimestamp;

        if (disputes) {
          const updateDisputesWithTimestamp = async (disputes) => {
            const promises = disputes.map(async (dispute) => {
              const timestamp = await getTimeStampForBlock(dispute.at);
              dispute.timestamp = timestamp;
              return dispute;
            });

            const updatedDisputes = await Promise.all(promises);

            return updatedDisputes;
          };
          disputesWithTimestamp = await updateDisputesWithTimestamp(disputes);
        }
        if (report) {
          const updateReportWithTimestamp = async (report) => {
            const timestamp = await getTimeStampForBlock(report.at);
            reportWithTimestamp = {
              ...report,
              ["timestamp"]: timestamp,
            };
          };
          await updateReportWithTimestamp(report);
        }

        const marketHistory = {
          start,
          end,
          reported: reportWithTimestamp,
          disputes: disputesWithTimestamp,
          resolved,
          oracleReported: oracleReported,
        };
        return marketHistory;
      }
    },
    {
      enabled: Boolean(sdk && isRpcSdk(sdk) && market),
    },
  );
};
