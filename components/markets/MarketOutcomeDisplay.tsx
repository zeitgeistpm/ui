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
    gradient: "from-emerald-400/80 to-emerald-500/80",
    borderColor: "border-emerald-200/40",
    iconColor: "text-emerald-600",
    bgColor: "bg-emerald-50/50",
  },
  Reported: {
    icon: MdCheckCircle,
    label: "Reported Outcome",
    gradient: "from-purple-400/80 to-purple-500/80",
    borderColor: "border-purple-200/40",
    iconColor: "text-purple-600",
    bgColor: "bg-purple-50/50",
  },
  Disputed: {
    icon: MdGavel,
    label: "Disputed Outcome",
    gradient: "from-orange-400/80 to-orange-500/80",
    borderColor: "border-orange-200/40",
    iconColor: "text-orange-600",
    bgColor: "bg-orange-50/50",
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
    <div className="group relative rounded-lg border border-sky-200/30 bg-white/80 px-4 py-3 shadow-md backdrop-blur-md transition-all hover:shadow-lg">
      {/* Status Indicator Bar */}
      <div
        className={`absolute left-0 top-0 h-1 w-full rounded-t-lg bg-gradient-to-r ${config.gradient}`}
      />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 md:flex-nowrap">
        {/* Status Badge */}
        <div
          className={`flex items-center gap-1.5 rounded-md ${config.bgColor} px-2.5 py-1.5 backdrop-blur-sm`}
        >
          <StatusIcon className={`${config.iconColor}`} size={16} />
          <span className="whitespace-nowrap text-xs font-semibold text-sky-900">
            {config.label}
          </span>
        </div>

        {/* Outcome Display */}
        {outcome ? (
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-sky-900">{outcome}</span>
          </div>
        ) : (
          <Skeleton width="100px" height="20px" />
        )}

        {/* Divider */}
        {by && <div className="hidden h-4 w-px bg-sky-200/50 md:block" />}

        {/* Reporter Info */}
        {by && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-sky-600">
              {status === "Resolved" ? "by" : "by"}
            </span>
            <Link
              href={`/portfolio/${by}`}
              className="font-medium text-sky-900 transition-all hover:text-sky-600"
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
            className="ml-auto flex items-center gap-1.5 rounded-md border border-sky-200/30 bg-sky-50/50 px-3 py-1.5 text-xs font-medium text-sky-900 backdrop-blur-sm transition-all hover:bg-sky-100/80 hover:shadow-sm"
            aria-label="View market history"
          >
            <MdOutlineHistory size={16} className="text-sky-600" />
            <span className="hidden sm:inline">History</span>
          </button>
        ) : (
          <Skeleton width="80px" height="28px" />
        )}
      </div>
    </div>
  );
};
