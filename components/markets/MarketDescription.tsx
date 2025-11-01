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
        <>
          <h3 className="mb-5 text-2xl">About Market</h3>
          <PortableText value={description} />
        </>
      ) : (
        isString(description) &&
        description?.length > 0 && (
          <>
            <h3 className="mb-5 text-2xl">About Market</h3>
            <QuillViewer value={description} />
          </>
        )
      )}
    </>
  );
};
