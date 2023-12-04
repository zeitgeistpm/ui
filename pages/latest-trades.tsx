import LatestTrades from "components/front-page/LatestTrades";
import { NextPage } from "next";
import { useRouter } from "next/router";

const LatestTradesPage: NextPage = () => {
  const { query } = useRouter();
  const marketId = query["marketId"];

  return (
    <div className="mt-4">
      <h1 className="mb-7 text-center sm:col-span-2 sm:text-start">
        Latest Trades
      </h1>
      <LatestTrades
        limit={30}
        marketId={marketId ? Number(marketId) : undefined}
      />
    </div>
  );
};

export default LatestTradesPage;
