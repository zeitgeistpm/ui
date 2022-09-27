import MarketStore from "lib/stores/MarketStore";
import { observer } from "mobx-react";
import { useEffect, useState } from "react";
import { DAY_SECONDS } from "lib/constants";
import { convertBlockNumberToTimestamp } from "lib/util";
import { useStore } from "lib/stores/Store";
import ProgressReport from "components/ui/ProgressReport";
import { ProgressBarEvent } from "components/ui/ProgressReport/ProgressBar";
import { TimeLineStage } from "components/ui/ProgressReport/TimeLine";

type MarketStage =
  | "Trading"
  | "OracleReportWaiting"
  | "OracleReportCooldown"
  | "OpenReportWaiting"
  | "OpenReportCooldown"
  | "Disputed"
  | "AuthorizedReport"
  | "Resolved";

type MarketStageCopy = {
  [key in MarketStage]: {
    title: string;
    description: string;
    remainingTime: number;
    totalTime: number;
  };
};

const MarketEndSummary = ({ endTime }: { endTime: string }) => {
  return (
    <div className="bg-sky-100 dark:bg-black text-sky-600 rounded-ztg-10 p-ztg-15 text-ztg-12-150">
      <div className="whitespace-nowrap">Market ended: {endTime}</div>
    </div>
  );
};

const MarketEventSummary = ({
  time,
  outcome,
  address,
}: {
  time: string;
  outcome?: string;
  address: string;
}) => {
  return (
    <div className="bg-sky-100 dark:bg-black text-sky-600 rounded-ztg-10 p-ztg-15 text-ztg-12-150">
      <div>Time: {time}</div>
      {outcome ? (
        <div>
          Reported Outcome: <span className="uppercase">{outcome}</span>
        </div>
      ) : (
        <></>
      )}
      <div className="whitespace-nowrap">Reporter: {address}</div>
    </div>
  );
};

