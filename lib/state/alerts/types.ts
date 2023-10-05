import { FullMarketFragment } from "@zeitgeistpm/indexer";

/**
 * Top level alert type.
 */
export type Alert = IAlert & AlertData;

export type IAlert = {
  /**
   * Unique identifier for the alert.
   * @note generated client side by `withId` function.
   */
  id: AlertId;
};

/**
 * Opaque type to ensure that the `id` field is a AlertId and only ever set by the `withId` function.
 */
declare const tag: unique symbol;
export type AlertId = string & { readonly [tag]: "AlertId" };

/**
 * Union type of all possible alert types.
 */
export type AlertData = { account: string; dismissible?: true } & (
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

/**
 * Attach an id to an alert.
 *
 * @param alert AlertData
 * @returns Alert
 */
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
