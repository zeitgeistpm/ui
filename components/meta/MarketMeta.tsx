import { IndexerContext, Market } from "@zeitgeistpm/sdk-next";
import { MarketPageIndexedData } from "lib/gql/markets";
import { OgHead } from "./OgHead";

export const MarketMeta = ({
  market,
}: {
  market: Market<IndexerContext> | MarketPageIndexedData;
}) => {
  return (
    <>
      <OgHead
        title={market.question}
        description={market.description || market.question}
        image={`/api/og/generate?marketId=${market.marketId}`}
      />
    </>
  );
};

export default MarketMeta;
