import LatestTrades from "components/front-page/LatestTrades";
import { NextPage } from "next";

const LatestTradesPage: NextPage = () => {
  return (
    <div className="mt-4">
      <h1 className="mb-7 text-center sm:col-span-2 sm:text-start">
        Latest Trades
      </h1>
      <LatestTrades limit={30} />
    </div>
  );
};

export default LatestTradesPage;
