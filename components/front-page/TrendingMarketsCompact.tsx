import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { useMarketCmsMetadata } from "lib/hooks/queries/cms/useMarketCmsMetadata";
import { useMarketsStats } from "lib/hooks/queries/useMarketsStats";
import { useMarketImage } from "lib/hooks/useMarketImage";
import { isMarketImageBase64Encoded } from "lib/types/create-market";
import { MarketOutcome, MarketOutcomes } from "lib/types/markets";
import { getCurrentPrediction } from "lib/util/assets";
import { isAbsoluteUrl } from "next/dist/shared/lib/utils";
import Image from "next/image";
import Link from "next/link";

const TrendingMarketsCompact = ({
  markets,
}: {
  markets: FullMarketFragment[];
}) => {
  const { data: marketsStats } = useMarketsStats(
    markets.map((m) => m.marketId),
  );

  return (
    <div>
      <div className="flex w-full flex-col divide-y divide-solid rounded-lg bg-white text-sm">
        {markets.map((market) => (
          <TrendingMarketRow key={market.marketId} market={market} />
        ))}
      </div>
    </div>
  );
};

const TrendingMarketRow = ({ market }: { market: FullMarketFragment }) => {
  const { img, marketId, question, categories, assets, outcomeAssets } = market;
  const marketCategories: MarketOutcomes =
    categories?.map((category, index) => {
      const asset = assets[index];

      const marketCategory: MarketOutcome = {
        name: category.name ?? "",
        assetId: outcomeAssets[index],
        price: asset?.price,
      };

      return marketCategory;
    }) ?? [];

  const { data: image } = useMarketImage(market, {
    fallback:
      img && isAbsoluteUrl(img) && !isMarketImageBase64Encoded(img)
        ? img
        : undefined,
  });

  const { data: cmsMetadata } = useMarketCmsMetadata(marketId);

  const prediction = getCurrentPrediction(market.assets, market);
  const isYesNoMarket =
    marketCategories.length === 2 &&
    marketCategories.some((outcome) => outcome.name.toLowerCase() === "yes") &&
    marketCategories.some((outcome) => outcome.name.toLowerCase() === "no");

  const displayPrediction =
    isYesNoMarket === true && prediction?.name.toLowerCase() === "no"
      ? { price: 1 - prediction.price, name: "Yes" }
      : prediction;
  console.log(question);

  console.log(prediction);
  console.log(displayPrediction);

  return (
    <Link
      href={`/markets/${marketId}`}
      className="flex h-[70px] items-center p-4"
    >
      <div className="mr-4 flex h-[45px] w-[45px] rounded-md">
        <Image
          priority
          alt="Market image"
          src={image}
          width={45}
          height={45}
          className="overflow-hidden rounded-md"
          sizes={"45px"}
        />
      </div>
      <div className="flex flex-col justify-center">
        <div className="text-sm">{cmsMetadata?.question ?? question}</div>
        <div className="flex text-sm text-ztg-blue">
          <div>
            {prediction.name != null && prediction.name !== ""
              ? market.marketType.categorical
                ? prediction.name
                : `${Intl.NumberFormat("en-US", {
                    maximumSignificantDigits: 3,
                  }).format(Number(prediction.name))}`
              : "No Prediction"}
          </div>
          {market.marketType.categorical && (
            <div className="ml-2 font-bold">{prediction.percentage}%</div>
          )}
        </div>
      </div>
    </Link>
  );
};

export default TrendingMarketsCompact;
