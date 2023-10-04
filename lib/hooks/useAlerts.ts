import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { useMemo } from "react";
import { useReadyToReportMarkets } from "./queries/useReadyToReportMarkets";
import { useAccountTokenPositions } from "./queries/useAccountTokenPositions";
import { IOMarketOutcomeAssetId, parseAssetId } from "@zeitgeistpm/sdk-next";
import { useRedeemableMarkets } from "./queries/useRedeemableMarkets";

export type Alert =
  | ReadyToReportMarketAlert
  | RelevantMarketDisputeAlert
  | RedeemableMarketsAlert;

export type ReadyToReportMarketAlert = {
  type: "ready-to-report-market";
  market: FullMarketFragment;
};

export type RelevantMarketDisputeAlert = {
  type: "relevant-market-dispute";
  market: FullMarketFragment;
};

export type RedeemableMarketsAlert = {
  type: "redeemable-markets";
  markets: FullMarketFragment[];
};

export const useAlerts = (account?: string) => {
  const { data: marketsReadyToReport } = useReadyToReportMarkets(account);
  const { data: redeemableMarkets } = useRedeemableMarkets(account);

  const alerts: Alert[] = useMemo(() => {
    const alerts: Alert[] = [];

    if (redeemableMarkets && redeemableMarkets.length > 0) {
      alerts.push({
        type: "redeemable-markets",
        markets: redeemableMarkets,
      });
    }

    if (marketsReadyToReport) {
      marketsReadyToReport.forEach((market) => {
        alerts.push({
          type: "ready-to-report-market",
          market,
        });
      });
    }

    return alerts;
  }, [marketsReadyToReport, redeemableMarkets]);

  return { alerts };
};
