import Link from "next/link";
import { ComboMarketData, OutcomeCombination } from "lib/hooks/queries/useComboMarket";
import { ExternalLink } from "react-feather";

interface ComboMarketCardProps {
  comboMarket: ComboMarketData;
}

export const ComboMarketCard: React.FC<ComboMarketCardProps> = ({ comboMarket }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="inline-block bg-purple-100 text-purple-800 text-xs font-medium px-2 py-1 rounded-full mb-2">
              Combinatorial Market
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
              {comboMarket.question}
            </h3>
          </div>
          <Link
            href={`/combo/${comboMarket.poolId}`}
            className="text-blue-600 hover:text-blue-800 flex items-center text-sm ml-4"
          >
            <ExternalLink size={16} />
          </Link>
        </div>

        {/* Source Markets */}
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">Source Markets:</div>
          <div className="space-y-1">
            {comboMarket.sourceMarkets.map((market, index) => (
              <div key={market.marketId} className="text-sm">
                <span className="text-gray-500">#{market.marketId}</span>{" "}
                <span className="text-gray-700 line-clamp-1">{market.question}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Outcome Combinations Preview */}
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">
            Combinations ({comboMarket.outcomeCombinations.length}):
          </div>
          <div className="flex flex-wrap gap-2">
            {comboMarket.outcomeCombinations.slice(0, 4).map((combo) => (
              <div
                key={combo.id}
                className="flex items-center text-xs bg-gray-50 px-2 py-1 rounded"
              >
                <div
                  className="w-2 h-2 rounded-full mr-1"
                  style={{ backgroundColor: combo.color }}
                />
                <span className="truncate max-w-20">{combo.name}</span>
              </div>
            ))}
            {comboMarket.outcomeCombinations.length > 4 && (
              <div className="text-xs text-gray-500 px-2 py-1">
                +{comboMarket.outcomeCombinations.length - 4} more
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-sm text-gray-500">
            Pool ID: {comboMarket.poolId}
          </div>
          <Link
            href={`/combo/${comboMarket.poolId}`}
            className="inline-flex items-center px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
          >
            View Market
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ComboMarketCard; 