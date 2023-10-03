import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { useMemo } from "react";
import { useReadyToReportMarkets } from "./queries/useReadyToReportMarkets";

export type Alert = ReadyToReportMarketAlert | RelevantMarketDispute;

export type ReadyToReportMarketAlert = {
  type: "ready-to-report-market";
  market: FullMarketFragment;
};

export type RelevantMarketDispute = {
  type: "relevant-market-dispute";
  market: FullMarketFragment;
};

export const useAlerts = (account?: string) => {
  const { data: marketsReadyToReport } = useReadyToReportMarkets(account);

  const alerts: Alert[] = useMemo(() => {
    const alerts: Alert[] = [];

    if (marketsReadyToReport) {
      marketsReadyToReport.forEach((market) => {
        alerts.push({
          type: "ready-to-report-market",
          market,
        });
      });
    }

    return alerts;
  }, [marketsReadyToReport]);

  return { alerts };
};
