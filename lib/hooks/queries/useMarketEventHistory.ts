import { useQuery, UseQueryResult } from "@tanstack/react-query";
import {
  isIndexedSdk,
  isRpcSdk,
  createRpcContext,
  ZeitgeistIpfs,
} from "@zeitgeistpm/sdk-next";
import { getMarket, MarketPageIndexedData } from "lib/gql/markets";
import { useSdkv2 } from "../useSdkv2";
import { Report, MarketDispute } from "@zeitgeistpm/sdk/dist/types";

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

async function getSdk() {
  return createRpcContext({
    provider: "wss://zeitgeist.api.onfinality.io/public-ws",
    storage: ZeitgeistIpfs(),
  });
}

const fetchMarketData = async (
  sdk2,
  marketId,
): Promise<MarketPageIndexedData> => {
  if (isIndexedSdk(sdk2) && isRpcSdk(sdk2)) {
    return await getMarket(sdk2.indexer.client, marketId);
  }
  return null;
};

export const useMarketEventHistory = (
  marketId: string,
): UseQueryResult<MarketHistory> => {
  const [sdk2, id] = useSdkv2();

  const { data: market } = useQuery<MarketPageIndexedData>(
    ["market", marketId],
    () => fetchMarketData(sdk2, marketId),
    {
      enabled: Boolean(sdk2 && isIndexedSdk(sdk2) && isRpcSdk(sdk2)),
    },
  );
  console.log(market);
  return useQuery(
    [marketsEventsRootQuery, id, marketId],
    async () => {
      if (isIndexedSdk(sdk2) && isRpcSdk(sdk2) && market) {
        const sdk = await getSdk();
        let { api } = sdk;

        const disputes = market["disputes"];
        const report = market["report"];
        const start = {
          block: Number(market["period"].block[1]),
          timestamp: Number(market["period"].start),
        };
        const end = {
          block: Number(market["period"].block[0]),
          timestamp: Number(market["period"].end),
        };
        const resolved = market["resolvedOutcome"];
        const oracleReported = report.by === market["oracle"];

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
          resolved,
          oracleReported: oracleReported,
        };
        await sdk.api.disconnect();
        return marketHistory;
      }
    },
    {
      enabled: Boolean(sdk2 && isIndexedSdk(sdk2) && isRpcSdk(sdk2) && market),
    },
  );
};
