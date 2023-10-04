import { FullMarketFragment } from "@zeitgeistpm/indexer";

export type Alert = IAlert & AlertData;

export type IAlert = {
  id: AlertId;
};

declare const tag: unique symbol;
export type AlertId = string & { readonly [tag]: "AlertId" };

export type AlertData = { account: string } & (
  | ReadyToReportMarketAlertData
  | RelevantMarketDisputeAlertData
  | RedeemableMarketsAlertData
);

export type ReadyToReportMarketAlertData = {
  type: "ready-to-report-market";
  market: FullMarketFragment;
};

export type RelevantMarketDisputeAlertData = {
  type: "market-dispute";
  market: FullMarketFragment;
};

export type RedeemableMarketsAlertData = {
  type: "redeemable-markets";
  markets: FullMarketFragment[];
};

export const withId = (alert: AlertData): Alert => {
  switch (alert.type) {
    case "ready-to-report-market":
      return {
        id: `${alert.account}-${alert.type}-${alert.market.marketId}` as AlertId,
        ...alert,
      };
    case "market-dispute":
      return {
        id: `${alert.account}-${alert.type}-${alert.market.marketId}` as AlertId,
        ...alert,
      };
    case "redeemable-markets":
      return {
        id: `${alert.account}-${alert.type}` as AlertId,
        ...alert,
      };
  }
};
