import { IndexerContext, Market } from "@zeitgeistpm/sdk";
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
        title={market.question ?? ""}
        description="The application interface for Zeitgeist Prediction Markets. Built on Polkadot, Zeitgeist is the leader in decentralized prediction markets."
        image={
          new URL(
            `/api/og/generate?marketId=${market.marketId}`,
            process?.env?.NEXT_PUBLIC_SITE_URL?.match("vercel.app")
              ? `https://${process.env.NEXT_PUBLIC_SITE_URL}`
              : process.env.NEXT_PUBLIC_SITE_URL,
          )
        }
      />
    </>
  );
};

export default MarketMeta;
