import { NextPage } from "next";
import MarketsList from "components/markets/MarketsList";
// import { HeroBannerNTT } from "components/front-page/HeroBannerNTT";

const MarketsPage: NextPage = () => {
  return (
    <>
      {/* <HeroBannerNTT /> */}
      <MarketsList />
    </>
  );
};

export default MarketsPage;
