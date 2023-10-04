import { useAtom } from "jotai";
import { useMemo } from "react";
import { useReadyToReportMarkets } from "../../hooks/queries/useReadyToReportMarkets";
import { useRedeemableMarkets } from "../../hooks/queries/useRedeemableMarkets";
import { persistentAtom } from "../util/persistent-atom";
import { Alert, AlertId, withId } from "./types";

export type UseAlerts = {
  alerts: Alert[];
  setAsRead: (id: AlertId | Alert) => void;
};

const readAlertsAtom = persistentAtom<{ read: AlertId[] }>({
  key: "read-alerts",
  defaultValue: { read: [] },
  migrations: [],
});

export const useAlerts = (account?: string): UseAlerts => {
  const { data: marketsReadyToReport } = useReadyToReportMarkets(account);
  const { data: redeemableMarkets } = useRedeemableMarkets(account);

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
          markets: redeemableMarkets,
          account,
        }),
      );
    }

    if (marketsReadyToReport) {
      marketsReadyToReport.forEach((market) => {
        add(
          withId({
            type: "ready-to-report-market",
            market,
            account,
          }),
        );
      });
    }

    return alerts;
  }, [readAlerts, account, marketsReadyToReport, redeemableMarkets]);

  const setAsRead = (id: AlertId | Alert) => {
    setRead((prev) => ({
      read: [...prev.read, typeof id === "string" ? id : id.id],
    }));
  };

  return { alerts, setAsRead };
};
