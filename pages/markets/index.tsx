import { NextPage } from "next";
import MarketsList from "components/markets/MarketsList";
import { HeroBannerWSX } from "components/front-page/HeroBannerWSX";

const MarketsPage: NextPage = () => {
  return (
    <>
      <HeroBannerWSX />
      <MarketsList />;
    </>
  );
};

export default MarketsPage;
