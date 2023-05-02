import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { isIndexedSdk, isRpcSdk } from "@zeitgeistpm/sdk-next";
import { getMarket } from "lib/gql/markets";
import { MarketPageIndexedData } from "lib/gql/markets";
import { useSdkv2 } from "../useSdkv2";
import { useAuthorizedReport } from "./useAuthorizedReport";
import { useTimeStampForBlock } from "./useTimeStampForBlock";
import { getApiAtBlock } from "lib/util/get-api-at";

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
      if (isIndexedSdk(sdk) && isRpcSdk(sdk)) {
        const market = await getMarket(sdk.indexer.client, marketId);
        const disputes = market.disputes;
        const report = market.report;
        const oracleReported = report.by === market.oracle;

        const getTimeStampForBlock = async (blockNumber: number) => {
          const api = await getApiAtBlock(sdk.api, blockNumber);
          const timestamp = await api.query.timestamp
            .now()
            .then((now) => now.toNumber());
          return timestamp;
        };

        let disputesWithTimestamp;
        let reportWithTimestamp;

        if (disputes) {
          const updateDisputesWithTimestamp = async (disputes) => {
            const promises = disputes.map(async (dispute) => {
              const timestamp = await getTimeStampForBlock(dispute.at);
              dispute.at = timestamp;
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
              ["at"]: timestamp,
            };
          };
          await updateReportWithTimestamp(report);
        }

        const marketHistory = {
          reported: reportWithTimestamp,
          disputes: disputesWithTimestamp,
          resolved: market.resolvedOutcome,
          oracleReported: oracleReported,
        };

        return marketHistory;
      }
    },
    {
      enabled: Boolean(sdk && isIndexedSdk(sdk) && isRpcSdk(sdk)),
    },
  );
};
