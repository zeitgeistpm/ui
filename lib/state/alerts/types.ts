import { FullMarketFragment } from "@zeitgeistpm/indexer";
import Opaque, { create } from "ts-opaque";

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
export type AlertId = Opaque<string, Alert>;

/**
 * Union type of all possible alert types.
 */
export type AlertData = { account: string; dismissible?: true } & (
  | ReadyToReportMarketAlertData
  | RelevantMarketDisputeAlertData
  | RedeemableMarketsAlertData
  | CourtCaseReadyForVote
  | CourtCaseReadyForReveal
  | CourtCaseReadyToSettle
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

export type CourtCaseReadyForVote = {
  type: "court-case-ready-for-vote";
  caseId: number;
};

export type CourtCaseReadyForReveal = {
  type: "court-case-ready-for-reveal";
  caseId: number;
};

export type CourtCaseReadyToSettle = {
  type: "court-case-ready-to-settle";
  caseId: number;
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
        id: create(`${alert.account}-${alert.type}-${alert.market.marketId}`),
        ...alert,
      };
    case "market-dispute":
      return {
        id: create(`${alert.account}-${alert.type}-${alert.market.marketId}`),
        ...alert,
      };
    case "redeemable-markets":
      return {
        id: create(`${alert.account}-${alert.type}`),
        ...alert,
      };
    case "court-case-ready-for-vote":
      return {
        id: create(`${alert.account}-${alert.type}-${alert.caseId}`),
        ...alert,
      };
    case "court-case-ready-for-reveal":
      return {
        id: create(`${alert.account}-${alert.type}-${alert.caseId}`),
        ...alert,
      };
    case "court-case-ready-to-settle":
      return {
        id: create(`${alert.account}-${alert.type}-${alert.caseId}`),
        ...alert,
      };
  }
};
