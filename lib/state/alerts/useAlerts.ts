import { useAtom } from "jotai";
import { useMemo } from "react";
import { useReadyToReportMarkets } from "../../hooks/queries/useReadyToReportMarkets";
import { useRedeemableMarkets } from "../../hooks/queries/useRedeemableMarkets";
import { useCourtBacklog } from "../court/useCourtBacklog";
import { persistentAtom } from "../util/persistent-atom";
import { Alert, AlertId, withId } from "./types";

export type UseAlerts = {
  /**
   * All alerts for the current account.
   */
  alerts: Alert[];
  /**
   * Set an alert as read.
   *
   * @note
   *   This is only possible for alerts that are marked as dismissible = true.
   *   Alerts should only be marked as dismissible if they are not time sensitive and has not user action that will result in them being
   *   automatically dismissed. Example: "You have markets ready to report" is not dismissible since reporting will remove them.
   *   Whereas something like a reminder, news or add should be dismissible.
   *
   * @param alert - the alert to set as read.
   */
  setAsRead: (alert: Alert & { dismissible: true }) => void;
};

const readAlertsAtom = persistentAtom<{ read: AlertId[] }>({
  key: "read-alerts",
  defaultValue: { read: [] },
  migrations: [],
});

export const useAlerts = (account?: string): UseAlerts => {
  const { data: marketsReadyToReport } = useReadyToReportMarkets(account);
  const { data: redeemableMarkets } = useRedeemableMarkets(account);
  const courtBacklog = useCourtBacklog(account);

  const [readAlerts, setRead] = useAtom(readAlertsAtom);

  const alerts: Alert[] = useMemo(() => {
    const alerts: Alert[] = [];

    if (!account) return alerts;

    const add = (alert: Alert) => {
      if (!readAlerts.read.includes(alert.id)) {
        alerts.push(alert);
      }
    };

    if (redeemableMarkets && redeemableMarkets.length > 0) {
      add(
        withId({
          type: "redeemable-markets",
          account,
          markets: redeemableMarkets,
        }),
      );
    }

    if (marketsReadyToReport) {
      marketsReadyToReport.forEach((market) => {
        add(
          withId({
            type: "ready-to-report-market",
            account,
            market,
          }),
        );
      });
    }

    courtBacklog.forEach((backlogItem) => {
      if (
        backlogItem.type === "court-case-ready-for-vote" ||
        backlogItem.type === "court-case-ready-for-reveal"
      ) {
        add(
          withId({
            type: backlogItem.type,
            account,
            caseId: backlogItem.caseId,
          }),
        );
      }
    });

    return alerts;
  }, [
    readAlerts,
    courtBacklog,
    account,
    marketsReadyToReport,
    redeemableMarkets,
  ]);

  const setAsRead = (alert: Alert & { dismissible: true }) => {
    if (!alert.dismissible)
      return console.warn(
        "Attempted to set a non-dismissible alert as read. Should not be reachable in the type system.",
      );

    setRead((prev) => ({
      read: [...prev.read, alert.id],
    }));
  };

  return { alerts, setAsRead };
};
