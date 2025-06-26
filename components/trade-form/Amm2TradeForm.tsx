import { Tab } from "@headlessui/react";
import { MarketOutcomeAssetId, getIndexOf, ZTG } from "@zeitgeistpm/sdk";
import { useEffect, useRef, useState } from "react";
import BuyForm from "./BuyForm";
import SellForm from "./SellForm";
import TradeTab, { TradeTabType } from "./TradeTab";
import { ISubmittableResult } from "@polkadot/types/types";
import TradeResult from "components/markets/TradeResult";
import Decimal from "decimal.js";
import { useMarket } from "lib/hooks/queries/useMarket";
import { useAssetMetadata } from "lib/hooks/queries/useAssetMetadata";
import { parseAssetIdString } from "lib/util/parse-asset-id";
import LimitOrderForm, {
  LimitBuyOrderForm,
  LimitSellOrderForm,
} from "./LimitOrderForm";
import { ChevronDown } from "react-feather";
import { init } from "next/dist/compiled/webpack/webpack";
import { CombinatorialToken, isCombinatorialToken } from "lib/types/combinatorial";
import { Pool } from "zeitgeist-subsquid/src/types/v51";

const Amm2TradeForm = ({
  marketId,
  poolData,
  selectedTab,
  initialAsset,
  showTabs = true,
}: {
  marketId: number;
  poolData?: any;
  selectedTab?: TradeTabType;
  initialAsset?: MarketOutcomeAssetId;
  showTabs?: boolean;
}) => {
  const [tabType, setTabType] = useState<TradeTabType>();
  const [orderType, setOrderType] = useState<OrderType>("market");
  const [showSuccessBox, setShowSuccessBox] = useState(false);
  const [amountReceived, setAmountReceived] = useState<Decimal>();
  const [amountIn, setAmountIn] = useState<Decimal>();
  const [outcomeAsset, setOutcomeAsset] = useState<MarketOutcomeAssetId | CombinatorialToken>();
  
  // Use poolData for combo markets, otherwise use market data
  const { data: market } = useMarket(poolData ? undefined : { marketId });
  
  const baseAsset = poolData 
    ? parseAssetIdString('ZTG') // Combo markets always use ZTG
    : parseAssetIdString(market?.baseAsset);
    
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
            outcomeAsset
              ? poolData && isCombinatorialToken(outcomeAsset)
                ? poolData.outcomeCombinations.find((combo: any) => 
                    combo.assetId.CombinatorialToken === outcomeAsset.CombinatorialToken
                  )?.name || "Combinatorial"
                : market?.categories
                ? market.categories[getIndexOf(outcomeAsset as MarketOutcomeAssetId)].name ?? ""
                : ""
              : ""
          }
          baseTokenAmount={
            tabType === TradeTabType.Buy
              ? amountIn?.div(ZTG)
              : amountReceived?.div(ZTG)
          }
          baseToken={baseSymbol}
          marketId={marketId}
          marketQuestion={poolData?.question || market?.question || ""}
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
          <div className="flex">
            <Tab.List
              className={`h-[51px] w-[75%] text-center text-ztg-18-150 font-medium ${
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
            <OrderTypeSelector
              onTypeSelected={(type) => {
                setOrderType(type);
              }}
              value={orderType}
            />
          </div>
          <Tab.Panels className="p-[30px]">
            {orderType === "market" ? (
              <>
                            <Tab.Panel>
              <BuyForm
                marketId={marketId}
                poolData={poolData}
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
                poolData={poolData}
                initialAsset={initialAsset}
                onSuccess={(data, asset, amount) => {
                  handleSuccess(data);
                  setOutcomeAsset(asset);
                  setAmountIn(amount);
                }}
              />
            </Tab.Panel>
              </>
            ) : (
              <>
                <Tab.Panel>
                  <LimitBuyOrderForm
                    marketId={marketId}
                    initialAsset={initialAsset}
                  />
                </Tab.Panel>
                <Tab.Panel>
                  <LimitSellOrderForm
                    marketId={marketId}
                    initialAsset={initialAsset}
                  />
                </Tab.Panel>
              </>
            )}
          </Tab.Panels>
        </Tab.Group>
      )}
    </>
  );
};

type OrderType = "market" | "limit";

const OrderTypeSelector = ({
  onTypeSelected,
  value,
}: {
  onTypeSelected: (type: OrderType) => void;
  value: OrderType;
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleTypeClick = (type: OrderType) => {
    onTypeSelected(type);
    setMenuOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  return (
    <div className="relative flex w-[25%] items-center justify-center">
      <button
        onClick={() => setMenuOpen((open) => !open)}
        className="flex w-full items-center justify-center px-5"
      >
        <div>{value === "market" ? "Market" : "Limit"}</div>
        <ChevronDown className="ml-auto" size={16} />
      </button>

      {menuOpen && (
        <div
          ref={wrapperRef}
          className="absolute top-[52px] flex w-32 flex-col gap-y-3 rounded-lg bg-white p-4 shadow-[0px_4px_20px_0px_#00000040]"
        >
          <button
            className={`${
              value === "market" ? "font-medium text-black" : "text-sky-600"
            } `}
            onClick={() => handleTypeClick("market")}
          >
            Market
          </button>
          <button
            className={`${
              value === "limit" ? "font-medium text-black" : "text-sky-600"
            } `}
            onClick={() => handleTypeClick("limit")}
          >
            Limit
          </button>
        </div>
      )}
    </div>
  );
};

export default Amm2TradeForm;
