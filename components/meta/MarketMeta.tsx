import { IndexerContext, Market } from "@zeitgeistpm/sdk-next";
import { MarketPageIndexedData } from "lib/gql/markets";
import { OgHead } from "./OgHead";

export const MarketMeta = ({
  market,
}: {
  market: Market<IndexerContext> | MarketPageIndexedData;
}) => {
  const imageUrl = new URL(
    `/api/og/generate?marketId=${market.marketId}`,
    `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`,
  );

  return (
    <>
      <OgHead
        title={market.question}
        description={market.description || market.question}
        image={imageUrl.href}
      />
    </>
  );
};

export default MarketMeta;
