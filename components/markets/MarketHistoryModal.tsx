import { Dialog } from "@headlessui/react";
import { ScalarRangeType } from "@zeitgeistpm/sdk";
import { OutcomeReport } from "@zeitgeistpm/indexer";
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
    // Check marketType to determine market type, then validate outcome properties
    if (marketType.categorical != null) {
      // Categorical market - validate outcome.categorical exists before accessing
      if (outcome.categorical != null) {
        const categoryIndex =
          typeof outcome.categorical === "number"
            ? outcome.categorical
            : parseInt(String(outcome.categorical));
        return categories[categoryIndex]?.name ?? "Unknown";
      }
      return "Unknown";
    } else {
      // Scalar market - validate outcome.scalar exists before formatting
      if (outcome.scalar != null) {
        return formatScalarOutcome(outcome.scalar, scalarType);
      }
      return "Unknown";
    }
  };

  return (
    <Dialog.Panel>
      <div className="relative flex max-h-[85vh] w-full min-w-0 flex-shrink-0 flex-grow-0 flex-col overflow-hidden rounded-xl border-2 border-white/10 bg-white/10 shadow-2xl ring-2 ring-white/5 backdrop-blur-xl sm:w-[min(560px,90vw)] sm:max-w-[600px] md:max-h-[80vh]">
        {/* Header */}
        <div className="relative flex-shrink-0 border-b-2 border-white/10 px-6 pt-6 pb-3">
          <h3 className="text-center text-lg font-bold text-white md:text-xl">
            Market History
          </h3>
          <button
            onClick={() => setShowMarketHistory(false)}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg border-2 border-white/10 bg-white/10 text-white/90 backdrop-blur-sm transition-all hover:bg-white/20 hover:text-white"
            aria-label="Close"
          >
            <MdClose size={20} />
          </button>
        </div>

        {/* Timeline content */}
        <div className="flex-1 min-w-0 min-h-0 overflow-y-auto px-6 py-6">
          <div className="relative space-y-6 pl-8">
            {/* Vertical timeline line */}
            <div className="absolute bottom-2 left-[11px] top-2 w-0.5 bg-gradient-to-b from-white/20 via-white/30 to-white/20" />

            {/* Market Opened */}
            <div className="relative flex gap-4">
              <div className="absolute -left-8 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white/20 bg-white/10 shadow-sm backdrop-blur-sm">
                <MdOutlinePlayArrow
                  className="text-white/90"
                  size={14}
                />
              </div>
              <div className="flex-1">
                <div className="mb-1 font-semibold text-white">
                  Market Opened
                </div>
                <div className="text-sm text-white/80">
                  {marketStart}
                  {marketHistory?.start?.blockNumber > 0 && (
                    <span className="ml-2 text-xs text-white/60">
                      Block #{marketHistory.start.blockNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Market Closed */}
            <div className="relative flex gap-4">
              <div className="absolute -left-8 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white/20 bg-white/10 shadow-sm backdrop-blur-sm">
                <MdOutlineStop className="text-white/90" size={14} />
              </div>
              <div className="flex-1">
                <div className="mb-1 font-semibold text-white">
                  Market Closed
                </div>
                <div className="text-sm text-white/80">
                  {marketClosed}
                  {marketHistory?.end?.blockNumber > 0 && (
                    <span className="ml-2 text-xs text-white/60">
                      Block #{marketHistory.end.blockNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Reported */}
            {marketHistory?.reported && (
              <div className="relative flex gap-4">
                <div className="absolute -left-8 flex h-6 w-6 items-center justify-center rounded-full border-2 border-purple-400/40 bg-purple-500/20 shadow-sm backdrop-blur-sm">
                  <MdOutlineCheckCircle className="text-purple-400" size={14} />
                </div>
                <div className="flex-1 rounded-lg border-2 border-purple-400/30 bg-purple-500/10 p-3 backdrop-blur-sm">
                  <div className="mb-2">
                    {oracleReported && (
                      <span className="mb-1 inline-block rounded-md bg-purple-400/20 px-2 py-0.5 text-xs font-semibold text-purple-300">
                        Oracle Report
                      </span>
                    )}
                    <div className="text-sm font-medium text-white/90">
                      {marketHistory.reported.by ? (
                        <Link
                          href={`/portfolio/${marketHistory.reported.by}`}
                          className="inline-block transition-colors hover:text-purple-300"
                        >
                          <UserIdentity
                            user={marketHistory.reported.by}
                            className="items-baseline"
                          />
                        </Link>
                      ) : (
                        <span className="text-white/70">Unknown</span>
                      )}{" "}
                      reported{" "}
                      <span className="font-bold text-white">
                        {getOutcome(marketHistory.reported.outcome)}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-white/60">
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
                  <div className="absolute -left-8 flex h-6 w-6 items-center justify-center rounded-full border-2 border-orange-400/40 bg-orange-500/20 shadow-sm backdrop-blur-sm">
                    <MdOutlineGavel className="text-orange-400" size={14} />
                  </div>
                  <div className="flex-1 rounded-lg border-2 border-orange-400/30 bg-orange-500/10 p-3 backdrop-blur-sm">
                    <div className="mb-2">
                      <div className="mb-1 inline-block rounded-md bg-orange-400/20 px-2 py-0.5 text-xs font-semibold text-orange-300">
                        Dispute #{idx + 1}
                      </div>
                      <div className="text-sm font-medium text-white/90">
                        {dispute.by ? (
                          <Link
                            href={`/portfolio/${dispute.by}`}
                            className="inline-block transition-colors hover:text-orange-300"
                          >
                            <UserIdentity
                              user={dispute.by}
                              className="items-baseline"
                            />
                          </Link>
                        ) : (
                          <span className="text-white/70">Unknown</span>
                        )}{" "}
                        disputed the reported outcome
                      </div>
                    </div>
                    <div className="text-xs text-white/60">
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
                <div className="absolute -left-8 flex h-6 w-6 items-center justify-center rounded-full border-2 border-ztg-green-400/40 bg-ztg-green-500/20 shadow-sm backdrop-blur-sm">
                  <MdOutlineCheckCircle
                    className="text-ztg-green-400"
                    size={14}
                  />
                </div>
                <div className="flex-1 rounded-lg border-2 border-ztg-green-400/30 bg-ztg-green-500/10 p-3 backdrop-blur-sm">
                  <div className="mb-2">
                    <div className="mb-1 inline-block rounded-md bg-ztg-green-400/20 px-2 py-0.5 text-xs font-semibold text-ztg-green-300">
                      Resolved
                    </div>
                    <div className="text-sm font-medium text-white/90">
                      Market resolved to{" "}
                      <span className="font-bold text-white">
                        {getOutcome(marketHistory.resolved.outcome)}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-white/60">
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
