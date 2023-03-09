import PercentageChange from "components/ui/PercentageChange";
import { useExchangeStore } from "lib/stores/ExchangeStore";
import { useNavigationStore } from "lib/stores/NavigationStore";
import { useStore } from "lib/stores/Store";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { ReactFragment, useEffect, useMemo, useState } from "react";
import { useZtgInfo } from "lib/hooks/queries/useZtgInfo";

import ExchangeBox from "../exchange/ExchangeBox";
import LiquidityPoolsBox from "../liquidity/LiquidityPoolsBox";
import TradeForm from "../trade-form";
import Tabs from "../ui/Tabs";
import Drawer from "./Drawer";
import { TradeItem, TradeItemContext, useTradeItem } from "lib/hooks/trade";
import { MarketId } from "@zeitgeistpm/sdk-next";

const ZTGSummary = observer(() => {
  const { data: ztgInfo } = useZtgInfo();

  return (
    <div className="flex px-ztg-28 items-center ">
      <div className=" flex items-center justify-center rounded-ztg-10 flex-shrink-0 mb-auto mt-ztg-5">
        <img src="/icons/ZTG.svg" alt="logo" />
      </div>

      <div className="flex flex-col ml-ztg-12 mr-ztg-6">
        <div className=" text-ztg-16-150 font-bold text-sky-1100 dark:text-white">
          ZTG
        </div>
        <div className=" text-ztg-12-150 text-sky-600 w-ztg-90 ">Zeitgeist</div>
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

type DisplayMode = "default" | "liquidity";

const Box = observer(
  ({ mode, tabIndex }: { mode: DisplayMode; tabIndex: number }) => {
    const withSpacing = (children: ReactFragment) => {
      return (
        <div className="px-ztg-28 mt-ztg-20 overflow-auto">{children}</div>
      );
    };
    const exchangeStore = useExchangeStore();
    const trade = useTradeItem();

    switch (mode) {
      case "default":
        return tabIndex === 0
          ? withSpacing(trade?.data && <TradeForm />)
          : withSpacing(<ExchangeBox exchangeStore={exchangeStore} />);
      case "liquidity":
        return withSpacing(
          tabIndex === 0 ? (
            <LiquidityPoolsBox />
          ) : (
            <ExchangeBox exchangeStore={exchangeStore} />
          ),
        );
      default:
        return tabIndex === 0
          ? withSpacing(trade?.data && <TradeForm />)
          : withSpacing(<ExchangeBox exchangeStore={exchangeStore} />);
    }
  },
);

const RightDrawer = observer(() => {
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const router = useRouter();
  const store = useStore();
  const { wallets } = store;

  const displayMode: DisplayMode = useMemo<DisplayMode>(() => {
    if (router.query.poolid !== undefined) {
      return "liquidity";
    } else {
      return "default";
    }
  }, [router, wallets.activeAccount]);

  const tabLabels = useMemo(() => {
    switch (displayMode) {
      case "default":
        return ["Trade", "Exchange"];
      case "liquidity":
        return ["Liquidity Pools", "Exchange"];
      default:
        return ["Trade", "Exchange"];
    }
  }, [displayMode]);

  return (
    <Drawer
      side="right"
      className="bg-sky-100 !fixed sm:!block right-0 z-50 w-0"
    >
      <div className="h-full">
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
          <Box tabIndex={activeTabIndex} mode={displayMode} />
          <div className="mt-auto" />
          <div className="p-ztg-28 pt-0">
            <button
              className="border-solid border-1 border-sky-600 rounded-ztg-10 flex flex-row h-ztg-64 w-full items-center"
              onClick={() => window.open("https://discord.gg/xv8HuA4s8v")}
            >
              <div className="w-1/4 flex justify-center items-center">
                <img src="/support.png" className="w-ztg-18 h-ztg-18" />
              </div>
              <p className="font-bold text-sky-600  text-ztg-16-150">
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
