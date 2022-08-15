import { observer } from "mobx-react";
import { useRouter } from "next/router";
import React, { ReactFragment, useEffect, useMemo, useState } from "react";
import { useNavigationStore } from "lib/stores/NavigationStore";
import { useTradeSlipStore } from "lib/stores/TradeSlipStore";
import { useStore } from "lib/stores/Store";
import MarketStore from "lib/stores/MarketStore";
import { useExchangeStore } from "lib/stores/ExchangeStore";
import PercentageChange from "components/ui/PercentageChange";
import ReportBox from "components/outcomes/ReportBox";
import DisputeBox from "components/outcomes/DisputeBox";
import RedeemBox from "components/outcomes/RedeemBox";

import TradeSlip from "../trade-slip";
import LiquidityPoolsBox from "../liquidity/LiquidityPoolsBox";
import Drawer from "./Drawer";
import Tabs from "../ui/Tabs";
import ExchangeBox from "../exchange/ExchangeBox";

const ZTGSummary = observer(() => {
  const { ztgInfo } = useStore();

  return (
    <div className="flex px-ztg-28 items-center ">
      <div className=" flex items-center justify-center rounded-ztg-10 flex-shrink-0 mb-auto mt-ztg-5">
        <img src="/icons/ZTG.svg" alt="logo" />
      </div>

      <div className="flex flex-col ml-ztg-12 mr-ztg-6">
        <div className="font-space text-ztg-16-150 font-bold text-sky-1100 dark:text-white">
          ZTG
        </div>
        <div className="font-lato text-ztg-12-150 text-sky-600 w-ztg-90 ">
          Zeitgeist
        </div>
      </div>
      {ztgInfo ? (
        <>
          <div className="bg-white dark:bg-sky-700 dark:text-white font-mono px-ztg-12 py-ztg-6 rounded-full text-ztg-12-120 text-center whitespace-nowrap mr-ztg-12">
            = ${ztgInfo?.price.toFixed(2) ?? 0}
          </div>
          <PercentageChange change={ztgInfo?.change.toFixed(0) ?? "0"} />
        </>
      ) : (
        <></>
      )}
    </div>
  );
});

type DisplayMode = "default" | "liquidity" | "report" | "dispute" | "redeem";

const Box = observer(
  ({
    mode,
    tabIndex,
    market,
    onAction,
  }: {
    mode: DisplayMode;
    tabIndex: number;
    market: MarketStore;
    onAction: () => void;
  }) => {
    const withSpacing = (children: ReactFragment) => {
      return (
        <div className="px-ztg-28 mt-ztg-20 overflow-auto">{children}</div>
      );
    };
    const exchangeStore = useExchangeStore();

    switch (mode) {
      case "default":
        return tabIndex === 0 ? (
          <TradeSlip />
        ) : (
          withSpacing(<ExchangeBox exchangeStore={exchangeStore} />)
        );
      case "liquidity":
        return withSpacing(
          tabIndex === 0 ? (
            <LiquidityPoolsBox />
          ) : (
            <ExchangeBox exchangeStore={exchangeStore} />
          ),
        );
      case "report":
        return tabIndex === 0 ? (
          <TradeSlip />
        ) : (
          withSpacing(<ReportBox marketStore={market} onReport={onAction} />)
        );
      case "dispute":
        return tabIndex === 0 ? (
          <TradeSlip />
        ) : (
          withSpacing(<DisputeBox marketStore={market} onDispute={onAction} />)
        );
      case "redeem":
        return tabIndex === 0 ? (
          <TradeSlip />
        ) : (
          withSpacing(<RedeemBox marketStore={market} onRedeem={onAction} />)
        );
      default:
        return tabIndex === 0 ? (
          <TradeSlip />
        ) : (
          withSpacing(<ExchangeBox exchangeStore={exchangeStore} />)
        );
    }
  },
);

const RightDrawer = observer(() => {
  const navigationStore = useNavigationStore();
  const { currentPage } = navigationStore;
  const tradeSlipStore = useTradeSlipStore();

  const showSecondTab = () =>
    navigationStore.checkPage("index") || navigationStore.checkPage("markets");

  const [activeTabIndex, setActiveTabIndex] = useState(showSecondTab() ? 1 : 0);
  const [market, setMarket] = useState<MarketStore | null>();
  const router = useRouter();
  const { marketid } = router.query;
  const store = useStore();
  const { markets, wallets } = store;

  const displayMode: DisplayMode = useMemo<DisplayMode>(() => {
    if (router.query.poolid !== undefined) {
      return "liquidity";
    } else if (!navigationStore.checkPage("marketDetails")) {
      return "default";
    } else if (market) {
      const endDate = market.endTimestamp;
      const now = store.blockTimestamp;
      if (now <= endDate) {
        //market hasn't ended
        return "default";
      } else if (market.inReportPeriod) {
        return "report";
      } else if (market.status === "Reported" || market.status === "Disputed") {
        return "dispute";
      } else if (market.status === "Resolved") {
        return "redeem";
      }
    } else {
      return "default";
    }
  }, [router, wallets.activeAccount, market?.status, currentPage]);

  const tabLabels = useMemo(() => {
    switch (displayMode) {
      case "default":
        return ["Trade Slip", "Exchange"];
      case "liquidity":
        return ["Liquidity Pools", "Exchange"];
      case "report":
        return ["Trade Slip", "Report Outcome"];
      case "dispute":
        return ["Trade Slip", "Dispute Outcome"];
      case "redeem":
        return ["Trade Slip", "Redeem"];
      default:
        return ["Trade Slip", "Exchange"];
    }
  }, [displayMode]);

  useEffect(() => {
    (async () => {
      if (marketid && markets) {
        const market = await markets.getMarket(Number(marketid));
        setMarket(market);
      }
    })();
  }, [marketid, markets]);

  useEffect(() => {
    if (showSecondTab()) {
      setActiveTabIndex(1);
    } else {
      setActiveTabIndex(0);
    }
  }, [navigationStore.currentPage]);

  useEffect(() => {
    setActiveTabIndex(0);
  }, [tradeSlipStore.tradeSlipItems.length]);

  const handleMarketChange = async () => {
    const market = await markets.getMarket(Number(marketid));
    setMarket(market);
  };

  return (
    <Drawer side="right" className="bg-sky-100 dark:bg-black">
      <div className="h-full dark:bg-black">
        <div className="mt-ztg-10 h-full flex flex-col">
          <ZTGSummary />
          {tabLabels ? (
            <Tabs
              labels={tabLabels}
              active={activeTabIndex}
              onTabChange={setActiveTabIndex}
              className="mt-ztg-25 px-ztg-28"
            />
          ) : (
            <></>
          )}
          <Box
            tabIndex={activeTabIndex}
            mode={displayMode}
            market={market}
            onAction={handleMarketChange}
          />
          <div className="mt-auto" />
          <div className="p-ztg-28 pt-0">
            <button
              className="border-solid border-1 border-sky-600 rounded-ztg-10 flex flex-row h-ztg-64 w-full items-center"
              onClick={() => window.open("https://discord.gg/xv8HuA4s8v")}
            >
              <div className="w-1/4 flex justify-center items-center">
                <img src="/support.png" className="w-ztg-18 h-ztg-18" />
              </div>
              <p className="font-bold text-sky-600 font-lato text-ztg-16-150">
                Feedback and Support
              </p>
            </button>
          </div>
        </div>
      </div>
    </Drawer>
  );
});

export default RightDrawer;
