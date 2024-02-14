import { IOBaseAssetId, IOForeignAssetId } from "@zeitgeistpm/sdk";
import { lookupAssetImagePath } from "lib/constants/foreign-asset";
import { parseAssetIdString } from "lib/util/parse-asset-id";
import Image from "next/image";
import Link from "next/link";

const MarketPositionHeader = ({
  marketId,
  question,
  baseAsset,
}: {
  marketId: number;
  question?: string;
  baseAsset: string;
}) => {
  const baseAssetId = parseAssetIdString(baseAsset);
  lookupAssetImagePath();
  const imagePath = IOForeignAssetId.is(baseAssetId)
    ? lookupAssetImagePath(baseAssetId.ForeignAsset)
    : IOBaseAssetId.is(baseAssetId)
      ? lookupAssetImagePath(baseAssetId.Ztg)
      : "";

  return (
    <h3 className="mb-5 flex items-center text-sm font-normal sm:text-base">
      <Image
        width={16}
        height={16}
        src={imagePath}
        alt="Currency token logo"
        className="mr-2 h-4 w-4 rounded-full"
      />
      <Link href={`/markets/${marketId}`}>{question}</Link>
    </h3>
  );
};

export default MarketPositionHeader;
