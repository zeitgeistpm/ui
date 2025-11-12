import { IOBaseAssetId, IOForeignAssetId } from "@zeitgeistpm/sdk";
import { lookupAssetImagePath } from "lib/constants/foreign-asset";
import { parseAssetIdString } from "lib/util/parse-asset-id";
import Image from "next/image";
import Link from "next/link";
import { useComboMarket } from "lib/hooks/queries/useComboMarket";

const MarketPositionHeader = ({
  marketId,
  question,
  baseAsset,
  isMultiMarket,
  poolId,
}: {
  marketId: number;
  question?: string;
  baseAsset: string;
  isMultiMarket?: boolean;
  poolId?: number;
}) => {
  const baseAssetId = parseAssetIdString(baseAsset);
  const imagePath = lookupAssetImagePath(baseAssetId);

  // Fetch combo market data if this is a multi-market
  const { data: comboMarketData } = useComboMarket(
    isMultiMarket && poolId ? poolId : 0,
  );

  // Use multi-market URL if this is a multi-market position
  const href =
    isMultiMarket && poolId
      ? `/multi-market/${poolId}`
      : `/markets/${marketId}`;

  // If this is a multi-market and we have the data, show assume/then markets
  if (isMultiMarket && comboMarketData?.sourceMarkets) {
    const [market1, market2] = comboMarketData.sourceMarkets;

    return (
      <Link
        href={href}
        className="group flex flex-col gap-3 border-b-2 border-ztg-primary-200/20 pb-3 transition-all"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Image
              width={16}
              height={16}
              src={imagePath}
              alt="Currency token logo"
              className="h-4 w-4 rounded-full"
            />
            <span className="text-xs font-semibold text-ztg-green-500">
              Multi-Market Position
            </span>
          </div>
          <span className="text-xs font-medium text-ztg-green-500 transition-all group-hover:text-ztg-green-500">
            View Details →
          </span>
        </div>

        {/* Market roles section */}
        <div className="flex flex-col gap-2">
          {/* Assume market */}
          <div className="flex items-start gap-2 rounded-md bg-ztg-primary-600/60 p-2.5 backdrop-blur-sm">
            <span className="inline-flex shrink-0 items-center rounded bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
              Assume
            </span>
            <span className="flex-1 text-sm font-medium leading-tight text-white">
              {market1.question}
            </span>
          </div>

          {/* Then market */}
          <div className="flex items-start gap-2 rounded-md bg-ztg-primary-600/60 p-2.5 backdrop-blur-sm">
            <span className="inline-flex shrink-0 items-center rounded bg-ztg-green-600 px-2 py-0.5 text-xs font-semibold text-white">
              Then
            </span>
            <span className="flex-1 text-sm font-medium leading-tight text-white">
              {market2.question}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  // Enhanced rendering for regular markets
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 border-b-2 border-ztg-primary-200/20 pb-3 transition-all"
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <Image
          width={16}
          height={16}
          src={imagePath}
          alt="Currency token logo"
          className="h-4 w-4 shrink-0 rounded-full"
        />
        <h3 className="truncate text-base font-semibold text-white transition-colors group-hover:text-ztg-green-500">
          {question}
        </h3>
      </div>
      <span className="shrink-0 text-xs font-medium text-ztg-green-500 transition-all group-hover:text-ztg-green-500">
        View →
      </span>
    </Link>
  );
};

export default MarketPositionHeader;
