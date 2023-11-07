import { Tab } from "@headlessui/react";
import { MarketOutcomeAssetId, getIndexOf, ZTG } from "@zeitgeistpm/sdk";
import { useEffect, useState } from "react";
import BuyForm from "./BuyForm";
import SellForm from "./SellForm";
import TradeTab, { TradeTabType } from "./TradeTab";
import { ISubmittableResult } from "@polkadot/types/types";
import TradeResult from "components/markets/TradeResult";
import Decimal from "decimal.js";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import { parseAssetIdString } from "lib/util/parse-asset-id";

const Amm2TradeForm = ({
  marketId,
  selectedTab,
  initialAsset,
  showTabs = true,
}: {
  marketId: number;
  selectedTab?: TradeTabType;
  initialAsset?: MarketOutcomeAssetId;
  showTabs?: boolean;
}) => {
  const [tabType, setTabType] = useState<TradeTabType>();
  const [showSuccessBox, setShowSuccessBox] = useState(false);
  const [amountReceived, setAmountReceived] = useState<Decimal>();
  const [amountIn, setAmountIn] = useState<Decimal>();
  const [outcomeAsset, setOutcomeAsset] = useState<MarketOutcomeAssetId>();
  const { data: market } = useMarket({ marketId });
  const baseAsset = parseAssetIdString(market?.baseAsset);
  const { data: assetMetadata } = useAssetMetadata(baseAsset);
  const baseSymbol = assetMetadata?.symbol;

  useEffect(() => {
    setTabType(selectedTab ?? TradeTabType.Buy);
  }, [selectedTab]);

  const handleSuccess = (data: ISubmittableResult) => {
    const { events } = data;
    for (const eventData of events) {
      const { event } = eventData;
      const { data } = event;
      if (
        event.section.toString() === "neoSwaps" &&
        (event.method.toString() === "SellExecuted" ||
          event.method.toString() === "BuyExecuted")
      ) {
        const amountOut: number = data["amountOut"].toNumber();
        setAmountReceived(new Decimal(amountOut ?? 0));
        setShowSuccessBox(true);
      }
    }
  };

  return (
    <>
      {showSuccessBox === true ? (
        <TradeResult
          type={tabType === TradeTabType.Buy ? "buy" : "sell"}
          amount={
            tabType === TradeTabType.Buy
              ? amountReceived?.div(ZTG)
              : amountIn?.div(ZTG)
          }
          tokenName={
            outcomeAsset && market?.categories
              ? market.categories[getIndexOf(outcomeAsset)].name ?? ""
              : ""
          }
          baseTokenAmount={
            tabType === TradeTabType.Buy
              ? amountIn?.div(ZTG)
              : amountReceived?.div(ZTG)
          }
          baseToken={baseSymbol}
          marketId={marketId}
          marketQuestion={market?.question ?? ""}
          onContinueClick={() => {
            setShowSuccessBox(false);
          }}
        />
      ) : (
        <Tab.Group
          onChange={(index: TradeTabType) => {
            setTabType(index);
          }}
          selectedIndex={tabType}
        >
          <Tab.List
            className={`h-[71px] text-center font-medium text-ztg-18-150 ${
              showTabs ? "flex" : "hidden"
            }`}
          >
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
              <BuyForm
                marketId={marketId}
                initialAsset={initialAsset}
                onSuccess={(data, asset, amount) => {
                  handleSuccess(data);
                  setOutcomeAsset(asset);
                  setAmountIn(amount);
                }}
              />
            </Tab.Panel>
            <Tab.Panel>
              <SellForm
                marketId={marketId}
                initialAsset={initialAsset}
                onSuccess={(data, asset, amount) => {
                  handleSuccess(data);
                  setOutcomeAsset(asset);
                  setAmountIn(amount);
                }}
              />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      )}
    </>
  );
};

export default Amm2TradeForm;
