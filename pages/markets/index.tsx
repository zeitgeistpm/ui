import dynamic from "next/dynamic";
import { observer } from "mobx-react";
import React, { useEffect } from "react";
import { NextPage } from "next";

import MarketsList from "components/markets/MarketsList";
import InfoBoxes from "components/ui/InfoBoxes";

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
