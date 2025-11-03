import Image from "next/image";
import { FC } from "react";
import { MarketMetadataBadges } from "./MarketMetadataBadges";
import { MarketPageIndexedData } from "lib/gql/markets";
import { PromotedMarket } from "lib/cms/get-promoted-markets";

interface MarketHeroProps {
  question: string;
  marketImage: string;
  rejectReason?: string;
  market: MarketPageIndexedData;
  token?: string;
  imagePath: string;
  promotionData?: PromotedMarket | null;
}

export const MarketHero: FC<MarketHeroProps> = ({
  question,
  marketImage,
  rejectReason,
  market,
  token,
  imagePath,
  promotionData,
}) => {
  return (
    <div className="rounded-lg bg-white/15 p-4 shadow-lg backdrop-blur-md md:p-5">
      <div className="flex gap-4 md:gap-5">
        {/* Icon - takes full height */}
        <div className="flex-shrink-0 self-start">
          <div className="relative h-16 w-16 overflow-hidden rounded-lg shadow-md md:h-20 md:w-20">
            <Image
              alt="Market image"
              src={marketImage}
              fill
              className="overflow-hidden rounded-lg"
              style={{
                objectFit: "cover",
                objectPosition: "50% 50%",
              }}
              sizes="100px"
            />
          </div>
        </div>

        {/* Title (2/3) + Badges (1/3) */}
        <div className="flex min-h-[60px] flex-1 flex-col justify-between">
          {/* Title section - takes up 2/3 */}
          <div className="flex-[2]">
            <h1 className="text-2xl font-bold leading-tight text-white md:text-4xl">{question}</h1>
            {rejectReason && rejectReason.length > 0 && (
              <div className="mt-1 rounded-md border-2 border-r-2ed-500/40 bg-red-900/30 px-3 py-1.5 text-sm text-red-400 backdrop-blur-sm">
                Market rejected: {rejectReason}
              </div>
            )}
          </div>

          {/* Badges section - takes up 1/3 */}
          <div className="flex-1 pt-1">
            <MarketMetadataBadges
              market={market}
              token={token}
              imagePath={imagePath}
              promotionData={promotionData}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
