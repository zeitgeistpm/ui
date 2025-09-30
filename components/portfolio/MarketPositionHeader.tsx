import { IOBaseAssetId, IOForeignAssetId } from "@zeitgeistpm/sdk";
import { lookupAssetImagePath } from "lib/constants/foreign-asset";
import { parseAssetIdString } from "lib/util/parse-asset-id";
import Image from "next/image";
import Link from "next/link";

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

  // Use multi-market URL if this is a multi-market position
  const href = isMultiMarket && poolId
    ? `/multi-market/${poolId}`
    : `/markets/${marketId}`;

  return (
    <h3 className="mb-5 flex items-center text-sm font-normal sm:text-base">
      <Image
        width={16}
        height={16}
        src={imagePath}
        alt="Currency token logo"
        className="mr-2 h-4 w-4 rounded-full"
      />
      <Link href={href}>{question}</Link>
    </h3>
  );
};

export default MarketPositionHeader;
