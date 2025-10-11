import { Dialog } from "@headlessui/react";
import { OutcomeReport, ScalarRangeType } from "@zeitgeistpm/sdk";
import { MarketEventHistory } from "lib/hooks/queries/useMarketEventHistory";
import { formatScalarOutcome } from "lib/util/format-scalar-outcome";
import Link from "next/link";
import { FC } from "react";
import {
  MdOutlineCheckCircle,
  MdOutlineGavel,
  MdOutlinePlayArrow,
  MdOutlineStop,
  MdClose,
} from "react-icons/md";
import { UserIdentity } from "./MarketHeaderUtils";

interface MarketHistoryModalProps {
  setShowMarketHistory: (show: boolean) => void;
  marketHistory: MarketEventHistory;
  oracleReported: boolean;
  categories: { name: string; color: string }[];
  marketType: {
    scalar: string[];
    categorical: string;
  };
  scalarType: ScalarRangeType;
}

export const MarketHistoryModal: FC<MarketHistoryModalProps> = ({
  marketHistory,
  oracleReported,
  categories,
  marketType,
  setShowMarketHistory,
  scalarType,
}) => {
  const marketStart = new Intl.DateTimeFormat("default", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(marketHistory?.start?.timestamp);

  const marketClosed = new Intl.DateTimeFormat("default", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(marketHistory?.end?.timestamp);

  const getOutcome = (outcome: OutcomeReport) => {
    if (marketType.scalar === null) {
      return categories[outcome.categorical!]?.name;
    } else {
      return formatScalarOutcome(outcome["scalar"], scalarType);
    }
  };

  return (
    <Dialog.Panel>
      <div className="relative max-h-[90vh] w-full overflow-hidden rounded-xl border border-sky-200/30 bg-white/95 shadow-2xl backdrop-blur-lg sm:min-w-[580px] sm:max-w-[580px]">
        {/* Header with gradient accent */}
        <div className="relative border-b border-sky-200/30 bg-gradient-to-r from-sky-50/80 to-blue-50/80 px-6 py-4 backdrop-blur-sm">
          <h3 className="text-center text-lg font-bold text-sky-900">
            Market History
          </h3>
          <button
            onClick={() => setShowMarketHistory(false)}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border border-sky-200/30 bg-white/60 text-sky-700 backdrop-blur-sm transition-all hover:bg-sky-100/80 hover:text-sky-900"
            aria-label="Close"
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* Timeline content */}
        <div
          className="overflow-y-auto px-6 py-6"
          style={{ maxHeight: "70vh" }}
        >
          <div className="relative space-y-6 pl-8">
            {/* Vertical timeline line */}
            <div className="absolute bottom-2 left-[11px] top-2 w-0.5 bg-gradient-to-b from-sky-200 via-sky-300 to-sky-200" />

            {/* Market Opened */}
            <div className="relative flex gap-4">
              <div className="absolute -left-8 flex h-6 w-6 items-center justify-center rounded-full border-2 border-sky-300 bg-white shadow-sm">
                <MdOutlinePlayArrow className="text-sky-600" size={14} />
              </div>
              <div className="flex-1">
                <div className="mb-1 font-semibold text-sky-900">
                  Market Opened
                </div>
                <div className="text-sm text-sky-700">
                  {marketStart}
                  {marketHistory?.start?.blockNumber > 0 && (
                    <span className="ml-2 text-xs text-sky-600">
                      Block #{marketHistory.start.blockNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Market Closed */}
            <div className="relative flex gap-4">
              <div className="absolute -left-8 flex h-6 w-6 items-center justify-center rounded-full border-2 border-sky-300 bg-white shadow-sm">
                <MdOutlineStop className="text-sky-600" size={14} />
              </div>
              <div className="flex-1">
                <div className="mb-1 font-semibold text-sky-900">
                  Market Closed
                </div>
                <div className="text-sm text-sky-700">
                  {marketClosed}
                  {marketHistory?.end?.blockNumber > 0 && (
                    <span className="ml-2 text-xs text-sky-600">
                      Block #{marketHistory.end.blockNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Reported */}
            {marketHistory?.reported && (
              <div className="relative flex gap-4">
                <div className="absolute -left-8 flex h-6 w-6 items-center justify-center rounded-full border-2 border-purple-300 bg-white shadow-sm">
                  <MdOutlineCheckCircle className="text-purple-600" size={14} />
                </div>
                <div className="flex-1 rounded-lg border border-purple-200/30 bg-purple-50/50 p-3 backdrop-blur-sm">
                  <div className="mb-2">
                    {oracleReported && (
                      <span className="mb-1 inline-block rounded-md bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                        Oracle Report
                      </span>
                    )}
                    <div className="text-sm font-medium text-sky-900">
                      {marketHistory.reported.by ? (
                        <Link
                          href={`/portfolio/${marketHistory.reported.by}`}
                          className="inline-block transition-colors hover:text-sky-600"
                        >
                          <UserIdentity
                            user={marketHistory.reported.by}
                            className="items-baseline"
                          />
                        </Link>
                      ) : (
                        <span className="text-sky-700">Unknown</span>
                      )}{" "}
                      reported{" "}
                      <span className="font-bold text-sky-900">
                        {getOutcome(marketHistory.reported.outcome)}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-sky-600">
                    {marketHistory.reported.timestamp &&
                      new Intl.DateTimeFormat("default", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(marketHistory.reported.timestamp)}
                    {marketHistory.reported.blockNumber && (
                      <span className="ml-2">
                        Block #{marketHistory.reported.blockNumber}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Disputes */}
            {marketHistory?.disputes &&
              marketHistory.disputes.map((dispute, idx) => (
                <div key={dispute.timestamp} className="relative flex gap-4">
                  <div className="absolute -left-8 flex h-6 w-6 items-center justify-center rounded-full border-2 border-orange-300 bg-white shadow-sm">
                    <MdOutlineGavel className="text-orange-600" size={14} />
                  </div>
                  <div className="flex-1 rounded-lg border border-orange-200/30 bg-orange-50/50 p-3 backdrop-blur-sm">
                    <div className="mb-2">
                      <div className="mb-1 inline-block rounded-md bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
                        Dispute #{idx + 1}
                      </div>
                      <div className="text-sm font-medium text-sky-900">
                        {dispute.by ? (
                          <Link
                            href={`/portfolio/${dispute.by}`}
                            className="inline-block transition-colors hover:text-sky-600"
                          >
                            <UserIdentity
                              user={dispute.by}
                              className="items-baseline"
                            />
                          </Link>
                        ) : (
                          <span className="text-sky-700">Unknown</span>
                        )}{" "}
                        disputed the reported outcome
                      </div>
                    </div>
                    <div className="text-xs text-sky-600">
                      {dispute.timestamp &&
                        new Intl.DateTimeFormat("default", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(dispute.timestamp)}
                      {dispute.blockNumber && (
                        <span className="ml-2">
                          Block #{dispute.blockNumber}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}

            {/* Resolved */}
            {marketHistory?.resolved?.resolvedOutcome !== undefined && (
              <div className="relative flex gap-4">
                <div className="absolute -left-8 flex h-6 w-6 items-center justify-center rounded-full border-2 border-emerald-300 bg-white shadow-sm">
                  <MdOutlineCheckCircle
                    className="text-emerald-600"
                    size={14}
                  />
                </div>
                <div className="flex-1 rounded-lg border border-emerald-200/30 bg-emerald-50/50 p-3 backdrop-blur-sm">
                  <div className="mb-2">
                    <div className="mb-1 inline-block rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      Resolved
                    </div>
                    <div className="text-sm font-medium text-sky-900">
                      Market resolved to{" "}
                      <span className="font-bold">
                        {marketType.scalar === null
                          ? categories[marketHistory.resolved.resolvedOutcome]
                              ?.name
                          : formatScalarOutcome(
                              marketHistory.resolved.resolvedOutcome,
                              scalarType,
                            )}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-sky-600">
                    {marketHistory.resolved.timestamp &&
                      new Intl.DateTimeFormat("default", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(marketHistory.resolved.timestamp)}
                    {marketHistory.resolved.blockNumber && (
                      <span className="ml-2">
                        Block #{marketHistory.resolved.blockNumber}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Dialog.Panel>
  );
};
