import LatestTrades from "components/front-page/LatestTrades";
import { NextPage } from "next";

const LatestTradesPage: NextPage = () => {
  return (
    <div className="mt-4">
      <LatestTrades limit={30} />
    </div>
  );
};

export default LatestTradesPage;
