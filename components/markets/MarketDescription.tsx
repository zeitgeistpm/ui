import { PortableText } from "@portabletext/react";
import { useMarketCmsMetadata } from "lib/hooks/queries/cms/useMarketCmsMetadata";
import { isArray, isString } from "lodash-es";
import { FullMarketFragment } from "@zeitgeistpm/indexer";
import { MarketPageIndexedData } from "lib/gql/markets";
import dynamic from "next/dynamic";

const QuillViewer = dynamic(() => import("components/ui/QuillViewer"), {
  ssr: false,
});

export const MarketDescription = ({
  market,
}: {
  market: FullMarketFragment | MarketPageIndexedData | MarketPageIndexedData;
}) => {
  const { data: marketCmsMetadata } = useMarketCmsMetadata(market.marketId);

  const description = marketCmsMetadata?.description ?? market.description;
  return (
    <>
      {isArray(description) && description.length ? (
        <div className="rounded-lg bg-white/15 shadow-lg backdrop-blur-md">
          <h3 className="mb-4 p-6 pb-3 text-xl font-bold text-white md:p-8">About Market</h3>
          <div className="px-6 pb-6 text-base leading-relaxed text-white/90 md:px-8 md:pb-8">
            <PortableText value={description} />
          </div>
        </div>
      ) : (
        isString(description) &&
        description?.length > 0 && (
          <div className="rounded-lg bg-white/15 shadow-lg backdrop-blur-md">
            <h3 className="mb-4 p-4 pb-2 text-lg font-semibold text-white">About Market</h3>
            <div className="px-4 pb-4 text-white/90">
              <QuillViewer value={description} />
            </div>
          </div>
        )
      )}
    </>
  );
};
