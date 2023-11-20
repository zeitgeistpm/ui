import { useAtom } from "jotai";
import { useCourtCases } from "lib/hooks/queries/court/useCourtCases";
import { useAllVoteDraws } from "lib/hooks/queries/court/useVoteDraws";
import { useMemo } from "react";
import { useReadyToReportMarkets } from "../../hooks/queries/useReadyToReportMarkets";
import { useRedeemableMarkets } from "../../hooks/queries/useRedeemableMarkets";
import { useChainTime } from "../chaintime";
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
  const { data: courtDraws } = useAllVoteDraws();
  const { data: cases } = useCourtCases();

  const chainTime = useChainTime();

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

    if (courtDraws && cases && chainTime) {
      courtDraws.forEach(([caseIdStorageKey, draws]) => {
        const caseId = caseIdStorageKey.args[0].toNumber();
        const courtCase = cases?.find((c) => c.id === caseId);

        if (!courtCase) return;

        const drawsForAccount = draws.filter(
          (draw) => draw.courtParticipant.toString() === account,
        );

        const drawnAsJuror = drawsForAccount.filter(
          (draw) => draw.vote.isDrawn,
        );

        const drawReadyToReveal = drawsForAccount.filter(
          (draw) => draw.vote.isSecret,
        );

        const voteStart = courtCase.case.roundEnds.preVote.toNumber() + 1;
        const voteEnd = courtCase.case.roundEnds.vote.toNumber();

        const aggregationStart = voteEnd + 1;
        const aggregationEnd = courtCase.case.roundEnds.aggregation.toNumber();

        if (chainTime.block >= voteStart && chainTime.block <= voteEnd) {
          drawnAsJuror.forEach((draw) => {
            add(
              withId({
                type: "court-case-ready-for-vote",
                account,
                caseId,
              }),
            );
          });
        }

        if (
          chainTime.block >= aggregationStart &&
          chainTime.block <= aggregationEnd
        ) {
          drawReadyToReveal.forEach((draw) => {
            add(
              withId({
                type: "court-case-ready-for-reveal",
                account,
                caseId,
              }),
            );
          });
        }
      });
    }

    return alerts;
  }, [
    readAlerts,
    account,
    marketsReadyToReport,
    redeemableMarkets,
    courtDraws,
    cases,
    chainTime,
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
