import Link from "next/link";
import {
  ComboMarketData,
  OutcomeCombination,
} from "lib/hooks/queries/useComboMarket";
import { ExternalLink } from "react-feather";

interface ComboMarketCardProps {
  comboMarket: ComboMarketData;
}

export const ComboMarketCard: React.FC<ComboMarketCardProps> = ({
  comboMarket,
}) => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <div className="p-6">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex-1">
            <div className="mb-2 inline-block rounded-full bg-purple-100 px-2 py-1 text-xs font-medium text-purple-800">
              Combinatorial Market
            </div>
            <h3 className="mb-2 line-clamp-2 text-lg font-semibold text-gray-900">
              {comboMarket.question}
            </h3>
          </div>
          <Link
            href={`/combo/${comboMarket.poolId}`}
            className="ml-4 flex items-center text-sm text-blue-600 hover:text-blue-800"
          >
            <ExternalLink size={16} />
          </Link>
        </div>

        {/* Source Markets */}
        <div className="mb-4">
          <div className="mb-2 text-sm text-gray-600">Source Markets:</div>
          <div className="space-y-1">
            {comboMarket.sourceMarkets.map((market, index) => (
              <div key={market.marketId} className="text-sm">
                <span className="text-gray-500">#{market.marketId}</span>{" "}
                <span className="line-clamp-1 text-gray-700">
                  {market.question}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Outcome Combinations Preview */}
        <div className="mb-4">
          <div className="mb-2 text-sm text-gray-600">
            Combinations ({comboMarket.outcomeCombinations.length}):
          </div>
          <div className="flex flex-wrap gap-2">
            {comboMarket.outcomeCombinations.slice(0, 4).map((combo) => (
              <div
                key={combo.id}
                className="flex items-center rounded bg-gray-50 px-2 py-1 text-xs"
              >
                <div
                  className="mr-1 h-2 w-2 rounded-full"
                  style={{ backgroundColor: combo.color }}
                />
                <span className="max-w-20 truncate">{combo.name}</span>
              </div>
            ))}
            {comboMarket.outcomeCombinations.length > 4 && (
              <div className="px-2 py-1 text-xs text-gray-500">
                +{comboMarket.outcomeCombinations.length - 4} more
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-gray-100 pt-4">
          <div className="text-sm text-gray-500">
            Pool ID: {comboMarket.poolId}
          </div>
          <Link
            href={`/combo/${comboMarket.poolId}`}
            className="inline-flex items-center rounded-md bg-blue-50 px-3 py-1 text-sm font-medium text-blue-600 transition-colors hover:bg-blue-100"
          >
            View Market
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ComboMarketCard;