const MarketTimer = observer(
  ({ marketStore, hasAuthReport }: { marketStore: MarketStore; hasAuthReport: boolean }) => {
    const store = useStore();
    const [marketStage, setMarketStage] = useState<MarketStage>();
    const [marketStageIndex, setMarketStageIndex] = useState<number>();

    const reportingPeriodSec = store.config.markets.reportingPeriodSec;
    const disputePeriodSec = store.config.markets.disputePeriodSec;

    const getMarketStage = (marketStore: MarketStore): MarketStage => {
      if (marketStore.status === "Active") {
        return "Trading";
      } else if (marketStore.status === "Closed") {
        // if oracle doesn't report within 1 day reports are open to all
        if (marketStore.inOpenReportPeriod === true) {
          return "OpenReportWaiting";
        } else {
          return "OracleReportWaiting";
        }
      } else if (marketStore.status === "Reported") {
        if (marketStore.oracle === marketStore.reportedBy) {
          return "OracleReportCooldown";
        } else {
          return "OpenReportCooldown";
        }
      } else if (marketStore.status === "Disputed") {
        if (hasAuthReport) {
          return "AuthorizedReport"
        }
        return "Disputed";
      } else if (marketStore.status === "Resolved") {
        return "Resolved";
      }
    };

    const getMarketStageIndex = (marketStore: MarketStore): number => {
      if (marketStore.status === "Active") {
        return 0;
      } else if (marketStore.status === "Closed") {
        return 1;
      } else if (
        marketStore.status === "Reported" ||
        marketStore.status === "Disputed"
      ) {
        return 2;
      }
    };

    useEffect(() => {
      const stage = getMarketStage(marketStore);
      setMarketStage(stage);
      const stageIndex = getMarketStageIndex(marketStore);
      setMarketStageIndex(stageIndex);
    }, [
      marketStore,
      marketStore.status,
      getMarketStage,
      marketStore.reportedBy,
    ]);

    const getReportPercentage = () => {
      if (marketStore.status === "Closed") {
        return 1 - marketStore.oracleReportDuration / reportingPeriodSec;
      } else if (marketStore.hasReport) {
        return 1;
      } else {
        return 0;
      }
    };

    const getDisputeDetails = (marketStore: MarketStore) => {
      const disputes = marketStore.disputes;
      const lastDispute = disputes[disputes.length - 1];
      const blocksPerDay = DAY_SECONDS / store.config.blockTimeSec;
      const reportedAt = Number(marketStore.reportedAt);
      return { lastDispute, blocksPerDay, reportedAt };
    };

    const getDisputePercentage = () => {
      if (marketStore.status === "Active" || marketStore.status === "Closed") {
        return 0;
      } else if (marketStore.status === "Resolved") {
        return 1;
      } else if (
        marketStore.status === "Reported" ||
        marketStore.status === "Disputed"
      ) {
        const { lastDispute, blocksPerDay, reportedAt } =
          getDisputeDetails(marketStore);

        const currentBlock = store.blockNumber.toNumber();
        const relativeCurrentBlock = currentBlock - reportedAt;
        // period starts at market report
        // period ends 1 day after last dispute
        if (lastDispute) {
          const blockRange = lastDispute.at - reportedAt + blocksPerDay;
          return relativeCurrentBlock / blockRange;
        } else {
          return relativeCurrentBlock / blocksPerDay;
        }
      } else {
        return 0;
      }
    };

    const getDiputeEvents = (): ProgressBarEvent[] => {
      if (marketStore.reportedAt && marketStore.disputes?.length > 0) {
        const { lastDispute, blocksPerDay, reportedAt } =
          getDisputeDetails(marketStore);
        const blockRange = lastDispute.at - reportedAt + blocksPerDay;
        const events: ProgressBarEvent[] = marketStore.disputes.map(
          (dispute) => {
            const relativeBlock = dispute.at - reportedAt;
            const percentage = relativeBlock / blockRange;
            const time = new Intl.DateTimeFormat("default", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(
              new Date(
                convertBlockNumberToTimestamp(
                  dispute.at,
                  store.blockNumber.toNumber(),
                  store.config.blockTimeSec,
                ),
              ),
            );

            return {
              percentage: percentage,
              color: "#E90303",
              borderColor: "#7C0000",
              hoverComponent: (
                <MarketEventSummary time={time} address={dispute.by} />
              ),
            };
          },
        );
        return checkEventSpacing(events, 0.05);
      } else {
        return [];
      }
    };

    const checkEventSpacing = (
      events: ProgressBarEvent[],
      minPercentageGap: number,
    ) => {
      const spacedEvents: ProgressBarEvent[] = [];

      events.forEach((event, index) => {
        if (index !== 0) {
          const lastPercentage = spacedEvents[index - 1].percentage;

          if (event.percentage - lastPercentage < minPercentageGap) {
            spacedEvents.push({
              ...event,
              percentage: lastPercentage + minPercentageGap,
            });
          } else {
            spacedEvents.push(event);
          }
        } else {
          spacedEvents.push(event);
        }
      });

      return spacedEvents;
    };

    const marketStages: TimeLineStage[] = [
      {
        fillColor: "#70C703",
        percentage:
          1 -
          marketStore.activeDurtation /
            ((marketStore.endTimestamp - marketStore.createdAtTimestamp) /
              1000),
        className: "w-3/5",
        events:
          marketStore.status === "Active"
            ? []
            : [
                {
                  percentage: 1,
                  color: "#70C703",
                  borderColor: "#3D6D00",
                  hoverComponent: (
                    <MarketEndSummary endTime={marketStore.endDateFormatted} />
                  ),
                },
              ],
      },
      {
        fillColor: "#FAB400",
        percentage: getReportPercentage(),
        className: "w-1/5",
        events:
          marketStore.status === "Reported" ||
          marketStore.status === "Disputed" ||
          marketStore.status === "Resolved"
            ? [
                {
                  percentage: 1,
                  color: "#FAB400",
                  borderColor: "#B28100",
                  hoverComponent: (
                    <MarketEventSummary
                      time={new Intl.DateTimeFormat("default", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(
                        new Date(
                          convertBlockNumberToTimestamp(
                            Number(marketStore.reportedAt),
                            store.blockNumber.toNumber(),
                            store.config.blockTimeSec,
                          ),
                        ),
                      )}
                      address={marketStore.reportedBy}
                      outcome={marketStore.reportedOutcomeName}
                    />
                  ),
                },
              ]
            : [],
      },
      {
        fillColor: "#E90303",
        percentage: getDisputePercentage(),
        className: "w-1/5",
        events: getDiputeEvents(),
      },
    ];

    const marketStageCopy: MarketStageCopy = {
      Trading: {
        title: "Market is Live",
        description: "Market is open for trading",
        remainingTime: marketStore.activeDurtation,
        totalTime:
          (marketStore.endTimestamp - marketStore.createdAtTimestamp) / 1000,
      },
      OracleReportWaiting: {
        title: "Market ended",
        description: "Waiting for Oracle report",
        remainingTime: marketStore.oracleReportDuration,
        totalTime: reportingPeriodSec,
      },
      OracleReportCooldown: {
        title: "Oracle has reported",
        description: "Disputes are open to all",
        remainingTime: marketStore.reportCooldownDuration,
        totalTime: disputePeriodSec,
      },
      OpenReportWaiting: {
        title: "Oracle failed to report",
        description: "Reports open to all",
        remainingTime: null,
        totalTime: null,
      },
      OpenReportCooldown: {
        title: "Market reported",
        description: "Disputes are open to all",
        remainingTime: marketStore.reportCooldownDuration,
        totalTime: disputePeriodSec,
      },
      Disputed: {
        title: "Market outcome Disputed",
        description: "Waiting for authority to report",
        remainingTime: marketStore.disputeCooldownDuration,
        totalTime: disputePeriodSec,
      },
      AuthorizedReport: {
        title: "Market outcome reported",
        description: "",
        remainingTime: marketStore.disputeCooldownDuration,
        totalTime: disputePeriodSec,
      },
      Resolved: {
        title: "Market Resolved",
        description: "Consensus has been reached on the outcome",
        remainingTime: 0,
        totalTime: 0,
      },
    };

    return (
      <>
        {marketStage ? (
          <ProgressReport
            title={marketStageCopy[marketStage].title}
            description={marketStageCopy[marketStage].description}
            totalTime={marketStageCopy[marketStage].totalTime}
            remainingTime={marketStageCopy[marketStage].remainingTime}
            stages={marketStages}
            currentStageIndex={marketStageIndex}
          />
        ) : (
          <></>
        )}
      </>
    );
  },
);

export default MarketTimer;
