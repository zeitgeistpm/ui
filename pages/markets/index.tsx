import { observer } from "mobx-react";
import React from "react";
import { NextPage } from "next";

import MarketsList from "components/markets/MarketsList";
import InfoBoxes from "components/ui/InfoBoxes";
import dynamic from "next/dynamic";

const DynamicMarketList = dynamic(() => Promise.resolve(MarketsList), {
  ssr: false,
});
const MarketsPage: NextPage = observer(() => {
  return (
    <>
      <InfoBoxes />
      <DynamicMarketList />
    </>
  );
});

export default MarketsPage;
