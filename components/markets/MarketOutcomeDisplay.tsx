import { MarketStatus } from "@zeitgeistpm/sdk";
import Skeleton from "components/ui/Skeleton";
import { MarketEventHistory } from "lib/hooks/queries/useMarketEventHistory";
import Link from "next/link";
import { FC } from "react";
import {
  MdOutlineHistory,
  MdCheckCircle,
  MdWarning,
  MdGavel,
} from "react-icons/md";
import { UserIdentity } from "./MarketHeaderUtils";

interface MarketOutcomeDisplayProps {
  setShowMarketHistory: (show: boolean) => void;
  marketHistory: MarketEventHistory;
  status: MarketStatus;
  outcome: string | number;
  by?: string;
}

const StatusConfig = {
  Resolved: {
    icon: MdCheckCircle,
    label: "Final Outcome",
    gradient: "from-ztg-green-400/80 to-ztg-green-500/80",
    borderColor: "border-ztg-green-400/40",
    iconColor: "text-ztg-green-500",
    bgColor: "bg-ztg-green-500/10",
  },
  Reported: {
    icon: MdCheckCircle,
    label: "Reported Outcome",
    gradient: "from-purple-400/80 to-purple-500/80",
    borderColor: "border-purple-400/40",
    iconColor: "text-purple-400",
    bgColor: "bg-purple-500/10",
  },
  Disputed: {
    icon: MdGavel,
    label: "Disputed Outcome",
    gradient: "from-orange-400/80 to-orange-500/80",
    borderColor: "border-orange-400/50",
    iconColor: "text-orange-400",
    bgColor: "bg-orange-500/20",
  },
};

export const MarketOutcomeDisplay: FC<MarketOutcomeDisplayProps> = ({
  status,
  outcome,
  by,
  setShowMarketHistory,
  marketHistory,
}) => {
  const config = StatusConfig[status as keyof typeof StatusConfig];

  if (!config) return null;

  const StatusIcon = config.icon;

  return (
    <div className="group relative rounded-lg bg-ztg-primary-900/60 px-4 py-3 shadow-md backdrop-blur-md transition-all hover:bg-ztg-primary-800/70 hover:shadow-lg">
      {/* Status Indicator Bar */}
      <div
        className={`absolute left-0 top-0 h-1 w-full rounded-t-lg bg-gradient-to-r ${config.gradient}`}
      />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 md:flex-nowrap">
        {/* Status Badge */}
        <div
          className={`flex items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1.5 backdrop-blur-sm`}
        >
          <StatusIcon className={config.iconColor} size={16} />
          <span className="whitespace-nowrap text-xs font-semibold text-white/90">
            {config.label}
          </span>
        </div>

        {/* Outcome Display */}
        {outcome ? (
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-white/90">{outcome}</span>
          </div>
        ) : (
          <Skeleton width="100px" height="20px" />
        )}

        {/* Divider */}
        {by && <div className="hidden h-4 w-px bg-ztg-green-500/40 md:block" />}

        {/* Reporter Info */}
        {by && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-white/70">
              {status === "Resolved" ? "by" : "by"}
            </span>
            <Link
              href={`/portfolio/${by}`}
              className="font-medium text-white/90 transition-all hover:text-ztg-green-500"
            >
              <UserIdentity user={by} />
            </Link>
          </div>
        )}

        {/* Spacer */}
        <div className="hidden flex-1 md:block" />

        {/* History Button */}
        {marketHistory ? (
          <button
            onClick={() => setShowMarketHistory(true)}
            className="ml-auto flex items-center gap-1.5 rounded-md bg-white/10 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm transition-all hover:bg-white/20 hover:shadow-sm"
            aria-label="View market history"
          >
            <MdOutlineHistory size={16} className="text-ztg-green-500" />
            <span className="hidden sm:inline">History</span>
          </button>
        ) : (
          <Skeleton width="80px" height="28px" />
        )}
      </div>
    </div>
  );
};
