import { Tab } from "@headlessui/react";
import { MarketOutcomeAssetId } from "@zeitgeistpm/sdk-next";
import { useState } from "react";
import BuyForm from "./BuyForm";
import SellForm from "./SellForm";
import TradeTab, { TradeTabType } from "./TradeTab";

const Amm2TradeForm = ({
  marketId,
  initialTab,
  initialAsset,
}: {
  marketId: number;
  initialTab?: TradeTabType;
  initialAsset?: MarketOutcomeAssetId;
}) => {
  const [tabType, setTabType] = useState<TradeTabType>(
    initialTab ?? TradeTabType.Buy,
  );

  return (
    <Tab.Group
      onChange={(index: TradeTabType) => {
        setTabType(index);
      }}
      selectedIndex={tabType}
    >
      <Tab.List className="flex h-[71px] text-center font-medium text-ztg-18-150">
        <Tab
          as={TradeTab}
          selected={tabType === TradeTabType.Buy}
          className="rounded-tl-[10px]"
        >
          Buy
        </Tab>
        <Tab
          as={TradeTab}
          selected={tabType === TradeTabType.Sell}
          className="rounded-tr-[10px]"
        >
          Sell
        </Tab>
      </Tab.List>

      <Tab.Panels className="p-[30px]">
        <Tab.Panel>
          <BuyForm marketId={marketId} initialAsset={initialAsset} />
        </Tab.Panel>
        <Tab.Panel>
          <SellForm marketId={marketId} initialAsset={initialAsset} />
        </Tab.Panel>
      </Tab.Panels>
    </Tab.Group>
  );
};

export default Amm2TradeForm;
