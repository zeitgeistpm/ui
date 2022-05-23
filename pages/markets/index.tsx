import { observer } from "mobx-react";
import React from "react";
import { NextPage } from "next";

import MarketsList from "components/markets/MarketsList";
import InfoBoxes from "components/ui/InfoBoxes";

const MarketsPage: NextPage = observer(() => {
  return (
    <>
      <InfoBoxes />
      <MarketsList />
    </>
  );
});

export default MarketsPage;
