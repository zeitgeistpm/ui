import { useQuery, UseQueryResult } from "@tanstack/react-query";
import {
  isIndexedSdk,
  isRpcSdk,
  createRpcContext,
  ZeitgeistIpfs,
} from "@zeitgeistpm/sdk-next";
import { getMarket } from "lib/gql/markets";
import { MarketPageIndexedData } from "lib/gql/markets";
import { useSdkv2 } from "../useSdkv2";
import { Report, MarketDispute } from "@zeitgeistpm/sdk/dist/types";
import { getApiAtBlock } from "lib/util/get-api-at";

export const marketsEventsRootQuery = "marketsEvents";

//is a market always reported first before any disputes can be made?
//if the oracle doesnt report the result then who is the reporter? (i.e. did the oracle fail to report?)
//who is the "Authority"? is that the "Authorized Address"? Does the Authority ultimatrely decide the outcome of the market?
//are all markets resolved? or can they simply end?

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

async function getSdk() {
  return createRpcContext({
    provider: "wss://zeitgeist.api.onfinality.io/public-ws",
    storage: ZeitgeistIpfs(),
  });
}

export const useMarketEventHistory = (
  marketId: string,
): UseQueryResult<MarketHistory> => {
  const [sdk2, id] = useSdkv2();

  return useQuery(
    [marketsEventsRootQuery, id, marketId],
    async () => {
      if (isIndexedSdk(sdk2) && isRpcSdk(sdk2)) {
        const sdk = await getSdk();
        let { api } = sdk;

        const market = await getMarket(sdk2.indexer.client, marketId);
        const disputes = market.disputes;
        const report = market.report;
        const start = {
          block: Number(market.period.block[1]),
          timestamp: Number(market.period.start),
        };
        const end = {
          block: Number(market.period.block[0]),
          timestamp: Number(market.period.end),
        };
        const oracleReported = report.by === market.oracle;

        const getTimeStampForBlock = async (blockNumber: number) => {
          const blockHash = await api.rpc.chain.getBlockHash(blockNumber);
          const timestamp = (
            await api.query.timestamp.now.at(blockHash)
          ).toNumber();
          return timestamp;
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
          resolved: market.resolvedOutcome,
          oracleReported: oracleReported,
        };
        await sdk.api.disconnect();
        return marketHistory;
      }
    },
    {
      enabled: Boolean(sdk2 && isIndexedSdk(sdk2) && isRpcSdk(sdk2)),
    },
  );
};
