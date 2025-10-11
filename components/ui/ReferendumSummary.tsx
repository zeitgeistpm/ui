import { usePolkadotReferendumVotes } from "lib/hooks/queries/polkadot/usePolkadotReferendumVotes";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import { ExternalLink } from "react-feather";
import { Loader } from "./Loader";
import Decimal from "decimal.js";

// Format large numbers with K, M, B suffixes
// Note: amounts come in Planck (10^-10 DOT), so we divide by 10^10
const formatVoteAmount = (amount: Decimal): string => {
  const dotAmount = amount.div(10_000_000_000); // Convert Planck to DOT
  const num = dotAmount.toNumber();

  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)}B`;
  } else if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  } else if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toFixed(1);
};

const ReferendumSummary = ({
  referendumIndex,
}: {
  referendumIndex: number;
}) => {
  const { data: referendum, isLoading } =
    usePolkadotReferendumVotes(referendumIndex);
  const barValue = referendum?.ayePercentage.mul(100).toNumber() ?? 0;

  if (isLoading) {
    return (
      <div className="flex w-full items-center justify-center rounded-xl border border-sky-200/30 bg-white/80 p-8 shadow-md backdrop-blur-md">
        <Loader variant="Success" loading className="h-10 w-10" />
      </div>
    );
  }

  return (
    <>
      {referendum && (
        <div className="flex w-full flex-col gap-4 rounded-xl border border-sky-200/30 bg-white/80 px-6 py-4 shadow-md backdrop-blur-md transition-all hover:shadow-lg">
          {/* Header with Title and External Link */}
          <div className="flex items-center border-b border-sky-200/30 pb-3">
            <div className="flex items-center gap-2">
              <div className="text-lg font-bold text-sky-900">
                Referendum #{referendumIndex}
              </div>
            </div>
            <a
              href={`https://polkadot.polkassembly.io/referenda/${referendumIndex}`}
              className="group ml-auto flex items-center gap-2 rounded-lg border border-sky-200/30 bg-white/60 px-2.5 py-1.5 text-sm font-medium text-sky-900 shadow-sm transition-all hover:bg-white/80 hover:shadow-md"
              target="_blank"
              rel="noreferrer"
            >
              <img
                src="/icons/polkassembly.svg"
                alt="View on Polkassembly"
                width={"70px"}
                className="opacity-90 transition-opacity group-hover:opacity-100"
              />
              <ExternalLink size={12} className="text-sky-600" />
            </a>
          </div>

          {/* Circular Progress Gauge */}
          <div className="flex items-center justify-center py-2">
            <div className="h-[120px] w-[240px]">
              <CircularProgressbar
                value={barValue}
                circleRatio={0.5}
                strokeWidth={3}
                styles={buildStyles({
                  rotation: 0.75,
                  strokeLinecap: "round",
                  textSize: "16px",
                  pathTransitionDuration: 0.5,
                  pathColor: `#0ea5e9`, // sky-600
                  trailColor: "#f97316", // orange-500
                })}
              />
            </div>
          </div>

          {/* Vote Breakdown */}
          <div className="flex gap-2.5">
            {/* Aye Votes */}
            <div className="flex flex-1 flex-col items-center gap-1.5 rounded-lg border border-sky-200/30 bg-gradient-to-br from-sky-50/50 to-sky-100/50 p-2.5 shadow-sm backdrop-blur-sm">
              <div className="flex items-baseline gap-1.5">
                <div className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                  Aye:
                </div>
                <div className="text-lg font-bold text-sky-600">
                  {referendum.ayePercentage.mul(100).toFixed(1)}%
                </div>
              </div>
              <div className="text-xs font-semibold text-sky-600">
                {formatVoteAmount(referendum.ayes)} DOT
              </div>
            </div>

            {/* Nay Votes */}
            <div className="flex flex-1 flex-col items-center gap-1.5 rounded-lg border border-orange-200/30 bg-gradient-to-br from-orange-50/50 to-orange-100/50 p-2.5 shadow-sm backdrop-blur-sm">
              <div className="flex items-baseline gap-1.5">
                <div className="text-xs font-semibold uppercase tracking-wide text-orange-700">
                  Nay:
                </div>
                <div className="text-lg font-bold text-orange-600">
                  {referendum.nayPercentage.mul(100).toFixed(1)}%
                </div>
              </div>
              <div className="text-xs font-semibold text-orange-600">
                {formatVoteAmount(referendum.nays)} DOT
              </div>
            </div>
          </div>

          {/* Total Votes Display */}
          <div className="flex items-center justify-center gap-2 rounded-lg border border-sky-200/30 bg-sky-50/50 py-2 text-center backdrop-blur-sm">
            <span className="text-sm font-semibold text-sky-700">Total:</span>
            <span className="text-sm font-bold text-sky-900">
              {formatVoteAmount(referendum.ayes.plus(referendum.nays))} DOT
            </span>
          </div>
        </div>
      )}
    </>
  );
};

export default ReferendumSummary;
